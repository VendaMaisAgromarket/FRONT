import { changeCartProductAmount, removeItemFromCart } from '@/actions/cart';
import { useShoppingCartStore } from '@/store/shoppingCartStore';
import { CartDataProduct } from '@/types/types';
import { moneyMask } from '@/utils/functions';
import { ImageOff, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { toast } from 'sonner';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '../ui/alert-dialog';
import AmountSelector from './AmountSelector';
import { HarvestCertifiedBadgeByProduct } from '../certifications/HarvestCertifiedBadge';

interface CartItemProps {
	isSelected: boolean;
	data: CartDataProduct;
	onToggleSelect: (id: string) => void;
}

export default function CartItem({
	isSelected,
	data,
	onToggleSelect,
}: CartItemProps) {
	const [isAmountSelectorLoading, setIsAmountSelectorLoading] = useState(false);
	const { removeProduct } = useShoppingCartStore();
	const subtotal = data.sellingUnitProduct.minPrice * data.amount;

	async function onItemRemove(product: CartDataProduct) {
		const res = await removeItemFromCart(product.id);

		if (res.success) {
			removeProduct({
				productId: product.id,
				sellingUnitProductId: product.sellingUnitProductId,
			});

			toast.success(
				`${product.amount} ${product.sellingUnitProduct.unit.unit} de ${product.product.name} foram removidos do seu carrinho.`
			);
		}
	}

	async function changeProductAmount(
		id: string,
		newAmount: number,
		unitaryPrice: number //TODO: remover esse dado quando o backend estiver fazendo o cálculo
	) {
		setIsAmountSelectorLoading(true);

		const newValue = newAmount * unitaryPrice;
		const payload = {
			amount: newAmount,
			value: newValue,
		};

		const res = await changeCartProductAmount(id, payload);

		if (!res.ok) {
			toast.error(res.message);
		}

		setIsAmountSelectorLoading(false);
	}

	return (
		<div className="p-4 border-b last:border-b-0">
			<div className="grid grid-cols-[0.2fr_1fr_1fr_1fr] sm:grid-cols-[0.2fr_1.8fr_0.5fr_1.6fr_1fr] items-center">
				<div>
					<input
						type="checkbox"
						checked={isSelected}
						onChange={() => onToggleSelect(data.id)}
						className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
					/>
				</div>

				<div className="flex items-center">
					<div className="w-16 h-16 mr-3 relative rounded-md overflow-hidden">
						{data.product.images_Path.length ? (
							<Image
								src={data.product.images_Path[0]}
								alt={`Imagem de ${data.product.name}`}
								fill
								className="rounded-md object-cover"
							/>
						) : (
							<div className="flex size-full items-center justify-center text-neutral-300 bg-neutral-100">
								<ImageOff size={14} />
							</div>
						)}
					</div>

					<div className="flex flex-col gap-2 items-start w-min xl:w-auto">
						<div>
							<h3 className="font-medium">{data.product.name}</h3>
							<p className="text-sm text-gray-500">
								{data.sellingUnitProduct.unit.title}
							</p>
							<HarvestCertifiedBadgeByProduct
								productId={data.product.id}
								className="mt-1"
							/>
						</div>
					</div>
				</div>

				<div className="text-center hidden sm:block">
					{moneyMask(data.sellingUnitProduct.minPrice)}
				</div>

				<div className="flex items-center justify-center">
					{
						<AmountSelector
							amount={data.amount}
							increaseHandler={() =>
								changeProductAmount(
									data.id,
									data.amount + 1,
									data.sellingUnitProduct.minPrice
								)
							}
							decreaseHandler={() =>
								changeProductAmount(
									data.id,
									data.amount - 1,
									data.sellingUnitProduct.minPrice
								)
							}
							changeHandler={(newAmount) =>
								changeProductAmount(
									data.id,
									newAmount,
									data.sellingUnitProduct.minPrice
								)
							}
							loading={isAmountSelectorLoading}
						/>
					}
				</div>

				<div className="text-right flex items-center justify-end sm:justify-start">
					<span className="font-medium">{moneyMask(subtotal)}</span>

					<AlertDialog>
						<AlertDialogTrigger className="text-red-400 ml-4 cursor-pointer hover:text-red-500">
							<Trash2 size={18} />
						</AlertDialogTrigger>

						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>
									Você tem certeza que deseja remover o produto?
								</AlertDialogTitle>

								<AlertDialogDescription>
									Ao confirmar você estará removendo{' '}
									<span className="font-semibold text-red-400">
										{data.amount} {data.sellingUnitProduct.unit.unit} de{' '}
										{data.product.name}
									</span>{' '}
									do seu carrinho de compras.
								</AlertDialogDescription>
							</AlertDialogHeader>

							<AlertDialogFooter>
								<AlertDialogCancel>Cancelar</AlertDialogCancel>

								<AlertDialogAction
									onClick={() => onItemRemove(data)}
									className="bg-red-400 hover:bg-red-500"
								>
									Remover
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</div>
			</div>
		</div>
	);
}

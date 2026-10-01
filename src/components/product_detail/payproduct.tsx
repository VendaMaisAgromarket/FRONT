'use client';

import { addProductToCart } from '@/actions/cart';
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@/components/ui/accordion';
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@/components/ui/tooltip';
import { useShoppingCartStore } from '@/store/shoppingCartStore';
import { useCheckoutStore } from '@/store/useCheckoutStore';
import { useUserStore } from '@/store/userInfoStore';
import { UnitData } from '@/types/types';
import { harvestAtStyles } from '@/utils/data';
import { formatDate } from '@/utils/functions';
import {
	CreditCard,
	HandCoins,
	Minus,
	Plus,
	ShoppingCart,
	X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { isWip } from '@/utils/mappers/mapPaymentMethodToData';
import ProductDetailImagesViewer from './ProductDetailImagesViewer';

type ProductBuyingInfo = {
	id: string;
	name: string;
	images: string[];
	units: {
		id: string;
		unitId: string;
		minPrice: number;
		productId: string;
		unit: UnitData;
	}[];
	sellerId: string;
	createdAt: string;
	sellerName: string;
	isNegotiable: boolean;
	harvestAt: string;
};

type ProductHarvestStatus = keyof typeof harvestAtStyles;

const CompraProduto = ({
	id,
	name: productName,
	images,
	units,
	sellerId,
	createdAt,
	sellerName,
	isNegotiable,
	harvestAt,
}: ProductBuyingInfo) => {
	const [quantity, setQuantity] = useState(1);
	const [selectedUnit, setSelectedUnit] = useState<{
		id: string;
		unitId: string;
		minPrice: number;
		productId: string;
		unit: { unit: string; title: string };
	}>(units?.[0] ?? null);
	// const [selectedImage, setSelectedImage] = useState(0);
	const [showPaymentModal, setShowPaymentModal] = useState(false);
	const router = useRouter();
	const { user } = useUserStore();
	const { addNewProduct } = useShoppingCartStore();

	async function handleAddNewProduct() {
		if (user && sellerId) {
			const payload = {
				userId: user.id,
				productId: id,
				sellingUnitProductId: selectedUnit.id,
				amount: quantity,
				value: selectedUnit.minPrice,
			};
			const res = await addProductToCart(payload);

			if (!res.success) {
				toast.error(
					`Erro ao adicionar ${quantity} ${selectedUnit.unit.unit}${quantity > 1 ? 's' : ''
					} de ${productName} ao carrinho.`
				);
				return;
			}

			addNewProduct({
				productId: payload.productId,
				sellingUnitProductId: payload.sellingUnitProductId,
			});

			toast.success(
				`${quantity} ${selectedUnit.unit.unit}${quantity > 1 ? 's' : ''
				} de ${productName} adicionado ao carrinho!`
			);
			return;
		}

		toast.error(
			'Você deve realizar o login para adicionar um produto ao carrinho.',
			{}
		);
		router.push('/login');
	}

	const decreaseQuantity = () => {
		if (quantity > 1) {
			setQuantity(quantity - 1);
		}
	};

	const setCheckoutData = useCheckoutStore((s) => s.setCheckoutData);

	function comprarAgora() {
		const data = {
			sellersData: [
				{
					sellerId,
					sellerName,
				},
			],
			products: [
				{
					productId: id,
					sellingUnitProductId: selectedUnit.id,
					value: selectedUnit.minPrice,
					amount: quantity,
				},
			],
			total: quantity * selectedUnit.minPrice,
		};

		setCheckoutData(data);
		router.push('/market/pre-checkout');
	}

	function harvestStatus(): ProductHarvestStatus {
		const today = new Date();
		const oneWeekFromNow = new Date(today);
		oneWeekFromNow.setDate(today.getDate() + 7);
		const fifteenDaysFromNow = new Date(today);
		fifteenDaysFromNow.setDate(today.getDate() + 15);
		const harvestDate = new Date(harvestAt);

		if (harvestDate <= today) {
			return 'C';
		} else if (harvestDate <= oneWeekFromNow) {
			return 'W';
		} else if (harvestDate <= fifteenDaysFromNow) {
			return 'Q';
		} else {
			return 'N';
		}
	}

	const increaseQuantity = () => {
		setQuantity(quantity + 1);
	};

	// Modal para opções de pagamento
	const PaymentModal = () => {
		return (
			<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
				<div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
					<div className="flex justify-between items-center mb-4">
						<h3 className="text-lg font-semibold flex items-center gap-2">
							<CreditCard size={20} />
							Opções de Pagamento
						</h3>
						<button
							onClick={() => setShowPaymentModal(false)}
							className="text-gray-500 hover:text-gray-700"
						>
							<X size={20} />
						</button>
					</div>

					<Accordion type="single" collapsible className="w-full">
						<AccordionItem value="item-1" disabled={isWip('cartão')}>
							<AccordionTrigger className="font-medium">
								Cartão de Crédito
							</AccordionTrigger>
							<AccordionContent>
								{isWip('cartão') ? (
									<p className="text-sm text-gray-600">
										Em breve. Estamos finalizando a integração segura com o novo
										gateway de pagamento.
									</p>
								) : (
									<>
										<p className="text-sm text-gray-600">
											Até 12x sem juros. Parcela mínima de R$ 5,00.
										</p>
										<div className="flex gap-2 mt-2">
											<div className="bg-gray-100 rounded p-1">Visa</div>
											<div className="bg-gray-100 rounded p-1">Mastercard</div>
											<div className="bg-gray-100 rounded p-1">Elo</div>
										</div>
									</>
								)}
							</AccordionContent>
						</AccordionItem>

						<AccordionItem value="item-3">
							<AccordionTrigger className="font-medium">
								Boleto Bancário
							</AccordionTrigger>
							<AccordionContent>
								<p className="text-sm text-gray-600">
									Prazo de 1 dia útil para compensação. Desconto de 5% no valor
									final.
								</p>
							</AccordionContent>
						</AccordionItem>

						<AccordionItem value="item-4">
							<AccordionTrigger className="font-medium">Pix</AccordionTrigger>
							<AccordionContent>
								<p className="text-sm text-gray-600">
									Pagamento instantâneo. Desconto de 10% no valor final.
								</p>
							</AccordionContent>
						</AccordionItem>
					</Accordion>

					<button
						onClick={() => setShowPaymentModal(false)}
						className="mt-6 w-full py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
					>
						Fechar
					</button>
				</div>
			</div>
		);
	};

	return (
		<div className="flex flex-col lg:flex-row gap-8 p-4">
			<ProductDetailImagesViewer images={images} productName={productName} />

			{/* Right side - Product Info */}
			<div className="lg:w-4/5">
				<h1 className="text-2xl font-bold text-gray-900">{productName}</h1>
				<p className="text-sm text-gray-600 mt-1">
					Anunciado em: {formatDate(createdAt)}
				</p>
				<div
					className={`${harvestAtStyles[harvestStatus()].color
						} flex gap-1 items-center text-sm mt-1`}
				>
					<Tooltip>
						<TooltipTrigger asChild>
							{harvestAtStyles[harvestStatus()].icon}
						</TooltipTrigger>
						<TooltipContent>
							<p>{harvestAtStyles[harvestStatus()].tooltipMessage || ''}</p>
						</TooltipContent>
					</Tooltip>
					<p>Estimativa de colheita: {formatDate(harvestAt)}</p>
				</div>

				<div className="mt-6">
					<h4>Preço mínimo</h4>
					<div className="text-3xl font-bold text-gray-900">
						{selectedUnit ? (
							<>
								R$ {selectedUnit.minPrice.toFixed(2).replace('.', ',')}
								<span className="text-primary text-sm">
									/{selectedUnit.unit.unit}
								</span>
							</>
						) : (
							<span className="text-gray-500 text-xl">Indisponível</span>
						)}
					</div>
				</div>
				<div className="mt-8">
					<div className="flex items-center">
						<span className="mr-4 text-gray-700">Quantidade</span>
						<div className="flex items-center border border-gray-300 rounded">
							<button
								onClick={decreaseQuantity}
								className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-l"
								aria-label="Diminuir quantidade"
							>
								<Minus size={16} />
							</button>
							<input
								type="text"
								inputMode="numeric"
								value={quantity}
								onChange={(e) => {
									const digitsOnly = e.target.value.replace(/\D/g, '');
									setQuantity(digitsOnly ? Number(digitsOnly) : 0);
								}}
								onBlur={() => {
									if (quantity < 1) setQuantity(1);
								}}
								className="w-12 text-center border-x border-gray-300 py-1 focus:outline-none"
							/>
							<button
								onClick={increaseQuantity}
								className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-r"
								aria-label="Aumentar quantidade"
							>
								<Plus size={16} />
							</button>
						</div>

						<div className="ml-4">
							<span className="text-gray-700 mr-2">Und.</span>
							<select
								onChange={(e) => {
									const unit = units.find((u) => u.unitId === e.target.value);
									if (unit) setSelectedUnit(unit);
								}}
								className="border border-gray-300 rounded py-1 px-2 bg-white"
								disabled={!units || units.length === 0}
							>
								{units && units.map((u) => {
									return (
										<option key={u.id} value={u.unitId}>
											{u.unit.unit}
										</option>
									);
								})}
							</select>
						</div>
					</div>
				</div>

				<div className="mt-4">
					<button
						onClick={() => setShowPaymentModal(true)}
						className="text-green-600 hover:underline text-sm flex items-center gap-1"
					>
						<CreditCard size={16} />
						Ver opções de pagamento
					</button>
				</div>

				<div className="flex flex-col mt-8 gap-4">
					<button
						type="button"
						className="flex items-center justify-center gap-2 py-3 px-4 border-2 border-green-700 rounded-md text-green-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
						onClick={handleAddNewProduct}
						disabled={!selectedUnit}
					>
						<ShoppingCart size={20} />
						<span>Adicionar ao Carrinho</span>
					</button>
					{isNegotiable && (
						<Tooltip>
							<TooltipTrigger asChild>
								<button
									type="button"
									className="flex items-center justify-center gap-2 py-3 px-4 border-2 border-green-700 rounded-md text-green-700 cursor-pointer disabled:text-neutral-500 disabled:border-neutral-500 disabled:cursor-not-allowed"
									disabled
								>
									<HandCoins size={20} />
									<span>Fazer Oferta</span>
								</button>
							</TooltipTrigger>
							<TooltipContent>
								<p>Funcionalidade em desenvolvimento</p>
							</TooltipContent>
						</Tooltip>
					)}
					<button
						type="button"
						className="py-3 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
						onClick={comprarAgora}
						disabled={!selectedUnit}
					>
						Comprar Agora
					</button>
				</div>
			</div>

			{/* Modals */}
			{showPaymentModal && <PaymentModal />}
		</div>
	);
};

export default CompraProduto;

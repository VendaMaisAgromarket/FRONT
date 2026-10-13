'use client';

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
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate, moneyMask } from '@/utils/functions';
import { LoaderCircle } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import ProductCardCarousel from '@/components/ProductCardImageCarousel';

type ProductCardProps = {
	data: {
		id: string;
		name: string;
		category: string;
		price: number;
		sellingUnit: string;
		createdAt: string;
		harvestAt: string;
		isNegotiable: boolean;
		variety: string;
		images: string[];
		isActive: boolean;
	};
	handleRemoveProduct: () => void;
};

export default function ProductCard({
	data,
	handleRemoveProduct,
}: ProductCardProps) {
	const [isRemoving, setIsRemoving] = useState(false);

	const handleRemove = async () => {
		setIsRemoving(true);
		try {
			await handleRemoveProduct();
		} finally {
			setIsRemoving(false);
		}
	};

	return (
		<div className="border rounded-md overflow-hidden">
			<div className="flex items-center justify-center bg-white relative">
				{data.images.length && <ProductCardCarousel images={data.images} />}

				{data.isNegotiable && (
					<Badge variant="default" className="absolute top-2 right-2">
						Negociável
					</Badge>
				)}

				{!data.isActive && (
					<Badge variant="destructive" className="absolute top-2 left-2">
						Inativo
					</Badge>
				)}
			</div>
			<div className="p-4">
				<h3 className="text-xl font-semibold">{data.name}</h3>
				<p className="text-gray-600 text-sm">Categoria: {data.category}</p>
				<p className="text-gray-600 text-sm">Variedade: {data.variety}</p>
				<p className="text-sm text-gray-600">
					Estimativa de colheita: {formatDate(data.harvestAt)}
				</p>
				{!data.isActive && (
					<p className="text-sm text-red-700">
						Fora da vitrine. Atualize a data de colheita para reativar.
					</p>
				)}
				<p className="text-sm text-gray-600">
					Anunciado em: {formatDate(data.createdAt)}
				</p>
				<p className="font-bold mt-2">
					{moneyMask(data.price)}/{data.sellingUnit}
				</p>
				<div className="flex flex-wrap mt-4 justify-between space-y-2 xl:space-y-0">
					<Link
						href={`/market/edit-product/${data.id}`}
						className="w-full xl:w-auto"
					>
						<Button className="w-full xl:w-32 bg-green-600 text-white py-2 rounded-md hover:bg-green-700">
							Editar
						</Button>
					</Link>
					<AlertDialog>
						<AlertDialogTrigger asChild>
							<Button className="w-full xl:w-32" variant="destructive">
								Remover
							</Button>
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
								<AlertDialogDescription>
									Tem certeza que deseja remover este produto? Esta ação não
									pode ser desfeita.
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>Cancelar</AlertDialogCancel>
								<AlertDialogAction
									onClick={handleRemove}
									disabled={isRemoving}
									className="bg-red-600 hover:bg-red-700 disabled:opacity-50"
								>
									{isRemoving ? (
										<>
											<LoaderCircle size={16} className="animate-spin mr-2" />
											Removendo...
										</>
									) : (
										'Confirmar'
									)}
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
					<Link
						href={`/market/create-product?retrieveDataFrom=${data.id}`}
						className="w-full"
					>
						<Button className="w-full bg-zinc-900 hover:bg-zinc-950 mt-0 xl:mt-2">
							Duplicar produto
						</Button>
					</Link>
				</div>
			</div>
		</div>
	);
}

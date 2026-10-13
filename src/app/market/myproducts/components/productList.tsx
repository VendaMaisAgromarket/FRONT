'use client';

import { removeProductAction } from '@/actions/product';
import { Button } from '@/components/ui/button';
import { SellerProductList } from '@/types/types';
import { isHarvestAvailable } from '@/utils/functions';
import { PackagePlus } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import ProductCard from './productCard';

export default function ProductListClient({
	initialProducts,
}: {
	initialProducts: SellerProductList[];
}) {
	const [products, setProducts] =
		useState<SellerProductList[]>(initialProducts);

	useEffect(() => {
		setProducts(initialProducts);
	}, [initialProducts]);

	async function handleRemoveProductClient(id: string) {
		try {
			const result = await removeProductAction(id);
			if (!result.success) {
				toast.error(result.message || 'Erro ao remover produto, por favor tente novamente.');
				return;
			}
			setProducts(products.filter((p) => p.id !== id));
			toast.success('Produto deletado com sucesso.');
		} catch (error) {
			console.error('Error removing product:', error);
			toast.error('Erro ao remover produto, por favor tente novamente.');
		}
	}

	if (products.length === 0) {
		return (
			<div className="w-full bg-white border border-gray-200 rounded-lg overflow-hidden">
				<div className="flex flex-col items-center justify-center py-16 px-4 text-center">
					<p className="text-lg text-muted-foreground mb-4">
						Você ainda não tem nenhum produto cadastrado.
					</p>
					<Button asChild variant="default">
						<Link href="/market/create-product">
							<PackagePlus className="mr-2 h-4 w-4" />
							Cadastrar Produto
						</Link>
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
			{products.map((p) => {
				const firstUnit = p.sellingUnitProduct[0];
				return (
					<ProductCard
						key={p.id}
						data={{
							id: p.id,
							images: p.images_Path,
							name: p.name,
							category: p.category,
							price: firstUnit?.minPrice ?? 0,
							sellingUnit: firstUnit?.unit?.unit ?? 'Indisponível',
							createdAt: p.createdAt,
							harvestAt: p.harvestAt,
							isNegotiable: p.isNegotiable,
							variety: p.variety,
							// Desativado pelo vendedor ou com a colheita já encerrada
							isActive: p.status && isHarvestAvailable(p.harvestAt),
						}}
						handleRemoveProduct={handleRemoveProductClient.bind(null, p.id)}
					/>
				);
			})}
		</div>
	);
}

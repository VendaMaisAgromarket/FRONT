import { MarketProductCardType } from '@/types/types';
import Link from 'next/link';
import ProductCardImageCarousel from './ProductCardImageCarousel';
import { moneyMask } from '@/utils/functions';
import FarmCertifiedBadge from './certifications/FarmCertifiedBadge';

export default function MarketProductCard({
	product,
}: {
	product: MarketProductCardType;
}) {
	return (
		<Link href={`/market/product_detail/${product.id}`}>
			<div className="flex flex-col bg-white w-64 min-h-72 rounded-xl border border-gray-5 space-y-3 overflow-hidden">
				<ProductCardImageCarousel images={product.images_Path} />
				<div className="px-4 py-2">
					<h4 className="text-lg">{product.name}</h4>
					<h3 className="font-semibold text-2xl text-primary">
						{product.sellingUnitProduct?.[0] ? (
							<>
								{moneyMask(product.sellingUnitProduct[0].minPrice)}
								<span className="text-sm text-gray-3 font-normal">
									/{product.sellingUnitProduct[0].unit.unit}
								</span>
							</>
						) : (
							<span className="text-sm text-gray-500">Indisponível</span>
						)}
					</h3>
					{product.seller && (
						<h4 className="text-sm text-gray-600">
							Vendido por:{' '}
							<span className="text-primary font-semibold">
								{product.seller.name}
							</span>
						</h4>
					)}
					<FarmCertifiedBadge
						certifications={product.seller?.farmCertifications}
						className="mt-1"
					/>
				</div>
			</div>
		</Link>
	);
}

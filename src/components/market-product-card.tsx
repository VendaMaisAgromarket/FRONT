import { MarketProductCardType } from '@/types/types';
import Link from 'next/link';
import ProductCardImageCarousel from './ProductCardImageCarousel';
import { moneyMask } from '@/utils/functions';
import FarmCertifiedBadge from './certifications/FarmCertifiedBadge';
import HarvestCertifiedBadge from './certifications/HarvestCertifiedBadge';

export default function MarketProductCard({
	product,
}: {
	product: MarketProductCardType;
}) {
	const href = `/market/product_detail/${product.id}`;
	const certifications = product.seller?.farmCertifications;
	const harvest = product.harvestCertification;

	return (
		<div className="flex flex-col bg-white w-64 min-h-72 rounded-xl border border-gray-5 overflow-hidden">
			{/* Imagem: link próprio, fora da ordem de tabulação (o link acessível é o nome) */}
			<Link href={href} tabIndex={-1} aria-hidden="true">
				<ProductCardImageCarousel images={product.images_Path} />
			</Link>
			{/*
			 * Área de texto com "link esticado": o link do nome cobre toda a área (::after), e os selos
			 * ficam acima dele (relative z-10). Assim os selos ficam entre o nome e o preço sem que o
			 * botão do popover fique dentro de <a>.
			 */}
			<div className="relative flex-1 px-4 py-2 mt-3">
				<h4 className="text-lg">
					<Link
						href={href}
						className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:rounded-b-xl focus-visible:after:ring-2 focus-visible:after:ring-primary focus-visible:after:ring-inset"
					>
						{product.name}
					</Link>
				</h4>
				{(certifications?.length || harvest) && (
					<div className="relative z-10 flex flex-wrap gap-1 my-1 w-fit">
						<FarmCertifiedBadge certifications={certifications} />
						<HarvestCertifiedBadge certification={harvest} />
					</div>
				)}
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
			</div>
		</div>
	);
}

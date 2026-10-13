import MarketProductCard from "@/components/market-product-card";
import Navbar from "@/components/navbar";
import { MarketProductCardType } from "@/types/types";
import { PackageSearch } from "lucide-react";
import Link from "next/link";

type MarketProductListProps = {
	title: string;
	products: MarketProductCardType[];
	emptyTitle: string;
	emptyDescription: string;
};

export default function MarketProductList({
	title,
	products,
	emptyTitle,
	emptyDescription,
}: MarketProductListProps) {
	if (!products.length) {
		return (
			<>
				<Navbar />
				<div className="flex flex-col items-center gap-8 bg-white p-8 m-auto max-w-[700px] w-4/5 mt-14 rounded-xl md:gap-14 md:flex-row">
					<PackageSearch className="text-primary size-24 shrink-0" />
					<div className="space-y-2">
						<h4 className="font-semibold text-xl">{emptyTitle}</h4>
						<p className="text-sm">{emptyDescription}</p>
						<Link
							href="/market#categorias"
							className="inline-block text-sm text-primary font-semibold hover:underline"
						>
							Ver outras categorias
						</Link>
					</div>
				</div>
			</>
		);
	}

	return (
		<>
			<Navbar />
			<section className="flex flex-col mt-0 max-w-7xl m-auto mb-14 w-10/12 lg:flex-row lg:mt-8">
				<aside className="w-72 hidden lg:block">
					<h4 className="font-semibold">{title.toUpperCase()}</h4>
					<p>{products.length} produtos encontrados.</p>
				</aside>
				<div className="flex flex-col items-center flex-1 mt-10 md:mt-0">
					<h4 className="font-semibold text-xl mb-6 lg:hidden">{title}</h4>
					<ul className="grid grid-cols-2 2xl:grid-cols-3 gap-12 md:gap-20">
						{products.map((p) => (
							<li key={p.id}>
								<MarketProductCard product={p} />
							</li>
						))}
					</ul>
				</div>
			</section>
		</>
	);
}

import { getByCategory } from "@/actions/product";
import MarketProductList from "@/components/market-product-list";
import { fruitsCategories } from "@/utils/data";

export default async function CategoryPage({
	params,
}: {
	params: Promise<{ category: string }>;
}) {
	const category = decodeURIComponent((await params).category);
	const label =
		fruitsCategories.find((c) => c.value === category)?.label ?? category;
	const products = await getByCategory(category);

	return (
		<MarketProductList
			title={label}
			products={products}
			emptyTitle={`No momento não há nenhum produto na categoria ${label}.`}
			emptyDescription="Volte mais tarde ou navegue por outras categorias para encontrar produtos semelhantes."
		/>
	);
}

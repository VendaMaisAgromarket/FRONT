import { getBestSellers } from "@/actions/product";
import MarketProductList from "@/components/market-product-list";

export default async function BestSellersPage() {
	const products = await getBestSellers();

	return (
		<MarketProductList
			title="Mais vendidos"
			products={products}
			emptyTitle="Ainda não há produtos vendidos na plataforma."
			emptyDescription="Assim que as primeiras vendas forem concluídas, os produtos preferidos dos nossos usuários aparecerão aqui."
		/>
	);
}

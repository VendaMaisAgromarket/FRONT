import { readProductById } from '@/actions/product';
import CompraProduto from '@/components/product_detail/payproduct';
import ProductDescription from '@/components/product_detail/ProductDescription';
import SellerInformation from '@/components/product_detail/SellerInformation';
import ProductsCarousel from '@/components/productsCarousel';
import { Metadata } from 'next';
import Link from 'next/link';

export async function generateMetadata({
	params,
}: {
	params: Promise<{ id: string }>;
}): Promise<Metadata> {
	const { id } = await params;
	const res = await readProductById(id);

	return res
		? { title: `${res.name} | Venda+` }
		: { title: 'Produto não encontrado' };
}

export default async function ProductDetail({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;

	const res = await readProductById(id);

	if (!res) {
		return (
			<main className="container mx-auto px-4 py-8">
				<p>Produto não encontrado.</p>
			</main>
		);
	}

	const images = res.images_Path;

	return (
		<main className="container mx-auto px-4 py-8">
			<nav className="mb-8 flex" aria-label="Breadcrumb">
				<ol className="inline-flex items-center space-x-1 md:space-x-3">
					<li>
						<Link href="/" className="text-gray-700 hover:text-green-600">
							Home
						</Link>
					</li>
					<li>
						<div className="flex items-center">
							<span className="mx-2 text-gray-400">/</span>
							<span className="text-gray-500">{res.name}</span>
						</div>
					</li>
				</ol>
			</nav>
			<CompraProduto
				id={res.id}
				name={res.name}
				images={images}
				units={res.sellingUnitProduct}
				sellerId={res.seller.id}
				sellerName={res.seller.name}
				createdAt={res.createdAt}
				harvestAt={res.harvestAt}
				isNegotiable={res.isNegotiable}
			/>

			{/* SellerInformation */}
			<div className="mt-6">
				<SellerInformation
					name={res.seller.name}
					products={10} //TODO: alterar esse atributo quando o backend retornar a quantidade de produtos
					sellerId={res.seller.id} // ✅ passa o ID do vendedor para construir a rota correta
					farmCertifications={res.seller.farmCertifications}
				/>
			</div>

			{/* Descrição */}
			<div className="mt-8">
				<ProductDescription description={res.description} />
			</div>

			{/* Produtos Similares */}
			<div className="bg-white my-12 max-w-screen-xl w-10/12 mx-auto p-4 rounded-xl shadow-md">
				<h3 className="text-xl mb-4 font-semibold">Produtos Similares</h3>
				<ProductsCarousel products={[res]} />
			</div>
		</main>
	);
}

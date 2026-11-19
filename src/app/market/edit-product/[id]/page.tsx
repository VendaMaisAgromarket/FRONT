export const dynamic = "force-dynamic";

import { readProductById } from "@/actions/product";
import ProductHarvestCertificationSection from "@/components/certifications/ProductHarvestCertificationSection";
import EditProductForm from "./components/EditProductForm";

interface PageProps {
	params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: PageProps) {
	const { id } = await params;
	const product = await readProductById(id, true);

	if (!product) {
		return (
			<main className="max-w-7xl mx-auto p-8">
				<h1 className="text-2xl font-bold mb-4">Produto não encontrado</h1>
				<p>Verifique o link ou tente novamente mais tarde.</p>
			</main>
		);
	}

	return (
		<section className="max-w-7xl mx-auto p-6">
			<EditProductForm productId={id} />
			<ProductHarvestCertificationSection
				productId={id}
				harvestCertificationId={product.harvestCertificationId ?? null}
			/>
		</section>
	);
}

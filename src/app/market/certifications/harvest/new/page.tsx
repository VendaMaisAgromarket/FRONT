import { getAllFromSeller } from "@/actions/product";
import NewHarvestCertificationClient from "../components/NewHarvestCertificationClient";

export default async function NewHarvestCertificationPage() {
	// Nomes dos anúncios do usuário, para sugerir a cultura (facilita o vínculo depois)
	const products: { name?: string }[] = await getAllFromSeller().catch(() => []);
	const crops = Array.from(
		new Set((products ?? []).map((p) => p.name?.trim()).filter((n): n is string => !!n))
	).sort((a, b) => a.localeCompare(b));
	return <NewHarvestCertificationClient cropSuggestions={crops} />;
}

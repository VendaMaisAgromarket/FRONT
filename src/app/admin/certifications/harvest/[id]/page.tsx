import HarvestCertificationReviewClient from "../components/HarvestCertificationReviewClient";

// Destino das notificações e e-mails de safra enviados aos admins.
export default async function AdminHarvestCertificationReviewPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	return <HarvestCertificationReviewClient id={id} />;
}

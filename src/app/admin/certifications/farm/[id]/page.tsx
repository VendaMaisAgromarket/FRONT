import FarmCertificationReviewClient from "../components/FarmCertificationReviewClient";

// Destino das notificações e e-mails enviados aos admins.
export default async function AdminFarmCertificationReviewPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	return <FarmCertificationReviewClient id={id} />;
}

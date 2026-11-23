import EditHarvestCertificationClient from "../../components/EditHarvestCertificationClient";

export default async function EditHarvestCertificationPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	return <EditHarvestCertificationClient id={id} />;
}

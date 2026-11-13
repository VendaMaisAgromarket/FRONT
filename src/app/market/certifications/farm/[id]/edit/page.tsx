import EditFarmCertificationClient from "../../components/EditFarmCertificationClient";

export default async function EditFarmCertificationPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	return <EditFarmCertificationClient id={id} />;
}

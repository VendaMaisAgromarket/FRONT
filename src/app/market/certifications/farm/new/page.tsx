import { getUserData } from "@/actions/user";
import NewFarmCertificationClient from "../components/NewFarmCertificationClient";

export default async function NewFarmCertificationPage() {
	// CCIR do cadastro, para preencher o campo automaticamente
	const ccir = await getUserData()
		.then((u) => u.ccir)
		.catch(() => null);
	return <NewFarmCertificationClient defaultCcir={ccir} />;
}

"use client";

import CertificationQueueClient from "@/components/certifications/admin/CertificationQueueClient";
import { CERTIFICATION_TYPE_LABELS } from "@/components/certifications/certificationUtils";
import { FarmCertificationAdminItem } from "@/types/types";

export default function FarmCertificationsQueueClient() {
	return (
		<CertificationQueueClient<FarmCertificationAdminItem>
			scope="farm"
			title="Certificações de fazenda"
			description="Avalie os certificados enviados pelos produtores. Aprovadas e dentro da validade geram o selo público."
			ownerLabel="Produtor"
			columns={[
				{ header: "Fazenda", cell: (c) => c.farmName },
				{ header: "Município/UF", className: "hidden lg:table-cell", cell: (c) => `${c.city}/${c.uf}` },
				{ header: "Tipo", cell: (c) => CERTIFICATION_TYPE_LABELS[c.type] ?? c.type },
				{ header: "Certificadora", className: "hidden xl:table-cell", cell: (c) => c.certifierName },
			]}
			countColumns={[{ header: "Docs", className: "hidden md:table-cell", cell: (c) => c._count.documents }]}
		/>
	);
}

"use client";

import CertificationQueueClient from "@/components/certifications/admin/CertificationQueueClient";
import { HARVEST_TYPE_LABELS } from "@/components/certifications/certificationUtils";
import { HarvestCertificationAdminItem } from "@/types/types";

export default function HarvestCertificationsQueueClient() {
	return (
		<CertificationQueueClient<HarvestCertificationAdminItem>
			scope="harvest"
			title="Certificações de safra"
			description="Avalie os laudos e certificados de safra. Aprovadas e dentro da validade geram o selo nos anúncios vinculados."
			ownerLabel="Dono"
			columns={[
				{
					header: "Cultura",
					cell: (c) => [c.crop, c.variety].filter(Boolean).join(" "),
				},
				{ header: "Safra", cell: (c) => c.harvestSeason },
				{ header: "Talhão", className: "hidden lg:table-cell", cell: (c) => c.plotIdentifier },
				{ header: "Tipo", cell: (c) => HARVEST_TYPE_LABELS[c.type] ?? c.type },
				{ header: "Certificadora", className: "hidden xl:table-cell", cell: (c) => c.certifierName },
			]}
			countColumns={[
				{ header: "Docs", className: "hidden md:table-cell", cell: (c) => c._count.documents },
				{ header: "Anúncios", className: "hidden md:table-cell", cell: (c) => c._count.products },
			]}
		/>
	);
}

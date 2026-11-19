"use client";

import { HarvestCertificationInfo } from "@/components/certifications/CertificationInfo";
import HarvestLinkedProducts from "@/components/certifications/HarvestLinkedProducts";
import CertificationReviewClient from "@/components/certifications/admin/CertificationReviewClient";
import { harvestTitle } from "@/components/certifications/certificationUtils";
import { getHarvestCertification } from "@/services/harvestCertifications";
import { HarvestCertificationDetail } from "@/types/types";

export default function HarvestCertificationReviewClient({ id }: { id: string }) {
	return (
		<CertificationReviewClient<HarvestCertificationDetail>
			scope="harvest"
			id={id}
			load={getHarvestCertification}
			title={(d) => harvestTitle(d)}
			renderInfo={(d) => <HarvestCertificationInfo certification={d} />}
			// Só leitura: o admin vê onde o selo vai aparecer
			renderAside={(d) => <HarvestLinkedProducts certification={d} editable={false} />}
		/>
	);
}

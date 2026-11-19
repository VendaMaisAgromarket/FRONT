"use client";

import CertificationInfo from "@/components/certifications/CertificationInfo";
import CertificationReviewClient from "@/components/certifications/admin/CertificationReviewClient";
import { getFarmCertification } from "@/services/farmCertifications";
import { FarmCertificationDetail } from "@/types/types";

export default function FarmCertificationReviewClient({ id }: { id: string }) {
	return (
		<CertificationReviewClient<FarmCertificationDetail>
			scope="farm"
			id={id}
			load={getFarmCertification}
			title={(d) => d.farmName}
			renderInfo={(d) => <CertificationInfo certification={d} />}
		/>
	);
}

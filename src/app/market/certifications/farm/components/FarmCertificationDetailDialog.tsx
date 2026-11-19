"use client";

import CertificationInfo from "@/components/certifications/CertificationInfo";
import { CertificationDetailDialog } from "@/components/certifications/CertificationOwnerParts";
import { getFarmCertification } from "@/services/farmCertifications";
import { FarmCertificationDetail } from "@/types/types";

type Props = {
	id: string | null;
	onOpenChange: (open: boolean) => void;
};

export default function FarmCertificationDetailDialog({ id, onOpenChange }: Props) {
	return (
		<CertificationDetailDialog<FarmCertificationDetail>
			scope="farm"
			id={id}
			onOpenChange={onOpenChange}
			load={getFarmCertification}
			title={(d) => d.farmName}
			renderInfo={(d) => <CertificationInfo certification={d} />}
		/>
	);
}

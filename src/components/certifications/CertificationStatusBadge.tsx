import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { FarmCertificationStatus } from "@/types/types";
import { CERTIFICATION_STATUS_CLASSES, CERTIFICATION_STATUS_LABELS } from "./certificationUtils";

export default function CertificationStatusBadge({
	status,
	className,
}: {
	status: FarmCertificationStatus;
	className?: string;
}) {
	return (
		<Badge variant="outline" className={cn(CERTIFICATION_STATUS_CLASSES[status], className)}>
			{CERTIFICATION_STATUS_LABELS[status] ?? status}
		</Badge>
	);
}

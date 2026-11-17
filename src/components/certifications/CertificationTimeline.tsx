import { formatNotificationDatetime } from "@/components/notifications/notificationUtils";
import { cn } from "@/lib/utils";
import { FarmCertificationEvent } from "@/types/types";
import { CERTIFICATION_EVENT_LABELS, DOC_TYPE_LABELS } from "./certificationUtils";

const DOT_CLASSES: Record<string, string> = {
	SUBMITTED: "bg-yellow-500",
	RESUBMITTED: "bg-yellow-500",
	APPROVED: "bg-green-600",
	REJECTED: "bg-red-600",
	REVOKED: "bg-red-800",
	EXPIRED: "bg-gray-400",
};

export default function CertificationTimeline({ events }: { events: FarmCertificationEvent[] }) {
	if (!events.length) {
		return <p className="text-sm text-gray-500">Sem histórico.</p>;
	}

	return (
		<ol className="relative border-l border-gray-200 ml-2 space-y-5">
			{events.map((e) => (
				<li key={e.id} className="ml-4">
					<span
						className={cn(
							"absolute -left-1.5 mt-1.5 size-3 rounded-full border-2 border-white",
							DOT_CLASSES[e.action] ?? "bg-gray-400"
						)}
						aria-hidden="true"
					/>
					<p className="text-sm font-medium text-gray-900">
						{CERTIFICATION_EVENT_LABELS[e.action] ?? e.action}
					</p>
					<p className="text-xs text-gray-500">
						<time dateTime={e.createdAt}>{formatNotificationDatetime(e.createdAt)}</time>
						{" · "}
						{e.actor ? e.actor.name : "Sistema"}
					</p>
					{e.note && (
						<p className="mt-1 text-sm text-gray-700 whitespace-pre-line">{e.note}</p>
					)}
					{e.document && (
						<p className="mt-1 text-xs text-gray-500">
							Documento: {DOC_TYPE_LABELS[e.document.docType] ?? e.document.docType} —{" "}
							{e.document.originalName}
						</p>
					)}
				</li>
			))}
		</ol>
	);
}

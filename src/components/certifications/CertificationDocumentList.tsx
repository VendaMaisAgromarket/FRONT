"use client";

import { Button } from "@/components/ui/button";
import { openFarmCertificationDocument } from "@/services/farmCertifications";
import { FarmCertificationDocument } from "@/types/types";
import { ExternalLink, FileText, ImageIcon, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DOC_TYPE_LABELS, formatCalendarDate, formatFileSize } from "./certificationUtils";

type Props = {
	certificationId: string;
	documents: FarmCertificationDocument[];
	// Ação extra por documento (ex.: pré-visualização no admin)
	renderExtra?: (doc: FarmCertificationDocument) => React.ReactNode;
};

// Cada clique em "Abrir" busca uma URL assinada nova (expira em 10 min); nada é guardado.
export default function CertificationDocumentList({ certificationId, documents, renderExtra }: Props) {
	const [opening, setOpening] = useState<string | null>(null);

	async function handleOpen(docId: string) {
		try {
			setOpening(docId);
			await openFarmCertificationDocument(certificationId, docId);
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Não foi possível abrir o documento.");
		} finally {
			setOpening(null);
		}
	}

	if (!documents.length) {
		return <p className="text-sm text-gray-500">Nenhum documento enviado.</p>;
	}

	return (
		<ul className="divide-y rounded-md border">
			{documents.map((d) => {
				const Icon = d.mimeType.startsWith("image/") ? ImageIcon : FileText;
				return (
					<li key={d.id} className="flex flex-wrap items-center gap-3 p-3">
						<Icon className="size-5 shrink-0 text-gray-500" />
						<div className="min-w-0 flex-1">
							<p className="truncate text-sm font-medium text-gray-900" title={d.originalName}>
								{d.originalName}
							</p>
							<p className="text-xs text-gray-500">
								{DOC_TYPE_LABELS[d.docType] ?? d.docType} · {formatFileSize(d.sizeBytes)} · enviado em{" "}
								{formatCalendarDate(d.uploadedAt)}
								{d.uploadedBy ? ` por ${d.uploadedBy.name}` : ""}
							</p>
						</div>
						<div className="flex gap-2">
							{renderExtra?.(d)}
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => handleOpen(d.id)}
								disabled={opening === d.id}
							>
								{opening === d.id ? (
									<LoaderCircle className="size-4 animate-spin" />
								) : (
									<ExternalLink className="size-4" />
								)}
								Abrir
							</Button>
						</div>
					</li>
				);
			})}
		</ul>
	);
}

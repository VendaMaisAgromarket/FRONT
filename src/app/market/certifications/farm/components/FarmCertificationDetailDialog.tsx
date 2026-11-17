"use client";

import CertificationDocumentList from "@/components/certifications/CertificationDocumentList";
import CertificationInfo, { InfoSection } from "@/components/certifications/CertificationInfo";
import CertificationStatusBadge from "@/components/certifications/CertificationStatusBadge";
import CertificationTimeline from "@/components/certifications/CertificationTimeline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { getFarmCertification } from "@/services/farmCertifications";
import { FarmCertificationDetail } from "@/types/types";
import { BadgeCheck } from "lucide-react";
import { useEffect, useState } from "react";

type Props = {
	id: string | null;
	onOpenChange: (open: boolean) => void;
};

export default function FarmCertificationDetailDialog({ id, onOpenChange }: Props) {
	// Resultado guardado junto com o id: troca de id = carregando, sem setState síncrono no effect
	const [result, setResult] = useState<{
		id: string;
		detail?: FarmCertificationDetail;
		error?: string;
	} | null>(null);

	const [reloadKey, setReloadKey] = useState(0);

	useEffect(() => {
		if (!id) return;
		let active = true;
		getFarmCertification(id)
			.then((detail) => active && setResult({ id, detail }))
			.catch(
				(e) =>
					active &&
					setResult({
						id,
						error: e instanceof Error ? e.message : "Não foi possível carregar a certificação.",
					})
			);
		return () => {
			active = false;
		};
	}, [id, reloadKey]);

	const current = result && result.id === id ? result : null;
	const detail = current?.detail ?? null;
	const error = current?.error ?? null;

	return (
		<Dialog open={!!id} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle>{detail?.farmName ?? "Certificação"}</DialogTitle>
				</DialogHeader>

				{error ? (
					<div className="space-y-3 py-6 text-center">
						<p className="text-sm text-gray-600">{error}</p>
						<Button variant="outline" size="sm" onClick={() => {
								setResult(null);
								setReloadKey((k) => k + 1);
							}}>
							Tentar novamente
						</Button>
					</div>
				) : !detail ? (
					<div className="space-y-3">
						<Skeleton className="h-5 w-1/3" />
						<Skeleton className="h-24 w-full" />
						<Skeleton className="h-24 w-full" />
					</div>
				) : (
					<div className="space-y-6">
						<div className="flex flex-wrap items-center gap-2">
							<CertificationStatusBadge status={detail.status} />
							{detail.badgeActive && (
								<Badge variant="outline" className="border-green-200 bg-green-50 text-green-800">
									<BadgeCheck />
									Selo ativo
								</Badge>
							)}
						</div>

						{(detail.status === "REJECTED" || detail.status === "REVOKED") && detail.rejectionReason && (
							<div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
								<p className="font-medium">
									{detail.status === "REJECTED" ? "Motivo da recusa" : "Motivo da revogação"}
								</p>
								<p className="whitespace-pre-line">{detail.rejectionReason}</p>
							</div>
						)}

						<CertificationInfo certification={detail} />

						<InfoSection title="Documentos">
							<CertificationDocumentList certificationId={detail.id} documents={detail.documents} />
						</InfoSection>

						<InfoSection title="Histórico">
							<CertificationTimeline events={detail.events} />
						</InfoSection>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}

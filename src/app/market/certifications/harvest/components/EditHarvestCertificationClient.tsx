"use client";

import CertificationStatusBadge from "@/components/certifications/CertificationStatusBadge";
import HarvestCertificationForm from "@/components/certifications/HarvestCertificationForm";
import { certificationRoutes } from "@/components/certifications/certificationUtils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getHarvestCertification } from "@/services/harvestCertifications";
import { HarvestCertificationDetail } from "@/types/types";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

const routes = certificationRoutes("harvest");

export default function EditHarvestCertificationClient({ id }: { id: string }) {
	const router = useRouter();
	const [detail, setDetail] = useState<HarvestCertificationDetail | null>(null);
	const [error, setError] = useState<string | null>(null);
	// Incrementado para recarregar (tentar novamente, 409 no reenvio)
	const [reloadKey, setReloadKey] = useState(0);
	const load = useCallback(() => setReloadKey((k) => k + 1), []);

	useEffect(() => {
		let active = true;
		getHarvestCertification(id)
			.then((d) => {
				if (!active) return;
				setDetail(d);
				setError(null);
			})
			.catch((e) => {
				if (active) setError(e instanceof Error ? e.message : "Não foi possível carregar a certificação.");
			});
		return () => {
			active = false;
		};
	}, [id, reloadKey]);

	const editable = detail && (detail.status === "PENDING" || detail.status === "REJECTED");

	return (
		<main className="mx-auto max-w-3xl space-y-6 px-4 py-6">
			<Link
				href={routes.list}
				className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
			>
				<ArrowLeft className="size-4" />
				Minhas certificações de safra
			</Link>

			{error ? (
				<div className="space-y-3 rounded-lg border bg-white px-4 py-12 text-center">
					<p className="text-gray-600">{error}</p>
					<Button
						variant="outline"
						onClick={() => {
							setError(null);
							load();
						}}
					>
						Tentar novamente
					</Button>
				</div>
			) : !detail ? (
				<div className="space-y-3">
					<Skeleton className="h-8 w-1/2" />
					<Skeleton className="h-96 w-full" />
				</div>
			) : (
				<>
					<div className="space-y-2">
						<div className="flex flex-wrap items-center gap-2">
							<h1 className="text-2xl font-bold text-gray-900">Corrigir certificação de safra</h1>
							<CertificationStatusBadge status={detail.status} />
						</div>
						{detail.status === "REJECTED" && detail.rejectionReason && (
							<div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
								<p className="font-medium">Motivo da recusa</p>
								<p className="whitespace-pre-line">{detail.rejectionReason}</p>
							</div>
						)}
						<p className="text-sm text-gray-600">
							Revise os dados e, se precisar, anexe novos laudos. Os já enviados continuam na certificação.
							Os anúncios vinculados continuam vinculados, mas o selo fica fora do ar até a nova aprovação.
						</p>
					</div>

					{editable ? (
						<div className="rounded-lg border bg-white p-4 shadow-sm md:p-6">
							<HarvestCertificationForm
								key={detail.updatedAt}
								initial={detail}
								onCancel={() => router.push(routes.list)}
								onConflict={load}
								onSuccess={() => {
									toast.success("Certificação reenviada para análise");
									router.push(routes.list);
								}}
							/>
						</div>
					) : (
						<div className="rounded-lg border bg-white px-4 py-8 text-center text-sm text-gray-600">
							Esta certificação não pode mais ser corrigida. Para renovar, envie uma certificação nova.
						</div>
					)}
				</>
			)}
		</main>
	);
}

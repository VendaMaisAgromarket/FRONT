"use client";

// Peças comuns às telas do dono (fazenda e safra): abas, estado vazio, selo ativo,
// motivo de recusa/revogação, aviso de vencimento e o modal de detalhe.

import CertificationDocumentList from "@/components/certifications/CertificationDocumentList";
import { InfoSection } from "@/components/certifications/CertificationInfo";
import CertificationStatusBadge from "@/components/certifications/CertificationStatusBadge";
import CertificationTimeline from "@/components/certifications/CertificationTimeline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { CertificationDetailBase, CertificationScope, CertificationStatus } from "@/types/types";
import { AlertTriangle, BadgeCheck, LucideIcon } from "lucide-react";
import Link from "next/link";
import { ReactNode, useEffect, useState } from "react";
import {
	SCOPE_LABELS,
	certificationRoutes,
	daysUntil,
	expiringLabel,
	formatCalendarDate,
} from "./certificationUtils";

export function CertificationScopeTabs({ active }: { active: CertificationScope }) {
	return (
		<nav className="flex gap-1 rounded-lg border bg-white p-1 w-fit" aria-label="Tipo de certificação">
			{(Object.keys(SCOPE_LABELS) as CertificationScope[]).map((scope) => (
				<Link
					key={scope}
					href={certificationRoutes(scope).list}
					aria-current={active === scope ? "page" : undefined}
					className={cn(
						"rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
						active === scope ? "bg-primary text-primary-foreground" : "text-gray-600 hover:bg-gray-100"
					)}
				>
					{SCOPE_LABELS[scope]}
				</Link>
			))}
		</nav>
	);
}

export function ActiveSealBadge() {
	return (
		<Badge variant="outline" className="border-green-200 bg-green-50 text-green-800">
			<BadgeCheck />
			Selo ativo
		</Badge>
	);
}

export function ReasonBox({ status, reason }: { status: CertificationStatus; reason: string | null }) {
	if ((status !== "REJECTED" && status !== "REVOKED") || !reason) return null;
	return (
		<div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
			<p className="font-medium">{status === "REJECTED" ? "Motivo da recusa" : "Motivo da revogação"}</p>
			<p className="whitespace-pre-line">{reason}</p>
		</div>
	);
}

// "Válido até dd/mm/aaaa" e, faltando 30 dias ou menos, "vence em X dias"
export function ValidityLine({ status, validUntil }: { status: CertificationStatus; validUntil: string }) {
	const days = daysUntil(validUntil);
	const showExpiring = (status === "APPROVED" || status === "PENDING") && days >= 0 && days <= 30;
	return (
		<>
			<span>Válido até {formatCalendarDate(validUntil)}</span>
			{showExpiring && (
				<span className="inline-flex items-center gap-1 font-medium text-amber-700">
					<AlertTriangle className="size-4" />
					{expiringLabel(days)}
				</span>
			)}
		</>
	);
}

export function CertificationEmptyState({
	icon: Icon,
	title,
	text,
	benefits,
	newHref,
	newLabel,
}: {
	icon: LucideIcon;
	title: string;
	text: string;
	benefits: { icon: LucideIcon; text: string }[];
	newHref: string;
	newLabel: string;
}) {
	return (
		<div className="space-y-6 rounded-lg border bg-white p-6 text-center md:p-10">
			<div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10">
				<Icon className="size-8 text-primary" />
			</div>
			<div className="space-y-2">
				<h2 className="text-lg font-semibold text-gray-900">{title}</h2>
				<p className="mx-auto max-w-lg text-sm text-gray-600">{text}</p>
			</div>
			<ul className="mx-auto max-w-md space-y-3 text-left">
				{benefits.map(({ icon: BIcon, text: bText }) => (
					<li key={bText} className="flex gap-3 text-sm text-gray-700">
						<BIcon className="size-5 shrink-0 text-primary" />
						{bText}
					</li>
				))}
			</ul>
			<div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
				<Button asChild>
					<Link href={newHref}>{newLabel}</Link>
				</Button>
				<Button variant="outline" disabled className="gap-2">
					Obter certificação
					<Badge variant="secondary" className="text-[10px]">
						Em breve
					</Badge>
				</Button>
			</div>
		</div>
	);
}

// ---------- Modal de detalhe ----------

type DetailDialogProps<T extends CertificationDetailBase> = {
	scope: CertificationScope;
	id: string | null;
	onOpenChange: (open: boolean) => void;
	load: (id: string) => Promise<T>;
	title: (detail: T) => string;
	// Blocos específicos do escopo (fazenda/safra)
	renderInfo: (detail: T) => ReactNode;
	// Seções extras depois do histórico (ex.: anúncios vinculados). `reload` busca o detalhe de novo.
	renderExtra?: (detail: T, reload: () => void) => ReactNode;
	// Chamado sempre que um detalhe novo é carregado (ex.: a lista atualiza o card)
	onLoaded?: (detail: T) => void;
};

export function CertificationDetailDialog<T extends CertificationDetailBase>({
	scope,
	id,
	onOpenChange,
	load,
	title,
	renderInfo,
	renderExtra,
	onLoaded,
}: DetailDialogProps<T>) {
	// Resultado guardado junto com o id: troca de id = carregando, sem setState síncrono no effect
	const [result, setResult] = useState<{ id: string; detail?: T; error?: string } | null>(null);
	const [reloadKey, setReloadKey] = useState(0);

	useEffect(() => {
		if (!id) return;
		let active = true;
		load(id)
			.then((detail) => {
				if (!active) return;
				setResult({ id, detail });
				onLoaded?.(detail);
			})
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
		// `load`/`onLoaded` são estáveis o bastante; recarrega por id ou reloadKey
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [id, reloadKey]);

	const current = result && result.id === id ? result : null;
	const detail = current?.detail ?? null;
	const error = current?.error ?? null;
	const reload = () => setReloadKey((k) => k + 1);

	return (
		<Dialog open={!!id} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle>{detail ? title(detail) : "Certificação"}</DialogTitle>
				</DialogHeader>

				{error ? (
					<div className="space-y-3 py-6 text-center">
						<p className="text-sm text-gray-600">{error}</p>
						<Button
							variant="outline"
							size="sm"
							onClick={() => {
								setResult(null);
								reload();
							}}
						>
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
							{detail.badgeActive && <ActiveSealBadge />}
						</div>

						<ReasonBox status={detail.status} reason={detail.rejectionReason} />

						{renderInfo(detail)}

						<InfoSection title="Documentos">
							<CertificationDocumentList
								scope={scope}
								certificationId={detail.id}
								documents={detail.documents}
							/>
						</InfoSection>

						<InfoSection title="Histórico">
							<CertificationTimeline events={detail.events} />
						</InfoSection>

						{renderExtra?.(detail, reload)}
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}

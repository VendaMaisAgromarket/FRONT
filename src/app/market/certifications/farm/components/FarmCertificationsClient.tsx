"use client";

import CertificationStatusBadge from "@/components/certifications/CertificationStatusBadge";
import {
	CERTIFICATION_ROUTES,
	CERTIFICATION_TYPE_LABELS,
	daysUntil,
	expiringLabel,
	formatCalendarDate,
} from "@/components/certifications/certificationUtils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { listMyFarmCertifications } from "@/services/farmCertifications";
import { FarmCertification } from "@/types/types";
import { AlertTriangle, BadgeCheck, Plus, ShieldCheck, ShoppingBag, Sprout } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import FarmCertificationDetailDialog from "./FarmCertificationDetailDialog";

export default function FarmCertificationsClient() {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [items, setItems] = useState<FarmCertification[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [detailId, setDetailId] = useState<string | null>(null);
	const onboarding = searchParams.get("onboarding") === "1";

	const load = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);
			setItems(await listMyFarmCertifications());
		} catch (e) {
			setError(e instanceof Error ? e.message : "Não foi possível carregar as certificações.");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		load();
	}, [load]);

	function closeOnboarding() {
		router.replace(pathname);
	}

	return (
		<main className="mx-auto max-w-4xl space-y-6 px-4 py-6">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h1 className="text-2xl font-bold text-gray-900">Certificações da fazenda</h1>
					<p className="text-sm text-gray-600">
						Envie o certificado da sua fazenda e ganhe o selo de Fazenda certificada nos seus anúncios.
					</p>
				</div>
				{!loading && !error && items.length > 0 && (
					<Button asChild>
						<Link href={CERTIFICATION_ROUTES.producerNew}>
							<Plus className="size-4" />
							Inserir certificação
						</Link>
					</Button>
				)}
			</div>

			{loading ? (
				<div className="space-y-3">
					{Array.from({ length: 2 }).map((_, i) => (
						<Skeleton key={i} className="h-36 w-full rounded-lg" />
					))}
				</div>
			) : error ? (
				<div className="space-y-3 rounded-lg border bg-white px-4 py-12 text-center">
					<p className="text-gray-600">{error}</p>
					<Button variant="outline" onClick={load}>
						Tentar novamente
					</Button>
				</div>
			) : items.length === 0 ? (
				<EmptyState />
			) : (
				<ul className="space-y-3">
					{items.map((c) => (
						<CertificationCard key={c.id} certification={c} onView={() => setDetailId(c.id)} />
					))}
				</ul>
			)}

			<FarmCertificationDetailDialog
				id={detailId}
				onOpenChange={(open) => !open && setDetailId(null)}
			/>

			{/* Passo opcional logo após o cadastro de um produtor */}
			<Dialog open={onboarding} onOpenChange={(open) => !open && closeOnboarding()}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<BadgeCheck className="size-5 text-primary" />
							Sua fazenda tem certificação?
						</DialogTitle>
						<DialogDescription>
							Envie agora e ganhe o selo de Fazenda certificada nos seus anúncios e no seu perfil. Você
							também pode fazer isso depois, pelo menu Certificações.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => router.replace("/market")}>
							Depois
						</Button>
						<Button onClick={() => router.push(CERTIFICATION_ROUTES.producerNew)}>Enviar agora</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</main>
	);
}

function EmptyState() {
	const benefits = [
		{ icon: ShieldCheck, text: "Selo de Fazenda certificada nos seus anúncios e no seu perfil." },
		{ icon: ShoppingBag, text: "Mais confiança para os compradores na hora de fechar negócio." },
		{ icon: Sprout, text: "Destaque para práticas orgânicas, GlobalG.A.P. e outras certificações." },
	];
	return (
		<div className="space-y-6 rounded-lg border bg-white p-6 text-center md:p-10">
			<div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10">
				<BadgeCheck className="size-8 text-primary" />
			</div>
			<div className="space-y-2">
				<h2 className="text-lg font-semibold text-gray-900">Ganhe o selo de Fazenda certificada</h2>
				<p className="mx-auto max-w-lg text-sm text-gray-600">
					Se a sua fazenda já tem certificado (orgânico, GlobalG.A.P. etc.), envie os dados e o documento.
					Nossa equipe avalia e, quando aprovado, o selo aparece para os compradores.
				</p>
			</div>
			<ul className="mx-auto max-w-md space-y-3 text-left">
				{benefits.map(({ icon: Icon, text }) => (
					<li key={text} className="flex gap-3 text-sm text-gray-700">
						<Icon className="size-5 shrink-0 text-primary" />
						{text}
					</li>
				))}
			</ul>
			<div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
				<Button asChild>
					<Link href={CERTIFICATION_ROUTES.producerNew}>Inserir certificação</Link>
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

function CertificationCard({
	certification: c,
	onView,
}: {
	certification: FarmCertification;
	onView: () => void;
}) {
	const days = daysUntil(c.validUntil);
	const showExpiring = (c.status === "APPROVED" || c.status === "PENDING") && days >= 0 && days <= 30;
	const canEdit = c.status === "PENDING" || c.status === "REJECTED";

	return (
		<li className="space-y-3 rounded-lg border bg-white p-4 shadow-sm">
			<div className="flex flex-wrap items-start justify-between gap-2">
				<div className="min-w-0">
					<h2 className="truncate font-semibold text-gray-900">{c.farmName}</h2>
					<p className="text-sm text-gray-600">
						{CERTIFICATION_TYPE_LABELS[c.type] ?? c.type} · {c.certifierName}
					</p>
					<p className="text-xs text-gray-500">Nº {c.certificateNumber}</p>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					{c.badgeActive && (
						<Badge variant="outline" className="border-green-200 bg-green-50 text-green-800">
							<BadgeCheck />
							Selo ativo
						</Badge>
					)}
					<CertificationStatusBadge status={c.status} />
				</div>
			</div>

			<div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-700">
				<span>Válido até {formatCalendarDate(c.validUntil)}</span>
				{showExpiring && (
					<span className="inline-flex items-center gap-1 font-medium text-amber-700">
						<AlertTriangle className="size-4" />
						{expiringLabel(days)}
					</span>
				)}
			</div>

			{(c.status === "REJECTED" || c.status === "REVOKED") && c.rejectionReason && (
				<div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
					<p className="font-medium">
						{c.status === "REJECTED" ? "Motivo da recusa" : "Motivo da revogação"}
					</p>
					<p className="whitespace-pre-line">{c.rejectionReason}</p>
				</div>
			)}

			<div className="flex flex-wrap justify-end gap-2">
				<Button variant="outline" size="sm" onClick={onView}>
					Ver
				</Button>
				{canEdit && (
					<Button size="sm" asChild>
						<Link href={CERTIFICATION_ROUTES.producerEdit(c.id)}>
							{c.status === "REJECTED" ? "Corrigir e reenviar" : "Corrigir"}
						</Link>
					</Button>
				)}
			</div>
		</li>
	);
}

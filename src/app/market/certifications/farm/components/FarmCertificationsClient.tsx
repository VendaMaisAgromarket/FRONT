"use client";

import {
	ActiveSealBadge,
	CertificationEmptyState,
	CertificationScopeTabs,
	ReasonBox,
	ValidityLine,
} from "@/components/certifications/CertificationOwnerParts";
import CertificationStatusBadge from "@/components/certifications/CertificationStatusBadge";
import {
	CERTIFICATION_ROUTES,
	CERTIFICATION_TYPE_LABELS,
} from "@/components/certifications/certificationUtils";
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
import { BadgeCheck, Plus, ShieldCheck, ShoppingBag, Sprout } from "lucide-react";
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

	return (
		<main className="mx-auto max-w-4xl space-y-6 px-4 py-6">
			<CertificationScopeTabs active="farm" />

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
				<CertificationEmptyState
					icon={BadgeCheck}
					title="Ganhe o selo de Fazenda certificada"
					text="Se a sua fazenda já tem certificado (orgânico, GlobalG.A.P. etc.), envie os dados e o documento. Nossa equipe avalia e, quando aprovado, o selo aparece para os compradores."
					benefits={[
						{ icon: ShieldCheck, text: "Selo de Fazenda certificada nos seus anúncios e no seu perfil." },
						{ icon: ShoppingBag, text: "Mais confiança para os compradores na hora de fechar negócio." },
						{ icon: Sprout, text: "Destaque para práticas orgânicas, GlobalG.A.P. e outras certificações." },
					]}
					newHref={CERTIFICATION_ROUTES.producerNew}
					newLabel="Inserir certificação"
				/>
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
			<Dialog open={onboarding} onOpenChange={(open) => !open && router.replace(pathname)}>
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

function CertificationCard({
	certification: c,
	onView,
}: {
	certification: FarmCertification;
	onView: () => void;
}) {
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
					{c.badgeActive && <ActiveSealBadge />}
					<CertificationStatusBadge status={c.status} />
				</div>
			</div>

			<div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-700">
				<ValidityLine status={c.status} validUntil={c.validUntil} />
			</div>

			<ReasonBox status={c.status} reason={c.rejectionReason} />

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

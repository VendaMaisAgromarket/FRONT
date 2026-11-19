"use client";

import { HarvestCertificationInfo } from "@/components/certifications/CertificationInfo";
import {
	ActiveSealBadge,
	CertificationDetailDialog,
	CertificationEmptyState,
	CertificationScopeTabs,
	ReasonBox,
	ValidityLine,
} from "@/components/certifications/CertificationOwnerParts";
import CertificationStatusBadge from "@/components/certifications/CertificationStatusBadge";
import HarvestLinkedProducts from "@/components/certifications/HarvestLinkedProducts";
import {
	HARVEST_TYPE_LABELS,
	certificationRoutes,
	harvestTitle,
} from "@/components/certifications/certificationUtils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getHarvestCertification, listMyHarvestCertifications } from "@/services/harvestCertifications";
import { HarvestCertification, HarvestCertificationDetail } from "@/types/types";
import { Link2, Plus, ShoppingBag, Sprout, Wheat } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const routes = certificationRoutes("harvest");

export default function HarvestCertificationsClient() {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [items, setItems] = useState<HarvestCertification[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [detailId, setDetailId] = useState<string | null>(null);
	// ?open=<id>: detalhe aberto já na seção "Anúncios vinculados" (depois de um envio novo)
	const openParam = searchParams.get("open");
	const openId = detailId ?? openParam;

	const load = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);
			setItems(await listMyHarvestCertifications());
		} catch (e) {
			setError(e instanceof Error ? e.message : "Não foi possível carregar as certificações.");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		load();
	}, [load]);

	function closeDetail() {
		setDetailId(null);
		if (openParam) router.replace(pathname);
	}

	// Mantém o card (ex.: contagem de anúncios) igual ao detalhe recém-carregado
	function syncItem(d: HarvestCertificationDetail) {
		setItems((prev) => prev.map((c) => (c.id === d.id ? { ...c, products: d.products, status: d.status } : c)));
		if (openParam && d.id === openParam) {
			// Rola até os anúncios vinculados depois que o modal renderizar
			requestAnimationFrame(() =>
				document.getElementById("anuncios-vinculados")?.scrollIntoView({ behavior: "smooth", block: "start" })
			);
		}
	}

	return (
		<main className="mx-auto max-w-4xl space-y-6 px-4 py-6">
			<CertificationScopeTabs active="harvest" />

			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h1 className="text-2xl font-bold text-gray-900">Certificações de safra</h1>
					<p className="text-sm text-gray-600">
						Certifique uma safra e vincule aos anúncios dela para exibir o selo de Safra certificada.
					</p>
				</div>
				{!loading && !error && items.length > 0 && (
					<Button asChild>
						<Link href={routes.new}>
							<Plus className="size-4" />
							Inserir certificação de safra
						</Link>
					</Button>
				)}
			</div>

			{loading ? (
				<div className="space-y-3">
					{Array.from({ length: 2 }).map((_, i) => (
						<Skeleton key={i} className="h-40 w-full rounded-lg" />
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
					icon={Wheat}
					title="Ganhe o selo de Safra certificada"
					text="Envie o laudo ou certificado de uma safra (análise de resíduos, rastreabilidade, orgânico etc.) e vincule aos anúncios dessa safra. Quando aprovado, o selo aparece nos anúncios vinculados."
					benefits={[
						{ icon: Wheat, text: "Selo de Safra certificada nos anúncios vinculados." },
						{ icon: Link2, text: "Uma certificação pode valer para vários anúncios da mesma safra." },
						{ icon: ShoppingBag, text: "Mais confiança para o comprador sobre a origem e a qualidade do lote." },
					]}
					newHref={routes.new}
					newLabel="Inserir certificação de safra"
				/>
			) : (
				<ul className="space-y-3">
					{items.map((c) => (
						<HarvestCard key={c.id} certification={c} onView={() => setDetailId(c.id)} />
					))}
				</ul>
			)}

			<CertificationDetailDialog<HarvestCertificationDetail>
				scope="harvest"
				id={openId}
				onOpenChange={(open) => !open && closeDetail()}
				load={getHarvestCertification}
				title={(d) => harvestTitle(d)}
				renderInfo={(d) => <HarvestCertificationInfo certification={d} />}
				renderExtra={(d, reload) => <HarvestLinkedProducts certification={d} editable onChanged={reload} />}
				onLoaded={syncItem}
			/>
		</main>
	);
}

function HarvestCard({ certification: c, onView }: { certification: HarvestCertification; onView: () => void }) {
	const canEdit = c.status === "PENDING" || c.status === "REJECTED";
	const linked = c.products?.length ?? 0;

	return (
		<li className="space-y-3 rounded-lg border bg-white p-4 shadow-sm">
			<div className="flex flex-wrap items-start justify-between gap-2">
				<div className="min-w-0">
					<h2 className="font-semibold text-gray-900">{harvestTitle(c)}</h2>
					<p className="text-sm text-gray-600">
						{HARVEST_TYPE_LABELS[c.type] ?? c.type} · {c.certifierName}
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
				<span className="inline-flex items-center gap-1">
					<Sprout className="size-4 text-gray-500" />
					{linked === 0 ? "Nenhum anúncio vinculado" : linked === 1 ? "1 anúncio vinculado" : `${linked} anúncios vinculados`}
				</span>
			</div>

			<ReasonBox status={c.status} reason={c.rejectionReason} />

			<div className="flex flex-wrap justify-end gap-2">
				<Button variant="outline" size="sm" onClick={onView}>
					Ver
				</Button>
				{canEdit && (
					<Button size="sm" asChild>
						<Link href={routes.edit(c.id)}>{c.status === "REJECTED" ? "Corrigir e reenviar" : "Corrigir"}</Link>
					</Button>
				)}
			</div>
		</li>
	);
}

"use client";

import CertificationStatusBadge from "@/components/certifications/CertificationStatusBadge";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
	linkHarvestCertificationProduct,
	listMyHarvestCertifications,
	unlinkHarvestCertificationProduct,
} from "@/services/harvestCertifications";
import { useUserStore } from "@/store/userInfoStore";
import { HarvestCertification } from "@/types/types";
import { Info, Link2, LoaderCircle, Unlink, Wheat } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
	certificationRoutes,
	formatCalendarDate,
	harvestTitle,
	isExpiredDate,
} from "./certificationUtils";

const routes = certificationRoutes("harvest");

type Props = {
	productId: string;
	// Vínculo salvo no anúncio (aparece mesmo se a certificação ainda não estiver aprovada)
	harvestCertificationId: string | null;
};

// Seção "Certificação de safra" da edição do anúncio. O vínculo é uma chamada separada
// (PUT/DELETE /certifications/harvest/:id/products/:productId), nunca no corpo do PUT do produto.
export default function ProductHarvestCertificationSection(props: Props) {
	// Admin só avalia: não vincula certificações (a API responde 403)
	const role = useUserStore((s) => s.user?.role);
	if (role === "admin") return null;
	return <SectionContent {...props} />;
}

function SectionContent({ productId, harvestCertificationId }: Props) {
	const router = useRouter();
	const [linkedId, setLinkedId] = useState<string | null>(harvestCertificationId);
	const [mine, setMine] = useState<HarvestCertification[] | null>(null);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [selected, setSelected] = useState<string>("");
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [reloadKey, setReloadKey] = useState(0);

	useEffect(() => {
		let active = true;
		listMyHarvestCertifications()
			.then((list) => {
				if (!active) return;
				setMine(list);
				setLoadError(null);
			})
			.catch((e) => active && setLoadError(e instanceof Error ? e.message : "Não foi possível carregar."));
		return () => {
			active = false;
		};
	}, [reloadKey]);

	const linked = mine?.find((c) => c.id === linkedId) ?? null;
	// Vinculáveis: em análise ou aprovadas, dentro da validade
	const options = (mine ?? []).filter(
		(c) => c.id !== linkedId && (c.status === "PENDING" || c.status === "APPROVED") && !isExpiredDate(c.validUntil)
	);

	async function link() {
		if (!selected) return;
		try {
			setBusy(true);
			setError(null);
			const res = await linkHarvestCertificationProduct(selected, productId);
			setLinkedId(res.harvestCertificationId);
			setSelected("");
			toast.success("Certificação de safra vinculada ao anúncio.");
			setReloadKey((k) => k + 1);
			router.refresh();
		} catch (e) {
			setError(e instanceof Error ? e.message : "Não foi possível vincular.");
		} finally {
			setBusy(false);
		}
	}

	async function unlink() {
		if (!linkedId) return;
		try {
			setBusy(true);
			setError(null);
			await unlinkHarvestCertificationProduct(linkedId, productId);
			setLinkedId(null);
			toast.success("Certificação de safra desvinculada do anúncio.");
			setReloadKey((k) => k + 1);
			router.refresh();
		} catch (e) {
			setError(e instanceof Error ? e.message : "Não foi possível desvincular.");
		} finally {
			setBusy(false);
		}
	}

	return (
		<section className="mt-8 space-y-4 rounded-lg border bg-white p-4 shadow-sm md:p-6">
			<div className="flex items-center gap-2">
				<Wheat className="size-5 text-amber-700" />
				<h2 className="text-lg font-semibold text-gray-900">Certificação de safra</h2>
			</div>
			<p className="flex gap-2 text-sm text-gray-600">
				<Info className="mt-0.5 size-4 shrink-0" />
				O vínculo usa os dados já salvos do anúncio. Se você mudou a data de colheita, salve o anúncio antes de
				vincular.
			</p>

			{loadError ? (
				<div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
					{loadError}
					<Button variant="outline" size="sm" onClick={() => setReloadKey((k) => k + 1)}>
						Tentar novamente
					</Button>
				</div>
			) : mine === null ? (
				<Skeleton className="h-16 w-full" />
			) : (
				<>
					{linkedId && (
						<div className="flex flex-wrap items-center gap-3 rounded-md border p-3">
							<div className="min-w-0 flex-1">
								<p className="text-sm font-medium text-gray-900">
									{linked ? harvestTitle(linked) : "Certificação vinculada"}
								</p>
								{linked && (
									<p className="text-xs text-gray-500">Válido até {formatCalendarDate(linked.validUntil)}</p>
								)}
							</div>
							{linked && <CertificationStatusBadge status={linked.status} />}
							<Button type="button" variant="outline" size="sm" onClick={unlink} disabled={busy}>
								{busy ? <LoaderCircle className="size-4 animate-spin" /> : <Unlink className="size-4" />}
								Desvincular
							</Button>
						</div>
					)}

					{options.length > 0 ? (
						<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
							<Select value={selected} onValueChange={setSelected} disabled={busy}>
								<SelectTrigger className="w-full sm:flex-1" aria-label="Certificação de safra para vincular">
									<SelectValue
										placeholder={linkedId ? "Substituir por outra certificação" : "Selecione uma certificação de safra"}
									/>
								</SelectTrigger>
								<SelectContent>
									{options.map((c) => (
										<SelectItem key={c.id} value={c.id}>
											{harvestTitle(c)} ({c.status === "PENDING" ? "em análise" : "aprovada"})
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<Button type="button" onClick={link} disabled={busy || !selected}>
								{busy ? <LoaderCircle className="size-4 animate-spin" /> : <Link2 className="size-4" />}
								{linkedId ? "Substituir" : "Vincular"}
							</Button>
						</div>
					) : (
						!linkedId && (
							<p className="text-sm text-gray-600">
								Você não tem certificações de safra em análise ou aprovadas.{" "}
								<Link href={routes.new} className="font-medium text-primary hover:underline">
									Inserir certificação de safra
								</Link>
							</p>
						)
					)}

					{error && <p className="text-sm text-destructive">{error}</p>}
				</>
			)}
		</section>
	);
}

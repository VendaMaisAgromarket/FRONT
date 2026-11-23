"use client";

import { getAllFromSeller } from "@/actions/product";
import { InfoSection } from "@/components/certifications/CertificationInfo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/services/certifications";
import {
	linkHarvestCertificationProduct,
	unlinkHarvestCertificationProduct,
} from "@/services/harvestCertifications";
import { HarvestCertificationDetail } from "@/types/types";
import { AlertTriangle, Link2, LoaderCircle, Unlink } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { formatCalendarDate, isExpiredDate, isProductCompatible } from "./certificationUtils";

// Anúncio do próprio usuário, como vem de GET /products/user/:id
type OwnProduct = {
	id: string;
	name: string;
	variety?: string | null;
	category?: string | null;
	harvestAt: string;
	status: boolean;
	harvestCertificationId?: string | null;
};

export function canLinkHarvest(c: Pick<HarvestCertificationDetail, "status" | "validUntil">) {
	return (c.status === "PENDING" || c.status === "APPROVED") && !isExpiredDate(c.validUntil);
}

type Props = {
	certification: HarvestCertificationDetail;
	// false = só leitura (admin)
	editable: boolean;
	onChanged?: () => void;
};

// Seção "Anúncios vinculados" do detalhe da certificação de safra
export default function HarvestLinkedProducts({ certification: c, editable, onChanged }: Props) {
	const [unlinking, setUnlinking] = useState<string | null>(null);
	const [pickerOpen, setPickerOpen] = useState(false);
	const linkable = editable && canLinkHarvest(c);

	async function unlink(productId: string) {
		try {
			setUnlinking(productId);
			await unlinkHarvestCertificationProduct(c.id, productId);
			toast.success("Anúncio desvinculado.");
			onChanged?.();
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Não foi possível desvincular.");
			if (e instanceof ApiError && (e.status === 404 || e.status === 409)) onChanged?.();
		} finally {
			setUnlinking(null);
		}
	}

	return (
		<InfoSection title="Anúncios vinculados">
			<div id="anuncios-vinculados" className="space-y-3 scroll-mt-4">
				{editable && (
					<p className="text-sm text-gray-600">
						O selo &quot;Safra certificada&quot; aparece nos anúncios vinculados enquanto a certificação estiver
						aprovada e dentro da validade.
					</p>
				)}

				{c.products.length === 0 ? (
					<p className="text-sm text-gray-500">Nenhum anúncio vinculado.</p>
				) : (
					<ul className="divide-y rounded-md border">
						{c.products.map((p) => (
							<li key={p.id} className="flex flex-wrap items-center gap-3 p-3">
								<div className="min-w-0 flex-1">
									<p className="truncate text-sm font-medium text-gray-900">
										{editable ? (
											<Link href={`/market/edit-product/${encodeURIComponent(p.id)}`} className="hover:underline">
												{p.name}
											</Link>
										) : (
											p.name
										)}
									</p>
									<p className="text-xs text-gray-500">
										{p.variety ? `${p.variety} · ` : ""}colheita {formatCalendarDate(p.harvestAt)}
									</p>
								</div>
								{!p.status && (
									<Badge variant="outline" className="text-gray-600">
										Inativo
									</Badge>
								)}
								{editable && (
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={() => unlink(p.id)}
										disabled={unlinking !== null}
									>
										{unlinking === p.id ? (
											<LoaderCircle className="size-4 animate-spin" />
										) : (
											<Unlink className="size-4" />
										)}
										Desvincular
									</Button>
								)}
							</li>
						))}
					</ul>
				)}

				{editable &&
					(linkable ? (
						<Button type="button" variant="outline" onClick={() => setPickerOpen(true)}>
							<Link2 className="size-4" />
							Vincular anúncio
						</Button>
					) : (
						<p className="text-xs text-gray-500">
							Só é possível vincular certificações em análise ou aprovadas, dentro da validade.
						</p>
					))}
			</div>

			{editable && (
				<LinkProductDialog
					open={pickerOpen}
					onOpenChange={setPickerOpen}
					certification={c}
					onLinked={() => {
						setPickerOpen(false);
						onChanged?.();
					}}
				/>
			)}
		</InfoSection>
	);
}

function LinkProductDialog({
	open,
	onOpenChange,
	certification: c,
	onLinked,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	certification: HarvestCertificationDetail;
	onLinked: () => void;
}) {
	const [products, setProducts] = useState<OwnProduct[] | null>(null);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [linking, setLinking] = useState<string | null>(null);
	// Erro da API por anúncio (cultura ou período incompatível etc.)
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [reloadKey, setReloadKey] = useState(0);

	// Recarrega a cada abertura: o vínculo de outros anúncios pode ter mudado
	useEffect(() => {
		if (!open) return;
		let active = true;
		getAllFromSeller()
			.then((list: OwnProduct[]) => {
				if (!active) return;
				// Só anúncios ativos
				setProducts((list ?? []).filter((p) => p.status));
				setLoadError(null);
			})
			.catch(() => active && setLoadError("Não foi possível carregar seus anúncios."));
		return () => {
			active = false;
		};
	}, [open, reloadKey]);

	const linkedIds = new Set(c.products.map((p) => p.id));
	const candidates = (products ?? [])
		.filter((p) => !linkedIds.has(p.id))
		.map((p) => ({ ...p, compatible: isProductCompatible(c, p) }))
		.sort((a, b) => Number(b.compatible) - Number(a.compatible) || a.name.localeCompare(b.name));

	async function link(productId: string) {
		try {
			setLinking(productId);
			setErrors((prev) => ({ ...prev, [productId]: "" }));
			await linkHarvestCertificationProduct(c.id, productId);
			toast.success("Anúncio vinculado.");
			onLinked();
		} catch (e) {
			setErrors((prev) => ({
				...prev,
				[productId]: e instanceof Error ? e.message : "Não foi possível vincular.",
			}));
		} finally {
			setLinking(null);
		}
	}

	return (
		<Dialog open={open} onOpenChange={(o) => linking === null && onOpenChange(o)}>
			<DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
				<DialogHeader>
					<DialogTitle>Vincular anúncio</DialogTitle>
					<DialogDescription>
						A cultura ({c.crop}) precisa aparecer no nome, na variedade ou na categoria do anúncio, e a
						colheita precisa estar entre {formatCalendarDate(c.plantingDate)} e{" "}
						{formatCalendarDate(c.validUntil)}. Os anúncios compatíveis aparecem primeiro.
					</DialogDescription>
				</DialogHeader>

				{loadError ? (
					<div className="space-y-3 py-4 text-center">
						<p className="text-sm text-gray-600">{loadError}</p>
						<Button variant="outline" size="sm" onClick={() => setReloadKey((k) => k + 1)}>
							Tentar novamente
						</Button>
					</div>
				) : products === null ? (
					<div className="space-y-2">
						<Skeleton className="h-14 w-full" />
						<Skeleton className="h-14 w-full" />
					</div>
				) : candidates.length === 0 ? (
					<p className="py-4 text-center text-sm text-gray-500">
						Nenhum anúncio ativo disponível para vincular.
					</p>
				) : (
					<ul className="divide-y rounded-md border">
						{candidates.map((p) => {
							const otherCert = p.harvestCertificationId && p.harvestCertificationId !== c.id;
							return (
								<li key={p.id} className="space-y-2 p-3">
									<div className="flex flex-wrap items-center gap-3">
										<div className="min-w-0 flex-1">
											<p className="truncate text-sm font-medium text-gray-900">{p.name}</p>
											<p className="text-xs text-gray-500">
												{p.variety ? `${p.variety} · ` : ""}colheita {formatCalendarDate(p.harvestAt)}
											</p>
										</div>
										{p.compatible && (
											<Badge variant="outline" className="border-green-200 bg-green-50 text-green-800">
												Compatível
											</Badge>
										)}
										<Button
											type="button"
											size="sm"
											variant={p.compatible ? "default" : "outline"}
											onClick={() => link(p.id)}
											disabled={linking !== null}
										>
											{linking === p.id && <LoaderCircle className="size-4 animate-spin" />}
											Vincular
										</Button>
									</div>
									{otherCert && (
										<p className="flex items-center gap-1 text-xs text-amber-700">
											<AlertTriangle className="size-3.5" />
											Este anúncio já tem uma certificação de safra; ela será substituída.
										</p>
									)}
									{errors[p.id] && <p className="text-xs text-destructive">{errors[p.id]}</p>}
								</li>
							);
						})}
					</ul>
				)}
			</DialogContent>
		</Dialog>
	);
}

"use client";

import {
	CERTIFICATION_ROUTES,
	CERTIFICATION_STATUS_LABELS,
	CERTIFICATION_TYPE_LABELS,
	CERTIFICATION_TYPES,
	formatCalendarDate,
	isExpiredDate,
} from "@/components/certifications/certificationUtils";
import { formatNotificationDatetime } from "@/components/notifications/notificationUtils";
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
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { listAdminFarmCertifications } from "@/services/farmCertifications";
import {
	FarmCertificationAdminItem,
	FarmCertificationStatus,
	FarmCertificationType,
} from "@/types/types";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const PAGE_SIZE = 20;
const TABS: [FarmCertificationStatus, string][] = [
	["PENDING", "Pendentes"],
	["APPROVED", "Aprovadas"],
	["REJECTED", "Recusadas"],
	["EXPIRED", "Vencidas"],
	["REVOKED", "Revogadas"],
];
const ALL_TYPES = "ALL";

export default function FarmCertificationsQueueClient() {
	const router = useRouter();
	const [status, setStatus] = useState<FarmCertificationStatus>("PENDING");
	const [type, setType] = useState<FarmCertificationType | typeof ALL_TYPES>(ALL_TYPES);
	const [items, setItems] = useState<FarmCertificationAdminItem[]>([]);
	const [nextCursor, setNextCursor] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [loadingMore, setLoadingMore] = useState(false);
	const [error, setError] = useState<string | null>(null);
	// Descarta respostas de filtros anteriores
	const generationRef = useRef(0);

	const typeFilter = type === ALL_TYPES ? null : type;

	const loadFirstPage = useCallback(async () => {
		const generation = ++generationRef.current;
		try {
			setLoading(true);
			setError(null);
			const page = await listAdminFarmCertifications({ status, type: typeFilter, limit: PAGE_SIZE });
			if (generation !== generationRef.current) return;
			setItems(page.items);
			setNextCursor(page.nextCursor);
		} catch (e) {
			if (generation === generationRef.current) {
				setError(e instanceof Error ? e.message : "Não foi possível carregar as certificações.");
			}
		} finally {
			if (generation === generationRef.current) setLoading(false);
		}
	}, [status, typeFilter]);

	useEffect(() => {
		loadFirstPage();
		const ref = generationRef;
		return () => {
			ref.current++;
		};
	}, [loadFirstPage]);

	async function loadMore() {
		if (!nextCursor || loadingMore) return;
		const generation = generationRef.current;
		try {
			setLoadingMore(true);
			const page = await listAdminFarmCertifications({
				status,
				type: typeFilter,
				limit: PAGE_SIZE,
				cursor: nextCursor,
			});
			if (generation !== generationRef.current) return;
			setItems((prev) => [...prev, ...page.items]);
			setNextCursor(page.nextCursor);
		} catch (e) {
			if (generation === generationRef.current) {
				toast.error(e instanceof Error ? e.message : "Não foi possível carregar mais.");
			}
		} finally {
			if (generation === generationRef.current) setLoadingMore(false);
		}
	}

	return (
		<div className="space-y-4">
			<div>
				<h2 className="text-2xl font-semibold">Certificações de fazenda</h2>
				<p className="text-sm text-muted-foreground">
					Avalie os certificados enviados pelos produtores. Aprovadas e dentro da validade geram o selo
					público.
				</p>
			</div>

			<div className="flex flex-wrap items-center justify-between gap-3">
				<div className="flex flex-wrap gap-2" role="tablist">
					{TABS.map(([value, label]) => (
						<Button
							key={value}
							role="tab"
							aria-selected={status === value}
							variant={status === value ? "default" : "outline"}
							size="sm"
							onClick={() => setStatus(value)}
						>
							{label}
						</Button>
					))}
				</div>
				<Select value={type} onValueChange={(v) => setType(v as typeof type)}>
					<SelectTrigger className="w-56 bg-white" aria-label="Filtrar por tipo">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value={ALL_TYPES}>Todos os tipos</SelectItem>
						{CERTIFICATION_TYPES.map((t) => (
							<SelectItem key={t} value={t}>
								{CERTIFICATION_TYPE_LABELS[t]}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<div className="overflow-hidden rounded-lg border bg-white">
				{loading ? (
					<div className="space-y-2 p-4">
						{Array.from({ length: 5 }).map((_, i) => (
							<Skeleton key={i} className="h-10 w-full" />
						))}
					</div>
				) : error ? (
					<div className="space-y-3 px-4 py-12 text-center">
						<p className="text-muted-foreground">{error}</p>
						<Button variant="outline" onClick={loadFirstPage}>
							Tentar novamente
						</Button>
					</div>
				) : items.length === 0 ? (
					<p className="px-4 py-12 text-center text-muted-foreground">
						Nenhuma certificação {CERTIFICATION_STATUS_LABELS[status].toLowerCase()}.
					</p>
				) : (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Produtor</TableHead>
								<TableHead>Fazenda</TableHead>
								<TableHead className="hidden lg:table-cell">Município/UF</TableHead>
								<TableHead>Tipo</TableHead>
								<TableHead className="hidden xl:table-cell">Certificadora</TableHead>
								<TableHead>Validade</TableHead>
								<TableHead className="hidden md:table-cell text-center">Docs</TableHead>
								<TableHead className="hidden md:table-cell">Enviada em</TableHead>
								<TableHead className="hidden lg:table-cell">Avaliador</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{items.map((c) => {
								const href = CERTIFICATION_ROUTES.adminDetail(c.id);
								return (
									<TableRow
										key={c.id}
										className="cursor-pointer"
										tabIndex={0}
										onClick={() => router.push(href)}
										onKeyDown={(e) => e.key === "Enter" && router.push(href)}
									>
										<TableCell>
											<p className="font-medium">{c.user.name}</p>
											<p className="text-xs text-muted-foreground">{c.user.email}</p>
										</TableCell>
										<TableCell>{c.farmName}</TableCell>
										<TableCell className="hidden lg:table-cell">
											{c.city}/{c.uf}
										</TableCell>
										<TableCell>{CERTIFICATION_TYPE_LABELS[c.type] ?? c.type}</TableCell>
										<TableCell className="hidden xl:table-cell">{c.certifierName}</TableCell>
										<TableCell
											className={cn(
												status === "PENDING" && isExpiredDate(c.validUntil) && "font-medium text-red-700"
											)}
										>
											{formatCalendarDate(c.validUntil)}
										</TableCell>
										<TableCell className="hidden md:table-cell text-center">
											{c._count.documents}
										</TableCell>
										<TableCell className="hidden md:table-cell whitespace-nowrap">
											{formatNotificationDatetime(c.createdAt)}
										</TableCell>
										<TableCell className="hidden lg:table-cell">{c.reviewedBy?.name ?? "—"}</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				)}
			</div>

			{!loading && !error && nextCursor && (
				<div className="flex justify-center">
					<Button variant="outline" onClick={loadMore} disabled={loadingMore}>
						{loadingMore && <LoaderCircle className="size-4 animate-spin" />}
						Carregar mais
					</Button>
				</div>
			)}
		</div>
	);
}

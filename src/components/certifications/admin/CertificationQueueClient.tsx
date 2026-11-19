"use client";

import {
	CERTIFICATION_STATUS_LABELS,
	certificationRoutes,
	certificationTypeOptions,
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
import { listAdminCertifications } from "@/services/certifications";
import { CertificationScope, CertificationStatus } from "@/types/types";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const PAGE_SIZE = 20;
const TABS: [CertificationStatus, string][] = [
	["PENDING", "Pendentes"],
	["APPROVED", "Aprovadas"],
	["REJECTED", "Recusadas"],
	["EXPIRED", "Vencidas"],
	["REVOKED", "Revogadas"],
];
const ALL_TYPES = "ALL";

// Campos comuns dos itens da fila (GET /certifications/<scope>/admin)
export type QueueItemBase = {
	id: string;
	type: string;
	validUntil: string;
	createdAt: string;
	user: { id: string; name: string; email: string };
	reviewedBy: { id: string; name: string } | null;
};

// Coluna específica do escopo, inserida entre "Dono/Produtor" e "Validade"
export type QueueColumn<T> = { header: string; className?: string; cell: (item: T) => ReactNode };

type Props<T extends QueueItemBase> = {
	scope: CertificationScope;
	title: string;
	description: string;
	ownerLabel: string;
	columns: QueueColumn<T>[];
	// Colunas depois de "Validade" (ex.: nº de documentos e de anúncios)
	countColumns: QueueColumn<T>[];
};

export default function CertificationQueueClient<T extends QueueItemBase>({
	scope,
	title,
	description,
	ownerLabel,
	columns,
	countColumns,
}: Props<T>) {
	const router = useRouter();
	const routes = certificationRoutes(scope);
	const [status, setStatus] = useState<CertificationStatus>("PENDING");
	const [type, setType] = useState<string>(ALL_TYPES);
	const [items, setItems] = useState<T[]>([]);
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
			// Um "Carregar mais" do filtro anterior foi invalidado e não vai limpar o próprio estado
			setLoadingMore(false);
			setError(null);
			const page = await listAdminCertifications<T>(scope, { status, type: typeFilter, limit: PAGE_SIZE });
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
	}, [scope, status, typeFilter]);

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
			const page = await listAdminCertifications<T>(scope, {
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
				<h2 className="text-2xl font-semibold">{title}</h2>
				<p className="text-sm text-muted-foreground">{description}</p>
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
				<Select value={type} onValueChange={setType}>
					<SelectTrigger className="w-56 bg-white" aria-label="Filtrar por tipo">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value={ALL_TYPES}>Todos os tipos</SelectItem>
						{certificationTypeOptions(scope).map(([value, label]) => (
							<SelectItem key={value} value={value}>
								{label}
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
								<TableHead>{ownerLabel}</TableHead>
								{columns.map((c) => (
									<TableHead key={c.header} className={c.className}>
										{c.header}
									</TableHead>
								))}
								<TableHead>Validade</TableHead>
								{countColumns.map((c) => (
									<TableHead key={c.header} className={cn("text-center", c.className)}>
										{c.header}
									</TableHead>
								))}
								<TableHead className="hidden md:table-cell">Enviada em</TableHead>
								<TableHead className="hidden lg:table-cell">Avaliador</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{items.map((item) => {
								const href = routes.adminDetail(item.id);
								return (
									<TableRow
										key={item.id}
										className="cursor-pointer"
										tabIndex={0}
										onClick={() => router.push(href)}
										onKeyDown={(e) => e.key === "Enter" && router.push(href)}
									>
										<TableCell>
											<p className="font-medium">{item.user.name}</p>
											<p className="text-xs text-muted-foreground">{item.user.email}</p>
										</TableCell>
										{columns.map((c) => (
											<TableCell key={c.header} className={c.className}>
												{c.cell(item)}
											</TableCell>
										))}
										<TableCell
											className={cn(
												status === "PENDING" && isExpiredDate(item.validUntil) && "font-medium text-red-700"
											)}
										>
											{formatCalendarDate(item.validUntil)}
										</TableCell>
										{countColumns.map((c) => (
											<TableCell key={c.header} className={cn("text-center", c.className)}>
												{c.cell(item)}
											</TableCell>
										))}
										<TableCell className="hidden md:table-cell whitespace-nowrap">
											{formatNotificationDatetime(item.createdAt)}
										</TableCell>
										<TableCell className="hidden lg:table-cell">{item.reviewedBy?.name ?? "—"}</TableCell>
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

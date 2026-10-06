"use client";

import BottlenecksPanel from "@/components/admin/BottlenecksPanel";
import DateRangeFilter from "@/components/admin/DateRangeFilter";
import { KpiCard } from "@/components/admin/KpiCard";
import PipelineFilterBar, { PipelineFilterValue } from "@/components/admin/PipelineFilterBar";
import PipelineFunnelSteps from "@/components/admin/PipelineFunnelSteps";
import PipelineStatusBreakdown from "@/components/admin/PipelineStatusBreakdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";
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
import useFetchPipeline from "@/hooks/useFetchPipeline";
import {
	DatePreset,
	computePresetRange,
	endOfDayISO,
	startOfDayISO,
} from "@/lib/dateRangePresets";
import { PipelineFilterOptions } from "@/types/types";
import { moneyMask } from "@/utils/functions";
import {
	AlertTriangle,
	Box,
	CheckCircle2,
	Clock,
	Download,
	Eye,
	FileText,
	Layers,
	Lock,
	Truck,
	TrendingUp,
} from "lucide-react";
import { useState } from "react";

const PAGE_SIZE_OPTIONS = [10, 20, 50];

const EMPTY_FILTER_OPTIONS: PipelineFilterOptions = {
	produtos: [],
	compradores: [],
	vendedores: [],
	tiposOperacao: [],
	status: [],
};

function errorMessage(status: number) {
	if (status === 403) {
		return "Você não tem permissão de administrador para ver esses dados.";
	}
	if (status === 401) {
		return "Sua sessão expirou. Faça login novamente.";
	}
	if (status === 400) {
		return "Filtro inválido. Verifique as datas e os filtros selecionados.";
	}
	return "Não foi possível carregar o Pipeline das Operações agora. Tente novamente mais tarde.";
}

function statusBadgeClassName(status: string): string {
	const s = status.toLowerCase();
	if (s.includes("bloque") || s.includes("cancel") || s.includes("recusad")) {
		return "border-transparent bg-destructive/10 text-destructive";
	}
	if (s.includes("aguardando")) {
		return "border-transparent bg-attention/10 text-attention";
	}
	if (s.includes("transporte")) {
		return "border-transparent bg-info/10 text-info";
	}
	return "border-transparent bg-primary/10 text-primary";
}

export default function PipelineClient() {
	const [preset, setPreset] = useState<DatePreset | null>(null);
	const [customStart, setCustomStart] = useState("");
	const [customEnd, setCustomEnd] = useState("");
	const [appliedQuery, setAppliedQuery] = useState<{
		produto?: string;
		comprador?: string;
		vendedor?: string;
		stage?: string;
		blocked?: boolean;
	}>({});
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);
	const [showStatusDetails, setShowStatusDetails] = useState(false);

	const presetRange = preset ? computePresetRange(preset) : null;
	const startDate = presetRange
		? presetRange.startDate
		: customStart
			? startOfDayISO(customStart)
			: undefined;
	const endDate = presetRange
		? presetRange.endDate
		: customEnd
			? endOfDayISO(customEnd)
			: undefined;

	const { result, isLoading } = useFetchPipeline({
		page,
		pageSize,
		startDate,
		endDate,
		produto: appliedQuery.produto,
		comprador: appliedQuery.comprador,
		vendedor: appliedQuery.vendedor,
		stage: appliedQuery.stage,
		blocked: appliedQuery.blocked,
	});

	const filterOptions = result && result.ok ? result.data.filterOptions : EMPTY_FILTER_OPTIONS;

	function handlePresetSelect(next: DatePreset | null) {
		setPreset(next);
		setCustomStart("");
		setCustomEnd("");
		setPage(1);
	}

	function handleCustomChange(field: "start" | "end", value: string) {
		setPreset(null);
		if (field === "start") setCustomStart(value);
		else setCustomEnd(value);
		setPage(1);
	}

	function handleClearDate() {
		setPreset(null);
		setCustomStart("");
		setCustomEnd("");
		setPage(1);
	}

	function handleApplyFilters(value: PipelineFilterValue) {
		const selected = filterOptions.status.find((s) => s.value === value.status);
		const stage = selected?.stages ? [...selected.stages].sort((a, b) => a - b).join(",") : undefined;
		const blocked = selected?.blocked ? true : undefined;
		setAppliedQuery({
			produto: value.produto,
			comprador: value.comprador,
			vendedor: value.vendedor,
			stage,
			blocked,
		});
		setPage(1);
	}

	if (isLoading) {
		return (
			<div className="space-y-2">
				<Skeleton className="h-20 w-full" />
				<div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
					{[0, 1, 2, 3, 4].map((i) => (
						<Skeleton key={i} className="h-24 w-full" />
					))}
				</div>
				<Skeleton className="h-56 w-full" />
				<Skeleton className="h-96 w-full" />
			</div>
		);
	}

	if (!result || !result.ok) {
		return (
			<div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-white p-10 text-center">
				<AlertTriangle className="text-attention" size={28} />
				<p className="text-sm text-foreground/80">{errorMessage(result?.status ?? 500)}</p>
			</div>
		);
	}

	const { counters, gargalos, funnel, statusCounts, terminal, list } = result.data;

	const aguardandoPercentAtivas =
		counters.operacoesAtivas > 0
			? Math.round((counters.aguardandoPagamento / counters.operacoesAtivas) * 100)
			: 0;
	const bloqueadasPercentAtivas =
		counters.operacoesAtivas > 0
			? Math.round((counters.bloqueadas / counters.operacoesAtivas) * 100)
			: 0;

	const funnelTotal = funnel[0]?.count ?? counters.totalContratos;
	const criticoShare = funnelTotal > 0 ? (counters.bloqueadas / funnelTotal) * 100 : 0;
	const atencaoShare = funnelTotal > 0 ? (counters.aguardandoPagamento / funnelTotal) * 100 : 0;
	const normalShare = Math.max(0, 100 - criticoShare - atencaoShare);

	const bottleneckItems = [
		{
			key: "aguardandoPagamento",
			label: "Aguardando pagamento",
			description: "Operações sem pagamento validado",
			count: gargalos.aguardandoPagamento,
			icon: Clock,
			iconClassName: "bg-attention/10 text-attention",
		},
		{
			key: "bloqueadas",
			label: "Bloqueadas",
			description: "Operações bloqueadas por regras",
			count: gargalos.bloqueadas,
			icon: Lock,
			iconClassName: "bg-destructive/10 text-destructive",
		},
		{
			key: "semDocumentos",
			label: "Sem documentos",
			description: "Documentos pendentes de envio",
			count: gargalos.semDocumentos,
			icon: FileText,
			iconClassName: "bg-info/10 text-info",
		},
		{
			key: "entregaAtrasada",
			label: "Entrega atrasada",
			description: "Entregas fora do prazo",
			count: gargalos.entregaAtrasada,
			icon: Truck,
			iconClassName: "bg-destructive/10 text-destructive",
		},
	];

	const rangeStart = list.total === 0 ? 0 : (list.page - 1) * list.pageSize + 1;
	const rangeEnd = Math.min(list.page * list.pageSize, list.total);

	return (
		<div className="space-y-2">
			<div className="rounded-xl border border-border bg-white p-4">
				<div className="min-w-0">
					<h1 className="text-2xl font-bold text-foreground sm:text-3xl">Pipeline das Operações</h1>
					<p className="truncate text-xs text-muted-foreground">
						Acompanhe o fluxo completo das operações em tempo real
					</p>
				</div>

				<div className="mt-3 flex flex-wrap items-end justify-end gap-3">
					<DateRangeFilter
						preset={preset}
						customStart={customStart}
						customEnd={customEnd}
						onPresetSelect={handlePresetSelect}
						onCustomChange={handleCustomChange}
						onClear={handleClearDate}
					/>
					<div className="flex shrink-0 flex-col gap-1">
						<span className="invisible text-xs">Exportar</span>
						<Button
							disabled
							size="sm"
							className="h-8 gap-1.5 px-2 text-xs"
							title="Exportação ainda não disponível"
						>
							<Download size={12} />
							Exportar
						</Button>
					</div>
				</div>
			</div>

			<div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
				<KpiCard
					title="Operações Ativas"
					value={counters.operacoesAtivas.toLocaleString("pt-BR")}
					subValue="Em andamento"
					icon={Box}
					iconClassName="bg-primary/10 text-primary"
					tone="neutral"
				/>
				<KpiCard
					title="Finalizadas"
					value={counters.finalizadas.toLocaleString("pt-BR")}
					subValue="Concluídas"
					icon={CheckCircle2}
					iconClassName="bg-info/10 text-info"
					tone="neutral"
				/>
				<KpiCard
					title="Aguardando Pagamento"
					value={counters.aguardandoPagamento.toLocaleString("pt-BR")}
					subValue={`${aguardandoPercentAtivas}% das ativas`}
					icon={Clock}
					iconClassName="bg-attention/10 text-attention"
					tone="neutral"
				/>
				<KpiCard
					title="Bloqueadas"
					value={counters.bloqueadas.toLocaleString("pt-BR")}
					subValue={`${bloqueadasPercentAtivas}% das ativas`}
					icon={Lock}
					iconClassName="bg-destructive/10 text-destructive"
					tone="neutral"
				/>
				<KpiCard
					title="Taxa de Conversão"
					value={`${counters.taxaConversaoPercent.toLocaleString("pt-BR")}%`}
					subValue={`${counters.finalizadas} de ${counters.totalContratos} contratos`}
					icon={TrendingUp}
					iconClassName="bg-primary/10 text-primary"
					tone="neutral"
				/>
			</div>

			<PipelineFunnelSteps
				data={funnel}
				showPercent
				segments={{ normal: normalShare, atencao: atencaoShare, critico: criticoShare }}
				rightSlot={
					<Button
						variant="outline"
						size="sm"
						className="gap-1.5"
						onClick={() => setShowStatusDetails((v) => !v)}
					>
						<Layers size={14} />
						{showStatusDetails ? "Ocultar detalhes por etapa" : "Ver detalhes por etapa"}
					</Button>
				}
			/>

			{showStatusDetails && (
				<PipelineStatusBreakdown statusCounts={statusCounts} terminal={terminal} />
			)}

			<PipelineFilterBar options={filterOptions} onApply={handleApplyFilters} />

			<div className="grid grid-cols-1 gap-2 xl:grid-cols-4">
				<BottlenecksPanel items={bottleneckItems} />

				<div className="rounded-xl border border-border bg-white p-4 xl:col-span-3">
					<h3 className="mb-4 text-sm font-semibold text-foreground">Operações em andamento</h3>
					{list.items.length === 0 ? (
						<p className="py-6 text-center text-sm text-muted-foreground">
							Nenhuma operação encontrada para os filtros selecionados.
						</p>
					) : (
						<>
							<div className="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>ID Operação</TableHead>
											<TableHead>Produto</TableHead>
											<TableHead>Comprador</TableHead>
											<TableHead>Vendedor</TableHead>
											<TableHead className="text-right">Valor (R$)</TableHead>
											<TableHead>Status</TableHead>
											<TableHead>Dias na etapa</TableHead>
											<TableHead className="text-right">Ação</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{list.items.map((row) => (
											<TableRow key={row.id}>
												<TableCell>{row.orderNumber}</TableCell>
												<TableCell className="max-w-[10rem] truncate" title={row.produto}>
													{row.produto}
												</TableCell>
												<TableCell className="max-w-[10rem] truncate" title={row.comprador}>
													{row.comprador}
												</TableCell>
												<TableCell className="max-w-[10rem] truncate" title={row.vendedor}>
													{row.vendedor}
												</TableCell>
												<TableCell className="text-right">{moneyMask(row.valor)}</TableCell>
												<TableCell>
													<Badge className={statusBadgeClassName(row.status)}>{row.status}</Badge>
												</TableCell>
												<TableCell>{row.diasEtapa} dia(s)</TableCell>
												<TableCell className="text-right">
													<Button
														type="button"
														variant="ghost"
														size="icon"
														disabled
														className="ml-auto size-7"
														aria-label={`Ver detalhes da operação ${row.orderNumber} (em breve)`}
														title="Ver detalhes (em breve)"
													>
														<Eye size={16} className="text-muted-foreground/60" />
													</Button>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>

							<div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
								<p className="text-xs text-muted-foreground">
									Exibindo {rangeStart} a {rangeEnd} de {list.total} operações
								</p>
								<div className="flex items-center gap-3">
									<Pagination className="mx-0 w-auto">
										<PaginationContent>
											<PaginationItem>
												<PaginationPrevious
													href="#"
													aria-disabled={list.page <= 1}
													className={list.page <= 1 ? "pointer-events-none opacity-50" : ""}
													onClick={(e) => {
														e.preventDefault();
														setPage((p) => Math.max(1, p - 1));
													}}
												/>
											</PaginationItem>
											<PaginationItem>
												<PaginationNext
													href="#"
													aria-disabled={list.page >= list.totalPages}
													className={
														list.page >= list.totalPages ? "pointer-events-none opacity-50" : ""
													}
													onClick={(e) => {
														e.preventDefault();
														setPage((p) => Math.min(list.totalPages, p + 1));
													}}
												/>
											</PaginationItem>
										</PaginationContent>
									</Pagination>
									<Select
										value={String(pageSize)}
										onValueChange={(v) => {
											setPageSize(Number(v));
											setPage(1);
										}}
									>
										<SelectTrigger size="sm" className="w-[8.5rem]">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{PAGE_SIZE_OPTIONS.map((size) => (
												<SelectItem key={size} value={String(size)}>
													{size} por página
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</div>
						</>
					)}
				</div>
			</div>
		</div>
	);
}

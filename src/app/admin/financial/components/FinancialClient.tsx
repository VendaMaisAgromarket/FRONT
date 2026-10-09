"use client";

import BottlenecksPanel from "@/components/admin/BottlenecksPanel";
import DateRangeFilter from "@/components/admin/DateRangeFilter";
import EntityFilters, { EntityFiltersValue } from "@/components/admin/EntityFilters";
import FinancialResourcesDonut from "@/components/admin/FinancialResourcesDonut";
import ForecastBarChart from "@/components/admin/ForecastBarChart";
import { KpiCard } from "@/components/admin/KpiCard";
import PartnerPerformanceTable from "@/components/admin/PartnerPerformanceTable";
import PaymentSummaryDonut from "@/components/admin/PaymentSummaryDonut";
import { Badge } from "@/components/ui/badge";
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
import useFetchFinancial from "@/hooks/useFetchFinancial";
import {
	DatePreset,
	computePresetRange,
	endOfDayISO,
	startOfDayISO,
} from "@/lib/dateRangePresets";
import { FinancialCounters, FinancialFilterOptions, FinancialSituacao } from "@/types/types";
import {
	AlertTriangle,
	CalendarX,
	CheckCircle2,
	Clock,
	Download,
	FileCheck,
	FileSignature,
	Hourglass,
	Landmark,
	Lock,
	RefreshCw,
	ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const ALL = "__all__";
// Card mostra só as primeiras; "Ver todas" refaz a mesma chamada com o teto do back (200).
const CRITICAL_PREVIEW_LIMIT = 5;
const CRITICAL_FULL_LIMIT = 200;
const TIME_ZONE = "America/Sao_Paulo";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
	style: "currency",
	currency: "BRL",
});

// Eixo/tooltip do gráfico sem centavos, senão o rótulo do eixo Y não cabe.
const chartCurrencyFormatter = new Intl.NumberFormat("pt-BR", {
	style: "currency",
	currency: "BRL",
	maximumFractionDigits: 0,
});

const formatCurrency = (value: number) => currencyFormatter.format(value);
const formatChartCurrency = (value: number) => chartCurrencyFormatter.format(value);
const formatCount = (value: number) => value.toLocaleString("pt-BR");
const formatOrderNumber = (orderNumber: number) => `OP-${String(orderNumber).padStart(3, "0")}`;

function formatDate(iso: string) {
	return new Date(iso).toLocaleDateString("pt-BR", { timeZone: TIME_ZONE });
}

function formatDatetime(iso: string) {
	const date = new Date(iso);
	const time = date.toLocaleTimeString("pt-BR", {
		timeZone: TIME_ZONE,
		hour: "2-digit",
		minute: "2-digit",
	});
	return `${formatDate(iso)}, ${time}h`;
}

const EMPTY_FILTER_OPTIONS: FinancialFilterOptions = {
	produtos: [],
	compradores: [],
	vendedores: [],
	parceiros: [],
	tiposOperacao: [],
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
	return "Não foi possível carregar o Controle Financeiro agora. Tente novamente mais tarde.";
}

function situacaoBadgeClassName(situacao: FinancialSituacao): string {
	if (situacao === "Inadimplente") return "border-transparent bg-destructive/10 text-destructive";
	if (situacao === "Aguardando Pagamento") return "border-transparent bg-attention/10 text-attention";
	return "border-transparent bg-info/10 text-info";
}

// "vs mês anterior" vem sempre null hoje — só monta o texto quando o back passar a preencher.
function withVariation(base: string, counters: FinancialCounters) {
	if (counters.variacaoMesAnterior == null) return base;
	const sign = counters.variacaoMesAnterior > 0 ? "↗" : counters.variacaoMesAnterior < 0 ? "↘" : "→";
	return `${base} · ${sign} ${Math.abs(counters.variacaoMesAnterior)}% vs mês anterior`;
}

export default function FinancialClient() {
	const [preset, setPreset] = useState<DatePreset | null>(null);
	const [customStart, setCustomStart] = useState("");
	const [customEnd, setCustomEnd] = useState("");
	const [parceiro, setParceiro] = useState<string | undefined>(undefined);
	const [entityFilters, setEntityFilters] = useState<EntityFiltersValue>({});
	const [showAllCritical, setShowAllCritical] = useState(false);

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

	const { result, isLoading, isFetching, refetch } = useFetchFinancial({
		limit: showAllCritical ? CRITICAL_FULL_LIMIT : CRITICAL_PREVIEW_LIMIT,
		startDate,
		endDate,
		parceiro,
		...entityFilters,
	});

	const filterOptions = result && result.ok ? result.data.filterOptions : EMPTY_FILTER_OPTIONS;

	function handlePresetSelect(next: DatePreset | null) {
		setPreset(next);
		setCustomStart("");
		setCustomEnd("");
	}

	function handleCustomChange(field: "start" | "end", value: string) {
		setPreset(null);
		if (field === "start") setCustomStart(value);
		else setCustomEnd(value);
	}

	function handleClearDate() {
		setPreset(null);
		setCustomStart("");
		setCustomEnd("");
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
				<div className="grid grid-cols-1 gap-2 xl:grid-cols-3">
					<Skeleton className="h-72 w-full" />
					<Skeleton className="h-72 w-full" />
					<Skeleton className="h-72 w-full" />
				</div>
				<Skeleton className="h-72 w-full" />
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

	const {
		generatedAt,
		regras,
		counters,
		situacaoRecursos,
		operacoesCriticas,
		gargalos,
		evolucao,
		performancePorParceiro,
		resumoPagamento,
		embarque,
	} = result.data;

	const hasMoreCritical = operacoesCriticas.total > operacoesCriticas.items.length;

	const bottleneckItems = [
		{
			key: "aguardandoPagamento",
			label: "Aguardando pagamento",
			description: "Operações sem pagamento validado",
			count: gargalos.aguardandoPagamento,
			icon: Hourglass,
			iconClassName: "bg-attention/10 text-attention",
		},
		{
			key: "semTermoAditivo",
			label: "Sem termo aditivo",
			description: "Operações com pagamento parcial",
			count: gargalos.semTermoAditivo,
			icon: FileSignature,
			iconClassName: "bg-info/10 text-info",
		},
		{
			key: "bloqueadas",
			label: "Operações bloqueadas",
			description: "Por regras financeiras",
			count: gargalos.bloqueadas,
			icon: Lock,
			iconClassName: "bg-destructive/10 text-destructive",
		},
		{
			key: "pagamentoVencido",
			label: "Pagamento vencido",
			description: "Operações em atraso",
			count: gargalos.pagamentoVencido,
			icon: CalendarX,
			iconClassName: "bg-destructive/10 text-destructive",
		},
	];

	return (
		<div className="space-y-2">
			<div className="rounded-xl border border-border bg-white p-4">
				<div className="min-w-0">
					<h1 className="text-2xl font-bold text-foreground sm:text-3xl">Controle Financeiro</h1>
					<p className="truncate text-xs text-muted-foreground">
						Acompanhe a situação financeira das operações e liberação de pagamentos
					</p>
				</div>

				<div className="mt-3 flex flex-wrap items-end gap-3">
					<DateRangeFilter
						preset={preset}
						customStart={customStart}
						customEnd={customEnd}
						onPresetSelect={handlePresetSelect}
						onCustomChange={handleCustomChange}
						onClear={handleClearDate}
					/>

					<div className="flex shrink-0 flex-col gap-1">
						<span className="text-xs text-muted-foreground">Parceiro</span>
						<Select value={parceiro ?? ALL} onValueChange={(v) => setParceiro(v === ALL ? undefined : v)}>
							<SelectTrigger size="sm" className="w-[8.5rem]">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value={ALL}>Todos</SelectItem>
								{filterOptions.parceiros.map((p) => (
									<SelectItem key={p.id} value={p.id}>
										{p.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<EntityFilters
						options={filterOptions}
						value={entityFilters}
						onChange={setEntityFilters}
						showTipoOperacao={false}
					/>

					<div className="ml-auto flex shrink-0 flex-col gap-1">
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
					title="Saldo Vinculado"
					value={formatCurrency(counters.saldoVinculado)}
					subValue={withVariation("Em conta vinculada", counters)}
					icon={Landmark}
					iconClassName="bg-primary/10 text-primary"
					tone="neutral"
				/>
				<KpiCard
					title="Valor Liberado"
					value={formatCurrency(counters.valorLiberado)}
					subValue={withVariation(
						`Repasse a vendedores (líquido de ${regras.taxaPlataformaPercent}%)`,
						counters
					)}
					icon={CheckCircle2}
					iconClassName="bg-primary/10 text-primary"
					tone="neutral"
				/>
				<KpiCard
					title="Valor Pendente"
					value={formatCurrency(counters.valorPendente)}
					subValue={withVariation("Aguardando pagamento", counters)}
					icon={Hourglass}
					iconClassName="bg-attention/10 text-attention"
					tone="neutral"
				/>
				<KpiCard
					title="Inadimplência"
					value={formatCurrency(counters.inadimplencia)}
					subValue={withVariation("Em atraso", counters)}
					icon={AlertTriangle}
					iconClassName="bg-destructive/10 text-destructive"
					tone="neutral"
				/>
				<KpiCard
					title="Operações Bloqueadas"
					value={formatCount(counters.operacoesBloqueadas)}
					subValue={withVariation("Por regras financeiras", counters)}
					icon={Lock}
					iconClassName="bg-destructive/10 text-destructive"
					tone="neutral"
				/>
			</div>

			<div className="grid grid-cols-1 gap-2 xl:grid-cols-4">
				<FinancialResourcesDonut
					slices={situacaoRecursos.slices}
					totalGerenciado={situacaoRecursos.totalGerenciado}
					valueFormatter={formatCurrency}
				/>

				<div className="flex flex-col rounded-xl border border-border bg-white p-4 xl:col-span-2">
					<div className="mb-1 flex items-center justify-between gap-2">
						<h3 className="text-sm font-semibold text-foreground">Operações Financeiras Críticas</h3>
						{isFetching && <RefreshCw size={14} className="animate-spin text-muted-foreground" />}
					</div>
					<p className="mb-3 text-xs text-muted-foreground">
						Mostrando {operacoesCriticas.items.length} de {operacoesCriticas.total} operação(ões)
					</p>

					{operacoesCriticas.items.length === 0 ? (
						<p className="flex-1 py-6 text-center text-sm text-muted-foreground">
							Nenhuma operação crítica para os filtros selecionados.
						</p>
					) : (
						<div
							className={
								showAllCritical ? "max-h-[28rem] flex-1 overflow-auto" : "flex-1 overflow-x-auto"
							}
						>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Operação</TableHead>
										<TableHead>Comprador</TableHead>
										<TableHead className="text-right">Valor</TableHead>
										<TableHead>Situação</TableHead>
										<TableHead>Vencimento</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{operacoesCriticas.items.map((item) => (
										<TableRow key={item.id}>
											<TableCell className="font-medium">{formatOrderNumber(item.orderNumber)}</TableCell>
											<TableCell className="max-w-[10rem] truncate" title={item.comprador}>
												{item.comprador}
											</TableCell>
											<TableCell className="text-right">{formatCurrency(item.valor)}</TableCell>
											<TableCell>
												<Badge className={situacaoBadgeClassName(item.situacao)}>{item.situacao}</Badge>
											</TableCell>
											<TableCell>
												{item.vencimento ? (
													<span
														title={`Data aproximada: emissão da cobrança + ${regras.diasParaVencimento} dias`}
													>
														≈ {formatDate(item.vencimento)}
													</span>
												) : (
													<span
														className="text-muted-foreground"
														title="Cobrança ainda não gerada"
													>
														—
													</span>
												)}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					)}

					{(hasMoreCritical || showAllCritical) && (
						<button
							type="button"
							onClick={() => setShowAllCritical((prev) => !prev)}
							className="mt-3 self-center text-sm text-primary hover:underline"
						>
							{showAllCritical ? "Mostrar menos" : "Ver todas as operações críticas →"}
						</button>
					)}
				</div>

				<BottlenecksPanel
					title="Gargalos Financeiros"
					items={bottleneckItems}
					footer={
						<Link
							href="/admin/alerts"
							className="mt-2 block text-center text-sm text-primary hover:underline"
						>
							Ver todos os alertas →
						</Link>
					}
				/>
			</div>

			<div className="grid grid-cols-1 gap-2 xl:grid-cols-3">
				<ForecastBarChart
					title="Evolução Financeira"
					subtitle="Últimos 12 meses"
					data={evolucao}
					valueFormatter={formatChartCurrency}
					variant="area"
					seriesLabels={{ realizado: "Recebido" }}
				/>
				<PartnerPerformanceTable rows={performancePorParceiro} valueFormatter={formatCurrency} />
				<PaymentSummaryDonut data={resumoPagamento} valueFormatter={formatCurrency} />
			</div>

			<div className="rounded-xl border border-border bg-white p-4">
				<h3 className="mb-3 text-sm font-semibold text-foreground">Operações Aptas para Embarque</h3>
				<div className="grid grid-cols-1 gap-2 sm:grid-cols-3 xl:grid-cols-5">
					<div className="flex items-center gap-3 rounded-lg bg-primary/10 p-3">
						<CheckCircle2 size={22} className="shrink-0 text-primary" />
						<div>
							<div className="text-xs text-muted-foreground">Aptas para embarque</div>
							<div className="text-xl font-semibold text-foreground">{formatCount(embarque.aptas)}</div>
						</div>
					</div>
					<div className="flex items-center gap-3 rounded-lg bg-attention/10 p-3">
						<Clock size={22} className="shrink-0 text-attention" />
						<div>
							<div className="text-xs text-muted-foreground">Aguardando pagamento</div>
							<div className="text-xl font-semibold text-foreground">
								{formatCount(embarque.aguardandoPagamento)}
							</div>
						</div>
					</div>
					<div className="flex items-center gap-3 rounded-lg bg-destructive/10 p-3">
						<Lock size={22} className="shrink-0 text-destructive" />
						<div>
							<div className="text-xs text-muted-foreground">Bloqueadas por regras</div>
							<div className="text-xl font-semibold text-foreground">
								{formatCount(embarque.bloqueadas)}
							</div>
						</div>
					</div>
					<div className="flex gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
						<ShieldCheck size={22} className="mt-0.5 shrink-0 text-primary" />
						<div>
							<h4 className="text-sm font-semibold text-primary">Regra de Segurança VENDA+</h4>
							<p className="mt-0.5 text-xs text-muted-foreground">
								Nenhuma operação é liberada para embarque sem validação financeira. Segurança para
								comprador e vendedor.
							</p>
						</div>
					</div>
					<div
						className="flex cursor-not-allowed items-center gap-3 rounded-lg border border-border p-3 opacity-70"
						title="Auditoria financeira ainda não disponível"
					>
						<FileCheck size={22} className="shrink-0 text-muted-foreground" />
						<div className="min-w-0 flex-1">
							<h4 className="text-sm font-semibold text-foreground">Auditoria Financeira</h4>
							<p className="text-xs text-muted-foreground">Histórico de liberações</p>
						</div>
						<Badge variant="outline" className="text-[10px]">
							Em breve
						</Badge>
					</div>
				</div>
			</div>

			<div className="flex items-center justify-center gap-3 py-1 text-xs text-muted-foreground">
				<span>Última atualização: {formatDatetime(generatedAt)}</span>
				<button
					type="button"
					onClick={() => refetch()}
					disabled={isFetching}
					className="flex items-center gap-1 text-foreground/80 hover:text-primary disabled:opacity-50"
				>
					<RefreshCw size={12} className={isFetching ? "animate-spin" : undefined} />
					Atualizar
				</button>
			</div>
		</div>
	);
}

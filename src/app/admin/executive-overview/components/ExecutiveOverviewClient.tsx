"use client";

import AlertsCountCards from "@/components/admin/AlertsCountCards";
import EntityFilters, { EntityFiltersValue } from "@/components/admin/EntityFilters";
import ForecastBarChart from "@/components/admin/ForecastBarChart";
import { KpiCard } from "@/components/admin/KpiCard";
import OriginDestinationTable from "@/components/admin/OriginDestinationTable";
import PartyRankingTable from "@/components/admin/PartyRankingTable";
import PipelineFunnelSteps from "@/components/admin/PipelineFunnelSteps";
import ProductRevenueDonut from "@/components/admin/ProductRevenueDonut";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import useFetchAlerts from "@/hooks/useFetchAlerts";
import useFetchExecutiveOverview from "@/hooks/useFetchExecutiveOverview";
import { ExecutiveOverviewFilterOptions } from "@/types/types";
import {
	AlertTriangle,
	Banknote,
	Box,
	CheckCircle2,
	Download,
	Landmark,
	Lock,
	TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
	style: "currency",
	currency: "BRL",
	maximumFractionDigits: 0,
});

const formatCurrency = (value: number) => currencyFormatter.format(value);
const formatCount = (value: number) => value.toLocaleString("pt-BR");

const MONTH_LABELS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

function formatPeriodMonth(ym: string) {
	const [year, month] = ym.split("-");
	return `${MONTH_LABELS[Number(month) - 1]}/${year}`;
}

const EMPTY_FILTER_OPTIONS: ExecutiveOverviewFilterOptions = {
	produtos: [],
	compradores: [],
	vendedores: [],
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
		return "Filtro inválido. Verifique os filtros selecionados.";
	}
	return "Não foi possível carregar a Visão Executiva agora. Tente novamente mais tarde.";
}

export default function ExecutiveOverviewClient() {
	const [filters, setFilters] = useState<EntityFiltersValue>({});
	const { result, isLoading } = useFetchExecutiveOverview(filters);
	const { result: alertsResult } = useFetchAlerts({ limit: 1 });

	const filterOptions = result && result.ok ? result.data.filterOptions : EMPTY_FILTER_OPTIONS;

	if (isLoading) {
		return (
			<div className="space-y-2">
				<Skeleton className="h-20 w-full" />
				<div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
					{[0, 1, 2, 3, 4, 5].map((i) => (
						<Skeleton key={i} className="h-24 w-full" />
					))}
				</div>
				<div className="grid grid-cols-1 gap-2 xl:grid-cols-4">
					<Skeleton className="h-72 w-full xl:col-span-2" />
					<Skeleton className="h-72 w-full" />
					<Skeleton className="h-72 w-full" />
				</div>
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
		period,
		faturamento,
		receita,
		counters,
		faturamentoPorProduto,
		origemDestino,
		principaisCompradores,
		principaisVendedores,
		pipeline,
	} = result.data;

	const periodLabel = `${formatPeriodMonth(period.from)} – ${formatPeriodMonth(period.to)}`;

	return (
		<div className="space-y-2">
			<div className="rounded-xl border border-border bg-white p-4">
				<div className="min-w-0">
					<h1 className="text-2xl font-bold text-foreground sm:text-3xl">Visão Executiva</h1>
					<p className="truncate text-xs text-muted-foreground">
						Visão geral das operações da VENDA+ AGROMARKET
					</p>
				</div>

				<div className="mt-3 flex flex-nowrap items-end gap-2 overflow-x-auto pb-1">
					<div className="flex shrink-0 flex-col gap-1">
						<span className="text-xs text-muted-foreground">Período</span>
						<Select value="12m" disabled>
							<SelectTrigger size="sm" className="w-[9.5rem]" title={periodLabel}>
								<SelectValue>Últimos 12 meses</SelectValue>
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="12m">Últimos 12 meses</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<EntityFilters options={filterOptions} value={filters} onChange={setFilters} />

					<div className="flex shrink-0 flex-col gap-1">
						<span className="invisible text-xs">Exportar</span>
						<Button disabled size="sm" className="gap-1.5" title="Exportação ainda não disponível">
							<Download size={14} />
							Exportar
						</Button>
					</div>
				</div>
			</div>

			<div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
				<KpiCard
					title="Faturamento (12 meses)"
					value={formatCurrency(faturamento.accumulated.realizado)}
					subValue={`Previsto: ${formatCurrency(faturamento.accumulated.previsto)}`}
					icon={Banknote}
					iconClassName="bg-primary/10 text-primary"
					tone="neutral"
				/>
				<KpiCard
					title="Receita VENDA+ (12 meses)"
					value={formatCurrency(receita.accumulated.realizado)}
					subValue={`Previsto: ${formatCurrency(receita.accumulated.previsto)}`}
					icon={TrendingUp}
					iconClassName="bg-primary/10 text-primary"
					tone="neutral"
				/>
				<KpiCard
					title="Operações Ativas"
					value={formatCount(counters.operacoesAtivas)}
					icon={Box}
					iconClassName="bg-info/10 text-info"
					tone="neutral"
				/>
				<KpiCard
					title="Operações Concluídas"
					value={formatCount(counters.operacoesConcluidas)}
					icon={CheckCircle2}
					iconClassName="bg-attention/10 text-attention"
					tone="neutral"
				/>
				<KpiCard
					title="Operações Bloqueadas"
					value={formatCount(counters.operacoesBloqueadas)}
					subValue="Canceladas ou recusadas pelo vendedor"
					icon={Lock}
					iconClassName="bg-destructive/10 text-destructive"
					tone="neutral"
				/>
				<KpiCard
					title="Valor Retido"
					value={formatCurrency(counters.valorRetido)}
					subValue="Conta vinculada"
					icon={Landmark}
					iconClassName="bg-foreground/10 text-foreground"
					tone="neutral"
				/>
			</div>

			<div className="grid grid-cols-1 gap-2 xl:grid-cols-4">
				<div className="xl:col-span-2">
					<ForecastBarChart
						title="Faturamento — Previsto x Realizado"
						data={faturamento.monthly}
						valueFormatter={formatCurrency}
						variant="area"
					/>
				</div>
				<ProductRevenueDonut data={faturamentoPorProduto} valueFormatter={formatCurrency} />
				<OriginDestinationTable data={origemDestino} valueFormatter={formatCurrency} />
			</div>

			<div className="grid grid-cols-1 gap-2 xl:grid-cols-4">
				<div className="xl:col-span-2">
					<PipelineFunnelSteps title="Resumo do Pipeline" data={pipeline.funnel} />
				</div>
				<PartyRankingTable
					title="Principais Compradores (12 meses)"
					rows={principaisCompradores}
					valueFormatter={formatCurrency}
				/>
				<PartyRankingTable
					title="Principais Vendedores (12 meses)"
					rows={principaisVendedores}
					valueFormatter={formatCurrency}
				/>
			</div>

			{alertsResult?.ok && (
				<div className="space-y-2">
					<div className="flex items-center justify-between">
						<h3 className="text-sm font-semibold text-foreground">Alertas Críticos</h3>
						<Link href="/admin/alerts" className="text-sm text-primary hover:underline">
							Ver todos os alertas
						</Link>
					</div>
					<AlertsCountCards counts={alertsResult.data.counts} />
				</div>
			)}
		</div>
	);
}

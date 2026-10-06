"use client";

import AlertsCategoryDonut from "@/components/admin/AlertsCategoryDonut";
import AlertsEvolutionChart from "@/components/admin/AlertsEvolutionChart";
import BottlenecksPanel from "@/components/admin/BottlenecksPanel";
import DateRangeFilter from "@/components/admin/DateRangeFilter";
import { KpiCard } from "@/components/admin/KpiCard";
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
import useFetchAlerts from "@/hooks/useFetchAlerts";
import {
	DatePreset,
	computePresetRange,
	endOfDayISO,
	startOfDayISO,
} from "@/lib/dateRangePresets";
import { AlertsFilterOptions } from "@/types/types";
import {
	Activity,
	AlertTriangle,
	Clock,
	Download,
	FileSignature,
	FileText,
	Info,
	Lightbulb,
	Lock,
	Truck,
} from "lucide-react";
import { useState } from "react";

const ALL = "__all__";
const LIMIT_OPTIONS = [25, 50, 100];

const EMPTY_FILTER_OPTIONS: AlertsFilterOptions = {
	categorias: [],
	criticidades: [],
	parceiros: [],
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
	return "Não foi possível carregar os Alertas Operacionais agora. Tente novamente mais tarde.";
}

function criticidadeBadgeClassName(criticidade: string): string {
	if (criticidade === "Crítico") return "border-transparent bg-destructive/10 text-destructive";
	if (criticidade === "Médio") return "border-transparent bg-attention/10 text-attention";
	return "border-transparent bg-muted text-muted-foreground";
}

export default function AlertsClient() {
	const [preset, setPreset] = useState<DatePreset | null>(null);
	const [customStart, setCustomStart] = useState("");
	const [customEnd, setCustomEnd] = useState("");
	const [categoria, setCategoria] = useState<string | undefined>(undefined);
	const [criticidade, setCriticidade] = useState<string | undefined>(undefined);
	const [parceiro, setParceiro] = useState<string | undefined>(undefined);
	const [limit, setLimit] = useState(50);

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

	const { result, isLoading } = useFetchAlerts({
		limit,
		startDate,
		endDate,
		categoria,
		criticidade,
		parceiro,
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

	const { counters, counts, porCategoria, evolucaoMensal, list } = result.data;

	const totalAlertas = counters.criticos + counters.medios + counters.resolvidos;
	const percentOf = (value: number) => (totalAlertas > 0 ? Math.round((value / totalAlertas) * 100) : 0);

	const bottleneckItems = [
		{
			key: "semPagamentoAntesColheita",
			label: "Pagamento não confirmado",
			description: "Operações aguardando pagamento validado",
			count: counts.semPagamentoAntesColheita,
			icon: Clock,
			iconClassName: "bg-attention/10 text-attention",
		},
		{
			key: "documentosPendentes",
			label: "Documentos pendentes",
			description: "NF, ticket de pesagem ou outros documentos",
			count: counts.documentosPendentes,
			icon: FileText,
			iconClassName: "bg-info/10 text-info",
		},
		{
			key: "entregaAtrasada",
			label: "Entrega atrasada",
			description: "Operações fora do prazo de entrega",
			count: counts.entregaAtrasada,
			icon: Truck,
			iconClassName: "bg-destructive/10 text-destructive",
		},
		{
			key: "semTermoAditivo",
			label: "Sem termo aditivo",
			description: "Operações com pagamento parcial sem aditivo",
			count: counts.semTermoAditivo,
			icon: FileSignature,
			iconClassName: "bg-info/10 text-info",
		},
		{
			key: "bloqueadas",
			label: "Bloqueadas por regras",
			description: "Operações bloqueadas por regras do sistema",
			count: counts.bloqueadas,
			icon: Lock,
			iconClassName: "bg-destructive/10 text-destructive",
		},
	];

	return (
		<div className="space-y-2">
			<div className="rounded-xl border border-border bg-white p-4">
				<div className="min-w-0">
					<h1 className="text-2xl font-bold text-foreground sm:text-3xl">Alertas Operacionais</h1>
					<p className="truncate text-xs text-muted-foreground">
						Acompanhe e resolva rapidamente os alertas que impactam as operações
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

			<div className="rounded-xl border border-border bg-white p-4">
				<div className="flex flex-wrap items-end gap-3">
					<div className="flex flex-col gap-1">
						<span className="text-xs text-muted-foreground">Categoria</span>
						<Select value={categoria ?? ALL} onValueChange={(v) => setCategoria(v === ALL ? undefined : v)}>
							<SelectTrigger size="sm" className="w-[9.5rem]">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value={ALL}>Todos</SelectItem>
								{filterOptions.categorias.map((c) => (
									<SelectItem key={c} value={c}>
										{c}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="flex flex-col gap-1">
						<span className="text-xs text-muted-foreground">Criticidade</span>
						<Select
							value={criticidade ?? ALL}
							onValueChange={(v) => setCriticidade(v === ALL ? undefined : v)}
						>
							<SelectTrigger size="sm" className="w-[9.5rem]">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value={ALL}>Todas</SelectItem>
								{filterOptions.criticidades.map((c) => (
									<SelectItem key={c} value={c}>
										{c}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="flex flex-col gap-1">
						<span className="text-xs text-muted-foreground">Parceiro</span>
						<Select value={parceiro ?? ALL} onValueChange={(v) => setParceiro(v === ALL ? undefined : v)}>
							<SelectTrigger size="sm" className="w-[9.5rem]">
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
				</div>
			</div>

			<div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
				<KpiCard
					title="Alertas Críticos"
					value={counters.criticos.toLocaleString("pt-BR")}
					subValue={`Requerem ação imediata · ${percentOf(counters.criticos)}% do total`}
					icon={AlertTriangle}
					iconClassName="bg-destructive/10 text-destructive"
					tone="neutral"
				/>
				<KpiCard
					title="Alertas Médios"
					value={counters.medios.toLocaleString("pt-BR")}
					subValue={`Requerem atenção · ${percentOf(counters.medios)}% do total`}
					icon={AlertTriangle}
					iconClassName="bg-attention/10 text-attention"
					tone="neutral"
				/>
				<KpiCard
					title="Alertas Resolvidos"
					value={counters.resolvidos.toLocaleString("pt-BR")}
					subValue={`No período selecionado · ${percentOf(counters.resolvidos)}% do total`}
					icon={AlertTriangle}
					iconClassName="bg-primary/10 text-primary"
					tone="neutral"
				/>
				<KpiCard
					title="Operações Bloqueadas"
					value={counters.bloqueadas.toLocaleString("pt-BR")}
					subValue="Por regras do sistema · aguardando regularização"
					icon={Lock}
					iconClassName="bg-destructive/10 text-destructive"
					tone="neutral"
				/>
				<KpiCard
					title="Índice de Saúde Operacional"
					value={counters.saudeOperacionalPercent != null ? `${counters.saudeOperacionalPercent}%` : "—"}
					subValue="Meta: ≥ 85%"
					icon={Activity}
					iconClassName="bg-info/10 text-info"
					tone="neutral"
				/>
			</div>

			<div className="grid grid-cols-1 gap-2 xl:grid-cols-3">
				<AlertsCategoryDonut data={porCategoria} />
				<BottlenecksPanel title="Gargalos Operacionais" items={bottleneckItems} />
				<AlertsEvolutionChart data={evolucaoMensal} />
			</div>

			<div className="rounded-xl border border-border bg-white p-4">
				<div className="mb-1 flex items-center justify-between">
					<h3 className="text-sm font-semibold text-foreground">Alertas Prioritários</h3>
					<Select
						value={String(limit)}
						onValueChange={(v) => setLimit(Number(v))}
					>
						<SelectTrigger size="sm" className="w-[9rem]">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{LIMIT_OPTIONS.map((size) => (
								<SelectItem key={size} value={String(size)}>
									{size} por página
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<p className="mb-4 text-xs text-muted-foreground">
					Mostrando {list.items.length} de {list.total} alerta(s)
				</p>

				{list.items.length === 0 ? (
					<p className="py-6 text-center text-sm text-muted-foreground">
						Nenhum alerta encontrado para os filtros selecionados.
					</p>
				) : (
					<div className="overflow-x-auto">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Criticidade</TableHead>
									<TableHead>Operação</TableHead>
									<TableHead>Parceiro</TableHead>
									<TableHead>Categoria</TableHead>
									<TableHead>Descrição do Alerta</TableHead>
									<TableHead>Data</TableHead>
									<TableHead>Dias em Aberto</TableHead>
									<TableHead>Ação Recomendada</TableHead>
									<TableHead>Status</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{list.items.map((item) => (
									<TableRow key={item.id}>
										<TableCell>
											<Badge className={criticidadeBadgeClassName(item.criticidade)}>
												{item.criticidade}
											</Badge>
										</TableCell>
										<TableCell>{item.orderNumber}</TableCell>
										<TableCell className="max-w-[9rem] truncate" title={item.parceiro}>
											{item.parceiro}
										</TableCell>
										<TableCell>{item.categoria}</TableCell>
										<TableCell className="max-w-[16rem] truncate" title={item.descricao}>
											{item.descricao}
										</TableCell>
										<TableCell>{new Date(item.dataHora).toLocaleDateString("pt-BR")}</TableCell>
										<TableCell>{item.diasEmAberto} dia(s)</TableCell>
										<TableCell className="max-w-[12rem] truncate" title={item.acao}>
											{item.acao}
										</TableCell>
										<TableCell>
											<Badge variant="outline">{item.status}</Badge>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				)}
			</div>

			<div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
				<div className="flex gap-3 rounded-xl border border-border bg-white p-4">
					<Info size={18} className="mt-0.5 shrink-0 text-info" />
					<div>
						<h4 className="text-sm font-semibold text-foreground">Como os Alertas Funcionam</h4>
						<p className="mt-1 text-xs text-muted-foreground">
							Os alertas são gerados automaticamente com base nas regras de negócio e no status das
							operações. Mantenha-os sempre atualizados para evitar riscos e atrasos.
						</p>
					</div>
				</div>
				<div className="flex gap-3 rounded-xl border border-border bg-white p-4">
					<Lightbulb size={18} className="mt-0.5 shrink-0 text-attention" />
					<div>
						<h4 className="text-sm font-semibold text-foreground">Dica</h4>
						<p className="mt-1 text-xs text-muted-foreground">
							Resolva os alertas críticos para melhorar o índice de saúde operacional.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}

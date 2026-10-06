"use client";

import { AlertsMonthlyTrend } from "@/types/types";
import {
	CartesianGrid,
	Legend,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

// Mesma tríade de status já usada no PipelineFunnelSteps (barra segmentada/legenda):
// vermelho = crítico, âmbar = atenção, verde = resolvido/normal.
const COLOR_CRITICOS = "#eb5757"; // --destructive
const COLOR_MEDIOS = "#e2b93b"; // --attention
const COLOR_RESOLVIDOS = "#3b9535"; // --primary

const SERIES_LABEL: Record<string, string> = {
	criticos: "Críticos",
	medios: "Médios",
	resolvidos: "Resolvidos",
};

type AlertsEvolutionChartProps = {
	data: AlertsMonthlyTrend[];
};

export default function AlertsEvolutionChart({ data }: AlertsEvolutionChartProps) {
	return (
		<div className="rounded-xl border border-border bg-white p-4">
			<h3 className="mb-1 text-sm font-semibold text-foreground">Evolução dos Alertas</h3>
			<p className="mb-4 text-xs text-muted-foreground">Últimos 6 meses</p>
			<ResponsiveContainer width="100%" height={220}>
				<LineChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
					<CartesianGrid vertical={false} stroke="#e1e0d9" />
					<XAxis
						dataKey="label"
						tickLine={false}
						axisLine={{ stroke: "#c3c2b7" }}
						tick={{ fill: "#898781", fontSize: 12 }}
					/>
					<YAxis
						tickLine={false}
						axisLine={false}
						tick={{ fill: "#898781", fontSize: 12 }}
						width={28}
						allowDecimals={false}
					/>
					<Tooltip contentStyle={{ borderRadius: 8, borderColor: "#e1e0d9", fontSize: 12 }} />
					<Legend
						iconType="circle"
						wrapperStyle={{ fontSize: 12, color: "#52514e" }}
						formatter={(value: string) => SERIES_LABEL[value] ?? value}
					/>
					<Line
						type="monotone"
						dataKey="criticos"
						name="criticos"
						stroke={COLOR_CRITICOS}
						strokeWidth={2}
						dot={{ r: 3 }}
					/>
					<Line
						type="monotone"
						dataKey="medios"
						name="medios"
						stroke={COLOR_MEDIOS}
						strokeWidth={2}
						dot={{ r: 3 }}
					/>
					<Line
						type="monotone"
						dataKey="resolvidos"
						name="resolvidos"
						stroke={COLOR_RESOLVIDOS}
						strokeWidth={2}
						dot={{ r: 3 }}
					/>
				</LineChart>
			</ResponsiveContainer>
		</div>
	);
}

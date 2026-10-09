"use client";

import { MonthlyForecastActual } from "@/types/types";
import {
	Area,
	AreaChart,
	Bar,
	BarChart,
	CartesianGrid,
	Legend,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

// Validado com dataviz/scripts/validate_palette.js (light, surface #ffffff) — all checks pass.
const COLOR_REALIZADO = "#3b9535"; // --primary
const COLOR_PREVISTO = "#2f80ed"; // --info

const DEFAULT_SERIES_LABEL: Record<string, string> = {
	previsto: "Previsto",
	realizado: "Realizado",
};

type ForecastBarChartProps = {
	title: string;
	data: MonthlyForecastActual[];
	valueFormatter?: (value: number) => string;
	variant?: "bar" | "area";
	subtitle?: string;
	/** Sobrescreve o texto da legenda/tooltip por série (ex: { realizado: "Recebido" }). */
	seriesLabels?: Partial<Record<"previsto" | "realizado", string>>;
};

export default function ForecastBarChart({
	title,
	data,
	valueFormatter,
	variant = "bar",
	subtitle,
	seriesLabels,
}: ForecastBarChartProps) {
	const seriesLabel: Record<string, string> = { ...DEFAULT_SERIES_LABEL, ...seriesLabels };
	const formatValue = valueFormatter ?? ((value: number) => value.toLocaleString("pt-BR"));

	return (
		<div className="rounded-xl border border-border bg-white p-4">
			<h3 className={`${subtitle ? "mb-1" : "mb-4"} text-sm font-semibold text-foreground`}>{title}</h3>
			{subtitle && <p className="mb-4 text-xs text-muted-foreground">{subtitle}</p>}
			<ResponsiveContainer width="100%" height={260}>
				{variant === "area" ? (
					<AreaChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
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
							tickFormatter={formatValue}
							width={64}
						/>
						<Tooltip
							formatter={(value, name) => [formatValue(Number(value)), seriesLabel[String(name)] ?? name]}
							contentStyle={{ borderRadius: 8, borderColor: "#e1e0d9", fontSize: 12 }}
						/>
						<Legend
							iconType="circle"
							wrapperStyle={{ fontSize: 12, color: "#52514e" }}
							formatter={(value: string) => seriesLabel[value] ?? value}
						/>
						<Area
							type="monotone"
							dataKey="previsto"
							name="previsto"
							stroke={COLOR_PREVISTO}
							fill={COLOR_PREVISTO}
							fillOpacity={0.12}
							strokeWidth={2}
							dot={{ r: 3 }}
						/>
						<Area
							type="monotone"
							dataKey="realizado"
							name="realizado"
							stroke={COLOR_REALIZADO}
							fill={COLOR_REALIZADO}
							fillOpacity={0.16}
							strokeWidth={2}
							dot={{ r: 3 }}
						/>
					</AreaChart>
				) : (
					<BarChart data={data} barGap={2} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
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
							tickFormatter={formatValue}
							width={64}
						/>
						<Tooltip
							formatter={(value, name) => [formatValue(Number(value)), seriesLabel[String(name)] ?? name]}
							contentStyle={{ borderRadius: 8, borderColor: "#e1e0d9", fontSize: 12 }}
						/>
						<Legend
							iconType="circle"
							wrapperStyle={{ fontSize: 12, color: "#52514e" }}
							formatter={(value: string) => seriesLabel[value] ?? value}
						/>
						<Bar dataKey="previsto" name="previsto" fill={COLOR_PREVISTO} radius={[4, 4, 0, 0]} maxBarSize={24} />
						<Bar dataKey="realizado" name="realizado" fill={COLOR_REALIZADO} radius={[4, 4, 0, 0]} maxBarSize={24} />
					</BarChart>
				)}
			</ResponsiveContainer>
		</div>
	);
}

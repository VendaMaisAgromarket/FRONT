"use client";

import { FinancialResourceSlice, FinancialResourceSliceKey } from "@/types/types";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

// Cores semânticas (mesmos tokens já usados nos outros gráficos do dashboard): os 4 baldes
// são fixos e sempre vêm nessa ordem do back, então mapeamos por key, não por índice.
const SLICE_COLORS: Record<FinancialResourceSliceKey, string> = {
	liberado: "#3b9535", // --primary
	vinculado: "#2f80ed", // --info
	pendente: "#e2b93b", // --attention
	inadimplente: "#eb5757", // --destructive
};

type FinancialResourcesDonutProps = {
	slices: FinancialResourceSlice[];
	totalGerenciado: number;
	valueFormatter: (value: number) => string;
};

export default function FinancialResourcesDonut({
	slices,
	totalGerenciado,
	valueFormatter,
}: FinancialResourcesDonutProps) {
	const visible = slices.filter((slice) => slice.valor > 0);

	return (
		<div className="flex flex-col rounded-xl border border-border bg-white p-4">
			<h3 className="mb-4 text-sm font-semibold text-foreground">Situação dos Recursos</h3>
			{visible.length === 0 ? (
				<p className="flex-1 py-10 text-center text-sm text-muted-foreground">Sem recursos no período.</p>
			) : (
				<div className="flex flex-1 flex-col items-center gap-4 sm:flex-row sm:items-center">
					<div className="h-[160px] w-[160px] shrink-0">
						<ResponsiveContainer width="100%" height="100%">
							<PieChart>
								<Pie
									data={visible}
									dataKey="valor"
									nameKey="label"
									innerRadius="60%"
									outerRadius="90%"
									paddingAngle={2}
									strokeWidth={2}
									stroke="#ffffff"
								>
									{visible.map((slice) => (
										<Cell key={slice.key} fill={SLICE_COLORS[slice.key]} />
									))}
								</Pie>
								<Tooltip formatter={(value) => valueFormatter(Number(value))} />
							</PieChart>
						</ResponsiveContainer>
					</div>

					<ul className="w-full min-w-0 flex-1 space-y-2">
						{slices.map((slice) => (
							<li key={slice.key} className="min-w-0 text-sm">
								<span className="flex min-w-0 items-center gap-2 font-medium text-foreground">
									<span
										className="inline-block size-2.5 shrink-0 rounded-full"
										style={{ backgroundColor: SLICE_COLORS[slice.key] }}
									/>
									<span className="min-w-0 truncate">{slice.label}</span>
								</span>
								<span className="ml-[1.125rem] block text-xs text-muted-foreground">
									{valueFormatter(slice.valor)} ({slice.percentual.toFixed(0)}%)
								</span>
							</li>
						))}
					</ul>
				</div>
			)}
			<div className="mt-4 rounded-md bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
				Total gerenciado: {valueFormatter(totalGerenciado)}
			</div>
		</div>
	);
}

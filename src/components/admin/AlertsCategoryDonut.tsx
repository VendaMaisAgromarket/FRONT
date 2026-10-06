"use client";

import { AlertsCategoryBreakdown } from "@/types/types";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

// Mesma paleta categórica validada usada no ProductRevenueDonut (dataviz/validate_palette.js,
// light, surface #ffffff, adjacent pairs). Categorias são fixas (enum do back), então mapeamos
// por nome em vez de por índice — "Outros" já é uma categoria real aqui, não um bucket agregado.
const CATEGORY_COLORS: Record<string, string> = {
	Financeiro: "#2a78d6",
	Documentação: "#eb6834",
	Logística: "#1baf7a",
	Contratual: "#eda100",
	Outros: "#9a9a95",
};
const FALLBACK_COLOR = "#9a9a95";

type AlertsCategoryDonutProps = {
	data: AlertsCategoryBreakdown[];
};

export default function AlertsCategoryDonut({ data }: AlertsCategoryDonutProps) {
	const slices = data.filter((item) => item.count > 0);

	return (
		<div className="rounded-xl border border-border bg-white p-4">
			<h3 className="mb-4 text-sm font-semibold text-foreground">Alertas por Categoria</h3>
			{slices.length === 0 ? (
				<p className="py-10 text-center text-sm text-muted-foreground">Sem alertas no período.</p>
			) : (
				<div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
					<div className="h-[160px] w-[160px] shrink-0">
						<ResponsiveContainer width="100%" height="100%">
							<PieChart>
								<Pie
									data={slices}
									dataKey="count"
									nameKey="categoria"
									innerRadius="60%"
									outerRadius="90%"
									paddingAngle={2}
									strokeWidth={2}
									stroke="#ffffff"
								>
									{slices.map((slice) => (
										<Cell
											key={slice.categoria}
											fill={CATEGORY_COLORS[slice.categoria] ?? FALLBACK_COLOR}
										/>
									))}
								</Pie>
								<Tooltip formatter={(value) => `${value} alerta(s)`} />
							</PieChart>
						</ResponsiveContainer>
					</div>

					<ul className="w-full min-w-0 flex-1 space-y-2">
						{slices.map((slice) => (
							<li
								key={slice.categoria}
								className="flex min-w-0 items-center justify-between gap-2 text-sm"
							>
								<span className="flex min-w-0 items-center gap-2 text-foreground">
									<span
										className="inline-block size-2.5 shrink-0 rounded-full"
										style={{ backgroundColor: CATEGORY_COLORS[slice.categoria] ?? FALLBACK_COLOR }}
									/>
									<span className="min-w-0 truncate">{slice.categoria}</span>
								</span>
								<span className="shrink-0 font-medium text-muted-foreground">
									{slice.count} · {slice.percentual.toFixed(0)}%
								</span>
							</li>
						))}
					</ul>
				</div>
			)}
		</div>
	);
}

"use client";

import { FinancialPaymentSummary } from "@/types/types";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const COLOR_RECEBIDO = "#3b9535"; // --primary
const COLOR_A_RECEBER = "#e2b93b"; // --attention

type PaymentSummaryDonutProps = {
	data: FinancialPaymentSummary;
	valueFormatter: (value: number) => string;
};

export default function PaymentSummaryDonut({ data, valueFormatter }: PaymentSummaryDonutProps) {
	const slices = [
		{ key: "recebido", label: "Recebido", valor: data.recebido, color: COLOR_RECEBIDO },
		{ key: "aReceber", label: "A Receber", valor: data.aReceber, color: COLOR_A_RECEBER },
	].filter((slice) => slice.valor > 0);

	const fases = [
		{ key: "entrada", label: "Entrada (30%)", valor: data.porFase.entrada },
		{ key: "saldo", label: "Saldo (70%)", valor: data.porFase.saldo },
		{ key: "integral", label: "Integral", valor: data.porFase.integral },
	];

	return (
		<div className="rounded-xl border border-border bg-white p-4">
			<h3 className="mb-1 text-sm font-semibold text-foreground">Resumo de Pagamentos</h3>
			<p className="mb-4 text-xs text-muted-foreground">
				Valor total: {valueFormatter(data.valorTotal)}
			</p>
			{slices.length === 0 ? (
				<p className="py-10 text-center text-sm text-muted-foreground">Sem pagamentos no período.</p>
			) : (
				<div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
					<div className="relative h-[160px] w-[160px] shrink-0">
						<ResponsiveContainer width="100%" height="100%">
							<PieChart>
								<Pie
									data={slices}
									dataKey="valor"
									nameKey="label"
									innerRadius="60%"
									outerRadius="90%"
									paddingAngle={2}
									strokeWidth={2}
									stroke="#ffffff"
								>
									{slices.map((slice) => (
										<Cell key={slice.key} fill={slice.color} />
									))}
								</Pie>
								<Tooltip formatter={(value) => valueFormatter(Number(value))} />
							</PieChart>
						</ResponsiveContainer>
						<div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
							<span className="text-lg font-semibold text-foreground">
								{data.percentualRecebido.toFixed(0)}%
							</span>
							<span className="text-[10px] text-muted-foreground">recebido</span>
						</div>
					</div>

					<div className="w-full min-w-0 flex-1 space-y-3">
						<ul className="space-y-2">
							<li className="flex min-w-0 items-center justify-between gap-2 text-sm">
								<span className="flex items-center gap-2 text-foreground">
									<span
										className="inline-block size-2.5 shrink-0 rounded-full"
										style={{ backgroundColor: COLOR_RECEBIDO }}
									/>
									Recebido
								</span>
								<span className="shrink-0 font-medium text-muted-foreground">
									{valueFormatter(data.recebido)}
								</span>
							</li>
							<li className="flex min-w-0 items-center justify-between gap-2 text-sm">
								<span className="flex items-center gap-2 text-foreground">
									<span
										className="inline-block size-2.5 shrink-0 rounded-full"
										style={{ backgroundColor: COLOR_A_RECEBER }}
									/>
									A Receber
								</span>
								<span className="shrink-0 font-medium text-muted-foreground">
									{valueFormatter(data.aReceber)}
								</span>
							</li>
						</ul>

						<div className="border-t border-border pt-2">
							<span className="text-xs text-muted-foreground">Recebido por fase</span>
							<ul className="mt-1 space-y-1">
								{fases.map((fase) => (
									<li key={fase.key} className="flex items-center justify-between gap-2 text-xs">
										<span className="text-foreground">{fase.label}</span>
										<span className="text-muted-foreground">{valueFormatter(fase.valor)}</span>
									</li>
								))}
							</ul>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

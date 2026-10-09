import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { FinancialPartnerPerformance } from "@/types/types";

// Barra de magnitude — mesmo verde primário do PartyRankingTable.
const BAR_COLOR = "#3b9535";

type PartnerPerformanceTableProps = {
	rows: FinancialPartnerPerformance[];
	valueFormatter: (value: number) => string;
};

export default function PartnerPerformanceTable({ rows, valueFormatter }: PartnerPerformanceTableProps) {
	return (
		<div className="rounded-xl border border-border bg-white p-4">
			<h3 className="mb-4 text-sm font-semibold text-foreground">Performance Financeira por Parceiro</h3>
			{rows.length === 0 ? (
				<p className="py-6 text-center text-sm text-muted-foreground">Sem dados no período.</p>
			) : (
				<div className="overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Parceiro</TableHead>
								<TableHead className="text-right">Operações</TableHead>
								<TableHead className="text-right">Faturamento</TableHead>
								<TableHead className="text-right">Recebido</TableHead>
								<TableHead>% Recebido</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{rows.map((row) => (
								<TableRow key={row.id ?? `outros-${row.nome}`}>
									<TableCell className="max-w-[10rem] truncate" title={row.nome}>
										{row.nome}
									</TableCell>
									<TableCell className="text-right">{row.operacoes.toLocaleString("pt-BR")}</TableCell>
									<TableCell className="text-right">{valueFormatter(row.faturamento)}</TableCell>
									<TableCell className="text-right">{valueFormatter(row.recebido)}</TableCell>
									<TableCell>
										<div className="flex min-w-[7rem] items-center gap-2">
											<div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
												<div
													className="h-full rounded-full"
													style={{
														width: `${Math.min(100, row.percentualRecebido)}%`,
														backgroundColor: BAR_COLOR,
													}}
												/>
											</div>
											<span className="w-10 shrink-0 text-right text-xs text-muted-foreground">
												{row.percentualRecebido.toFixed(0)}%
											</span>
										</div>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			)}
		</div>
	);
}

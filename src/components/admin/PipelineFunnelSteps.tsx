import { PipelineFunnelBucket } from "@/types/types";
import {
	ArrowRight,
	CheckCircle2,
	CreditCard,
	FileText,
	Flag,
	Landmark,
	LucideIcon,
	Package,
	PackageCheck,
	Truck,
} from "lucide-react";
import { ReactNode } from "react";

const STEP_ICONS: Record<string, LucideIcon> = {
	contrato_criado: FileText,
	pagamento_validado: CreditCard,
	liberado_embarque: PackageCheck,
	em_transporte: Truck,
	entregue: Package,
	aceite: CheckCircle2,
	pagamento_liberado: Landmark,
	finalizada: Flag,
};

export type PipelineFunnelSegments = {
	normal: number;
	atencao: number;
	critico: number;
};

type PipelineFunnelStepsProps = {
	data: PipelineFunnelBucket[];
	title?: string;
	subtitle?: string;
	showPercent?: boolean;
	segments?: PipelineFunnelSegments;
	rightSlot?: ReactNode;
};

export default function PipelineFunnelSteps({
	data,
	title = "Funil de Operações",
	subtitle = "Quantidade de operações por etapa",
	showPercent = false,
	segments,
	rightSlot,
}: PipelineFunnelStepsProps) {
	const total = data[0]?.count ?? 0;

	return (
		<div className="rounded-xl border border-border bg-white p-4">
			<div className="flex items-center justify-between gap-2">
				<div>
					<h3 className="text-sm font-semibold text-foreground">{title}</h3>
					<p className="text-xs text-muted-foreground">{subtitle}</p>
				</div>
				{rightSlot}
			</div>

			{data.length === 0 ? (
				<p className="py-6 text-center text-sm text-muted-foreground">Sem dados no período.</p>
			) : (
				<div className="mt-4 overflow-x-auto pb-1">
					<div className="flex min-w-max items-start">
						{data.map((step, index) => {
							const Icon = STEP_ICONS[step.key] ?? FileText;
							const percent = total > 0 ? Math.round((step.count / total) * 100) : 0;
							return (
								<div key={step.key} className="flex items-start">
									<div className="flex w-24 flex-col items-center text-center">
										<span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
											<Icon size={18} />
										</span>
										<span className="mt-2 text-xs text-muted-foreground">
											{index + 1}. {step.label}
										</span>
										<span className="mt-1 text-lg font-semibold text-foreground">
											{step.count.toLocaleString("pt-BR")}
										</span>
										{showPercent && (
											<span className="text-xs text-muted-foreground">{percent}%</span>
										)}
									</div>
									{index < data.length - 1 && (
										<ArrowRight size={16} className="mt-4 shrink-0 text-muted-foreground/40" />
									)}
								</div>
							);
						})}
					</div>
				</div>
			)}

			{segments && (
				<div className="mt-4">
					<div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
						<div className="h-full bg-primary" style={{ width: `${segments.normal}%` }} />
						<div className="h-full bg-attention" style={{ width: `${segments.atencao}%` }} />
						<div className="h-full bg-destructive" style={{ width: `${segments.critico}%` }} />
					</div>
					<div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
						<span className="flex items-center gap-1.5">
							<span className="size-2 shrink-0 rounded-full bg-primary" />
							Fluxo normal
						</span>
						<span className="flex items-center gap-1.5">
							<span className="size-2 shrink-0 rounded-full bg-attention" />
							Atenção
						</span>
						<span className="flex items-center gap-1.5">
							<span className="size-2 shrink-0 rounded-full bg-destructive" />
							Crítico / Bloqueio
						</span>
					</div>
				</div>
			)}
		</div>
	);
}

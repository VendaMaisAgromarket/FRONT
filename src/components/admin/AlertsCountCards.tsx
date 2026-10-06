import { AlertsCounts } from "@/types/types";
import { AlertTriangle, FileSignature, FileText, Lock, LucideIcon, Truck } from "lucide-react";

const ALERT_LABELS: {
	key: keyof AlertsCounts;
	label: string;
	icon: LucideIcon;
	iconClassName: string;
}[] = [
	{
		key: "semPagamentoAntesColheita",
		label: "Sem pagamento",
		icon: AlertTriangle,
		iconClassName: "bg-destructive/10 text-destructive",
	},
	{
		key: "documentosPendentes",
		label: "Documentos pendentes",
		icon: FileText,
		iconClassName: "bg-attention/10 text-attention",
	},
	{
		key: "entregaAtrasada",
		label: "Entrega atrasada",
		icon: Truck,
		iconClassName: "bg-attention/10 text-attention",
	},
	{
		key: "bloqueadas",
		label: "Bloqueadas",
		icon: Lock,
		iconClassName: "bg-destructive/10 text-destructive",
	},
	{
		key: "semTermoAditivo",
		label: "Sem termo aditivo",
		icon: FileSignature,
		iconClassName: "bg-info/10 text-info",
	},
];

type AlertsCountCardsProps = {
	counts: AlertsCounts;
};

export default function AlertsCountCards({ counts }: AlertsCountCardsProps) {
	return (
		<div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
			{ALERT_LABELS.map(({ key, label, icon: Icon, iconClassName }) => (
				<div key={key} className="rounded-xl border border-border bg-white p-4">
					<div className="flex items-center gap-2.5">
						<span className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${iconClassName}`}>
							<Icon size={18} />
						</span>
						<span className="text-sm text-muted-foreground">{label}</span>
					</div>
					<div className="mt-2 text-2xl font-semibold text-foreground">
						{counts[key].toLocaleString("pt-BR")}
					</div>
				</div>
			))}
		</div>
	);
}

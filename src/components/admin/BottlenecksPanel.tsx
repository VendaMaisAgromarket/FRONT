import { LucideIcon } from "lucide-react";

export type BottleneckItem = {
	key: string;
	label: string;
	description: string;
	count: number;
	icon: LucideIcon;
	iconClassName: string;
};

type BottlenecksPanelProps = {
	title?: string;
	items: BottleneckItem[];
};

export default function BottlenecksPanel({ title = "Gargalos da Operação", items }: BottlenecksPanelProps) {
	return (
		<div className="rounded-xl border border-border bg-white p-4">
			<h3 className="mb-1 text-sm font-semibold text-foreground">{title}</h3>
			<ul className="divide-y divide-border">
				{items.map((item) => {
					const Icon = item.icon;
					return (
						<li key={item.key} className="flex min-w-0 items-center gap-3 py-3">
							<span
								className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${item.iconClassName}`}
							>
								<Icon size={16} />
							</span>
							<div className="min-w-0 flex-1">
								<div className="text-sm font-medium text-foreground">{item.label}</div>
								<div className="truncate text-xs text-muted-foreground" title={item.description}>
									{item.description}
								</div>
							</div>
							<span className="shrink-0 text-lg font-semibold text-foreground">
								{item.count.toLocaleString("pt-BR")}
							</span>
						</li>
					);
				})}
			</ul>
		</div>
	);
}

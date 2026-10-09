"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
	AlertTriangle,
	LayoutDashboard,
	Truck,
	Wallet,
	Workflow,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
	{
		title: "Visão Executiva",
		href: "/admin/executive-overview",
		icon: LayoutDashboard,
		enabled: true,
	},
	{
		title: "Pipeline das Operações",
		href: "/admin/pipeline",
		icon: Workflow,
		enabled: true,
	},
	{
		title: "Controle Financeiro",
		href: "/admin/financial",
		icon: Wallet,
		enabled: true,
	},
	{
		title: "Alertas Operacionais",
		href: "/admin/alerts",
		icon: AlertTriangle,
		enabled: true,
	},
	{
		title: "Logística e Desempenho",
		href: "/admin/logistics",
		icon: Truck,
		enabled: true,
	},
];

export default function AdminSidebar({
	onNavigate,
}: {
	onNavigate?: () => void;
}) {
	const pathname = usePathname();

	return (
		<nav className="flex flex-col gap-1 p-3">
			{navItems.map((item) => {
				const Icon = item.icon;
				const isActive = pathname === item.href;

				if (!item.enabled) {
					return (
						<div
							key={item.href}
							className="flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground/60 cursor-not-allowed select-none"
						>
							<span className="flex items-center gap-2">
								<Icon size={18} />
								{item.title}
							</span>
							<Badge variant="outline" className="text-[10px]">
								Em breve
							</Badge>
						</div>
					);
				}

				return (
					<Link
						key={item.href}
						href={item.href}
						onClick={onNavigate}
						className={cn(
							"flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
							isActive
								? "bg-primary text-primary-foreground"
								: "text-foreground/80 hover:bg-muted"
						)}
					>
						<Icon size={18} />
						{item.title}
					</Link>
				);
			})}
		</nav>
	);
}

"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
	AlertTriangle,
	ChevronDown,
	CreditCard,
	LayoutDashboard,
	Route,
	Ruler,
	Settings,
	Truck,
	Users,
	Wallet,
	Workflow,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

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

const settingsItems = [
	{ title: "Usuários", href: "/admin/settings/users", icon: Users },
	{ title: "Métodos de pagamento", href: "/admin/settings/payment-methods", icon: CreditCard },
	{ title: "Unidades do produto", href: "/admin/settings/selling-units", icon: Ruler },
	{ title: "Tipos de transporte", href: "/admin/settings/transport-types", icon: Route },
];

export default function AdminSidebar({
	onNavigate,
}: {
	onNavigate?: () => void;
}) {
	const pathname = usePathname();
	const isSettingsRoute = pathname.startsWith("/admin/settings");
	const [isSettingsOpen, setIsSettingsOpen] = useState(isSettingsRoute);

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

			<div className="mt-1 border-t border-t-gray-5 pt-2">
				<button
					type="button"
					onClick={() => setIsSettingsOpen((open) => !open)}
					aria-expanded={isSettingsOpen}
					className={cn(
						"flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-sm transition-colors cursor-pointer",
						isSettingsRoute ? "text-primary font-medium" : "text-foreground/80",
						"hover:bg-muted"
					)}
				>
					<span className="flex items-center gap-2">
						<Settings size={18} />
						Configurações
					</span>
					<ChevronDown
						size={16}
						className={cn("transition-transform", isSettingsOpen && "rotate-180")}
					/>
				</button>

				{isSettingsOpen && (
					<div className="mt-1 flex flex-col gap-1 pl-4">
						{settingsItems.map((item) => {
							const Icon = item.icon;
							const isActive = pathname === item.href;
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
									<Icon size={16} />
									{item.title}
								</Link>
							);
						})}
					</div>
				)}
			</div>
		</nav>
	);
}

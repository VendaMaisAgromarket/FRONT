"use client";

import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";

type AdminModeSwitchProps = {
	className?: string;
};

export default function AdminModeSwitch({ className }: AdminModeSwitchProps) {
	const pathname = usePathname();
	const router = useRouter();
	const isAdminMode = pathname.startsWith("/admin");

	return (
		<div className={cn("flex items-center gap-2", className)}>
			<span className="text-xs font-medium text-foreground/70">
				{isAdminMode ? "Admin" : "Usuário"}
			</span>
			<Switch
				checked={isAdminMode}
				onCheckedChange={(checked) =>
					router.push(checked ? "/admin/executive-overview" : "/market")
				}
				aria-label={
					isAdminMode ? "Sair do modo administrador" : "Entrar no modo administrador"
				}
			/>
		</div>
	);
}

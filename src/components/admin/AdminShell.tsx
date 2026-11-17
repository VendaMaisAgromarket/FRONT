"use client";

import AdminModeSwitch from "@/components/admin/AdminModeSwitch";
import AdminSidebar from "@/components/admin/AdminSidebar";
import SessionExpiryGuard from "@/components/SessionExpiryGuard";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import TanstackProvider from "@/providers/tanstackProvider";
import { ArrowLeft, LogOut, Menu } from "lucide-react";
import Link from "next/link";
import { ReactNode, useState } from "react";

type AdminShellProps = {
	user: { name: string; img?: string | null };
	children: ReactNode;
};

export default function AdminShell({ user, children }: AdminShellProps) {
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

	async function handleLogout() {
		const res = await fetch("/api/user", { method: "DELETE" });
		if (res.ok) {
			window.location.href = "/login";
		}
	}

	return (
		<TanstackProvider>
			<SessionExpiryGuard />
			<div className="min-h-screen bg-muted/30">
				<header className="border-b border-b-gray-5 bg-white">
					<div className="flex items-center justify-between gap-4 px-4 py-3">
						<div className="flex items-center gap-2">
							<Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
								<SheetTrigger asChild>
									<button
										type="button"
										className="text-primary cursor-pointer block md:hidden"
										aria-label="Abrir menu"
									>
										<Menu size={24} />
									</button>
								</SheetTrigger>
								<SheetContent side="left" className="w-2/3 border-0 p-0">
									<SheetTitle className="hidden">
										Menu do dashboard executivo
									</SheetTitle>
									<AdminSidebar onNavigate={() => setIsMobileMenuOpen(false)} />
								</SheetContent>
							</Sheet>
							<Link
								href="/market"
								className="hidden md:flex items-center gap-1 text-sm text-foreground/70 hover:text-foreground"
							>
								<ArrowLeft size={16} />
								Voltar ao marketplace
							</Link>
							<h1 className="text-base font-semibold md:hidden">
								Dashboard Executivo
							</h1>
						</div>
						<div className="flex items-center gap-3">
							<AdminModeSwitch />
							<span className="hidden sm:inline text-sm text-foreground/80">
								{user.name}
							</span>
							<Button
								variant="outline"
								size="sm"
								onClick={handleLogout}
								className="gap-1"
							>
								<LogOut size={16} />
								<span className="hidden sm:inline">Sair</span>
							</Button>
						</div>
					</div>
				</header>

				<div className="mx-auto flex max-w-max-screen w-full">
					<aside className="hidden md:block w-64 shrink-0 border-r border-r-gray-5 bg-white min-h-[calc(100vh-57px)]">
						<div className="px-4 py-4">
							<h1 className="text-lg font-semibold">Dashboard Executivo</h1>
						</div>
						<AdminSidebar />
					</aside>
					<main className="flex-1 p-4 md:p-6 min-w-0">{children}</main>
				</div>
			</div>
		</TanstackProvider>
	);
}

"use client";
import AdminModeSwitch from "@/components/admin/AdminModeSwitch";
import { Button } from "@/components/ui/button";
import { SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useUserStore } from "@/store/userInfoStore";
import { sectionsForRole } from "@/utils/data";
import { ChevronRight, Home } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface SidemenuProps {
	handleLogout: () => void;
}

export default function Sidemenu({ handleLogout }: SidemenuProps) {
	const { user } = useUserStore();
	return (
		<SheetContent side="left" className="border-0 w-2/3">
			<SheetHeader className="bg-primary">
				<SheetTitle className="hidden">Menu do usuário</SheetTitle>
				{!user ? (
					<>
						<div className="text-white space-y-2 mb-2">
							<h1 className="font-semibold text-lg">Entre na sua conta</h1>
							<p className="text-sm">
								Tire proveito de todas as funcionalidades da Venda+.
							</p>
						</div>
						<Link href="/login">
							<Button className="w-full bg-neutral-900 hover:bg-neutral-800">
								Entrar
							</Button>
						</Link>
					</>
				) : (
					<>
						<div className="relative flex items-center gap-2 p-2">
							<div className="relative h-16 w-16 rounded-full">
								{user.img ? (
									<Image
										src={user.img}
										alt={`Foto de ${user.name}`}
										fill
										className="object-cover rounded-full"
									/>
								) : (
									<span className="font-semibold text-sm text-foreground/70">
										{user.name?.trim?.().charAt(0)?.toUpperCase?.()}
									</span>
								)}
							</div>
							<div className="flex flex-col text-white">
								<h3 className="text-md font-semibold">{user.email}</h3>
								<Link href="/market/profile" className="flex items-center text-sm">
									Meu Perfil <ChevronRight size={16} />
								</Link>
							</div>
						</div>
					</>
				)}
			</SheetHeader>
			<div className="overflow-scroll">
				<div className="px-4 py-4 border-b border-b-gray-5/70">
					<Link
						href="/market"
						className="flex gap-2 items-center text-gray-2 hover:text-neutral-900 transition-colors duration-150"
					>
						<Home size={20} />
						<h6>Início</h6>
					</Link>
					{user?.role === "admin" && (
						<div className="mt-3">
							<AdminModeSwitch />
						</div>
					)}
				</div>
				{sectionsForRole(user?.role).map((g, _) => {
					return (
						<div
							key={_}
							className={`${_ === 0 ? "px-4 pt-2 pb-4" : "p-4 border-t border-t-gray-5/70"
								}`}
						>
							<h4 className="text-gray-3 text-sm mb-4">{g.group}</h4>
							<ul className="space-y-3">
								{g.sections.map((s, _) => {
									return (
										<li key={_} className="hover:border-0">
											{s.type === "logout" ? (
												<button
													onClick={handleLogout}
													className="flex gap-2 py-1 items-center text-red-500 cursor-pointer"
												>
													{s.icon}
													<h6>{s.title}</h6>
												</button>
											) : (
												<Link
													href={s.href}
													className="flex gap-2 py-1 items-center text-gray-2 hover:text-neutral-900 transition-colors duration-150"
												>
													{s.icon}
													<h6>{s.title}</h6>
												</Link>
											)}
										</li>
									);
								})}
							</ul>
						</div>
					);
				})}
			</div>
		</SheetContent>
	);
}

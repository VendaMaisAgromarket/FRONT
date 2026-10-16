"use client";

import logo from "@/assets/logo.png";
import AdminModeSwitch from "@/components/admin/AdminModeSwitch";
import NotificationBell from "@/components/notifications/NotificationBell";
import Sidemenu from "@/components/sidemenu";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Sheet, SheetTrigger } from "@/components/ui/sheet";
import { useShoppingCartStore } from "@/store/shoppingCartStore";
import { useUserStore } from "@/store/userInfoStore";
import { recentSearchesData, sectionsListData } from "@/utils/data";
import { DropdownMenuItem } from "@radix-ui/react-dropdown-menu";
import {
	ChevronDown,
	ChevronRight,
	Clock,
	LoaderCircle,
	Menu,
	Search,
	ShoppingCart,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type NavbarProps = {
	searchedItem?: string;
};

export default function Navbar({ searchedItem = "" }: NavbarProps) {
	const [isRecentSearchesMenuOpen, setIsRecentSearchersMenuOpen] =
		useState(false);
	const [recentSearches, setRecentSearches] = useState(recentSearchesData);
	const [search, setSearch] = useState(searchedItem);
	const router = useRouter();
	const { user } = useUserStore();
	const { amount } = useShoppingCartStore();

	function changeLetterSearchedColor(text: string) {
		const searchSet = new Set(search.toLowerCase());
		return text.split("").map((l, index) => {
			if (searchSet.has(l.toLowerCase())) {
				return (
					<span key={index} className="text-gray-4">
						{l}
					</span>
				);
			}
			return l;
		});
	}

	function onSearchInputChange(search: string) {
		setSearch(search);
		const newRecentSearches = recentSearchesData.filter((s) => {
			if (s.searched.toLowerCase().includes(search.toLowerCase())) {
				return s;
			}
		});

		setRecentSearches(newRecentSearches);
	}
	async function handleLogout() {
		const res = await fetch("/api/user", {
			method: "DELETE",
		});

		if (res.ok) {
			window.location.reload();
		}
	}
	function handleProductSearch(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		const slug = search
			.replace(/\s+/g, " ")
			.trim()
			.replaceAll(" ", "-")
			.toLowerCase();
		router.push(`/market/${slug}`);
	}
	function handleSearchedItemClick(slug: string, searchedItem: string) {
		setSearch(searchedItem);
		router.push(`/market/${slug}`);
	}

	return (
		<nav className="border-b border-b-gray-5 py-3 bg-white">
			<div className="flex items-center justify-between gap-4 max-w-max-screen w-11/12 m-auto">
				<Link href="/market">
					<Image
						src={logo}
						alt="Venda+ Agromarket logo"
						className="hidden md:block w-32"
					/>
				</Link>
				<Sheet>
					<SheetTrigger asChild>
						<button
							type="button"
							className="text-primary bg-transparent cursor-pointer block md:hidden"
						>
							<Menu size={26} />
						</button>
					</SheetTrigger>
					<Sidemenu handleLogout={handleLogout} />
				</Sheet>

				<form
					className="flex items-center w-full md:w-1/2 relative"
					onSubmit={handleProductSearch}
				>
					<Input
						type="text"
						placeholder="Buscar na Venda+"
						className="pr-12"
						onFocus={() => setIsRecentSearchersMenuOpen(true)}
						onBlur={() => {
							setTimeout(() => {
								setIsRecentSearchersMenuOpen(false);
							}, 100);
						}}
						onChange={(e) => onSearchInputChange(e.target.value)}
						value={search}
					/>
					<Button
						type="submit"
						className="absolute right-[2px] h-8"
						disabled={search.length === 0}
					>
						<Search />
					</Button>
					<ul
						className={
							isRecentSearchesMenuOpen
								? "absolute top-10 bg-white border w-full py-2 space-y-1 z-50"
								: "hidden"
						}
					>
						{recentSearches.length ? (
							recentSearches.map((s) => {
								const slug = s.searched.replaceAll(" ", "-");
								return (
									<li key={s.id} className="space-y-2 px-2">
										<button
											onClick={() => handleSearchedItemClick(slug, s.searched)}
											className="flex items-center gap-2 cursor-pointer p-1 transition-colors duration-200 hover:bg-primary text-gray-1 hover:text-white w-full"
										>
											<Clock size={18} className="text-gray-4" />
											<p className="">
												{changeLetterSearchedColor(s.searched)}
											</p>
										</button>
									</li>
								);
							})
						) : (
							<LoaderCircle
								size={32}
								className="animate-spin m-auto text-primary"
							/>
						)}
					</ul>
				</form>
				<div className="flex gap-4 items-center shrink-0">
					<div className="hidden md:flex gap-4 items-center">
						{user?.role === "admin" && <AdminModeSwitch />}
						<div className="relative flex items-center gap-2">
							{user && (
								<DropdownMenu>
									<DropdownMenuTrigger className="flex items-center gap-2 cursor-pointer">
										<div className="relative h-9 w-9 rounded-full overflow-hidden border border-border bg-muted flex items-center justify-center">
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
										<p className="text-sm">{user.name}</p>
										<ChevronDown size={16} />
									</DropdownMenuTrigger>
									<DropdownMenuContent className="w-72 p-0">
										<div className="w-full flex items-center gap-2 p-4 bg-primary">
											<div className="relative size-14 rounded-full overflow-hidden bg-white/20 flex items-center justify-center">
												{user.img ? (
													<Image
														src={user.img}
														alt={`Foto de ${user.name}`}
														fill
														className="object-cover rounded-full"
													/>
												) : (
													<span className="font-semibold text-lg text-white">
														{user.name?.trim?.().charAt(0)?.toUpperCase?.()}
													</span>
												)}
											</div>
											<div className="flex flex-col text-white">
												<h3 className="text-md font-medium">{user.email}</h3>
												<Link
													href="/market/profile"
													className="flex items-center text-sm"
												>
													Meu Perfil <ChevronRight size={16} />
												</Link>
											</div>
										</div>
										<div>
											{sectionsListData.map((g, _) => {
												return (
													<div
														key={_}
														className={`${
															_ === 0
																? "px-4 py-4"
																: "p-4 border-t border-t-gray-5/70"
														}`}
													>
														<h4 className="text-gray-3 text-sm mb-4">
															{g.group}
														</h4>
														<ul className="space-y-3">
															{g.sections.map((s, _) => {
																return (
																	<DropdownMenuItem
																		asChild
																		key={_}
																		className="hover:border-0"
																	>
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
																	</DropdownMenuItem>
																);
															})}
														</ul>
													</div>
												);
											})}
										</div>
									</DropdownMenuContent>
								</DropdownMenu>
							)}
						</div>
					</div>
					{/* Renderizado uma única vez (mobile + desktop) para não duplicar o polling */}
					{user && <NotificationBell />}
					<ShoppingCartComponent amount={amount} />
				</div>
			</div>
		</nav>
	);
}

function ShoppingCartComponent({ amount }: { amount: number }) {
	return (
		<Link href="/market/cart" className="text-black cursor-pointer">
			<div className="relative">
				<ShoppingCart size={26} />
				{amount ? (
					<>
						<p className="absolute bg-primary rounded-full px-1.5 font-semibold text-white text-sm bottom-3 -right-2">
							{amount}
						</p>
					</>
				) : (
					<></>
				)}
			</div>
		</Link>
	);
}

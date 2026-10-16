"use client";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import useNotificationClick from "@/hooks/useNotificationClick";
import useNotificationsPolling from "@/hooks/useNotificationsPolling";
import { listNotifications, markAllAsRead } from "@/services/notifications";
import { useNotificationsStore } from "@/store/notificationsStore";
import { AppNotification } from "@/types/types";
import { Bell, BellOff } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import NotificationItem from "./NotificationItem";
import { formatBadgeCount } from "./notificationUtils";

export default function NotificationBell() {
	const [open, setOpen] = useState(false);
	const [items, setItems] = useState<AppNotification[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(false);
	const [markingAll, setMarkingAll] = useState(false);
	const { unreadCount, setUnreadCount } = useNotificationsStore();

	useNotificationsPolling(true);

	const handleClick = useNotificationClick((id, readAt) => {
		setItems((prev) => prev.map((n) => (n.id === id ? { ...n, readAt } : n)));
		setOpen(false);
	});

	async function loadItems() {
		try {
			setLoading(true);
			setError(false);
			const page = await listNotifications({ limit: 10 });
			setItems(page.items);
			setUnreadCount(page.unreadCount);
		} catch {
			setError(true);
		} finally {
			setLoading(false);
		}
	}

	function onOpenChange(next: boolean) {
		setOpen(next);
		// A lista só é recarregada ao abrir, não a cada ciclo do polling
		if (next) loadItems();
	}

	async function handleMarkAll() {
		const previousItems = items;
		const previousCount = unreadCount;
		const now = new Date().toISOString();
		setItems((prev) => prev.map((n) => (n.readAt ? n : { ...n, readAt: now })));
		setUnreadCount(0);
		try {
			setMarkingAll(true);
			await markAllAsRead();
		} catch {
			setItems(previousItems);
			setUnreadCount(previousCount);
			toast.error("Não foi possível marcar as notificações como lidas.");
		} finally {
			setMarkingAll(false);
		}
	}

	return (
		<DropdownMenu open={open} onOpenChange={onOpenChange}>
			<DropdownMenuTrigger
				className="relative text-black cursor-pointer"
				aria-label={
					unreadCount
						? `Notificações (${unreadCount} não lidas)`
						: "Notificações"
				}
			>
				<Bell size={24} />
				{unreadCount > 0 && (
					<span className="absolute -top-1.5 -right-2 min-w-5 h-5 px-1 rounded-full bg-primary text-white text-xs font-semibold flex items-center justify-center">
						{formatBadgeCount(unreadCount)}
					</span>
				)}
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="end"
				className="w-[calc(100vw-2rem)] max-w-sm p-0"
			>
				<div className="flex items-center justify-between gap-2 px-4 py-3 border-b">
					<h3 className="font-semibold text-gray-900">Notificações</h3>
					<Button
						variant="link"
						size="sm"
						className="h-auto p-0 text-primary"
						disabled={markingAll || unreadCount === 0}
						onClick={handleMarkAll}
					>
						Marcar todas como lidas
					</Button>
				</div>

				<div className="max-h-[60vh] overflow-y-auto divide-y">
					{loading && items.length === 0 ? (
						Array.from({ length: 3 }).map((_, i) => (
							<div key={i} className="flex gap-3 px-4 py-3">
								<Skeleton className="size-9 rounded-full" />
								<div className="flex-1 space-y-2">
									<Skeleton className="h-4 w-1/2" />
									<Skeleton className="h-4 w-full" />
									<Skeleton className="h-3 w-16" />
								</div>
							</div>
						))
					) : error && items.length === 0 ? (
						<div className="px-4 py-8 text-center text-sm text-gray-600 space-y-2">
							<p>Não foi possível carregar as notificações.</p>
							<Button variant="outline" size="sm" onClick={loadItems}>
								Tentar novamente
							</Button>
						</div>
					) : items.length === 0 ? (
						<div className="px-4 py-8 text-center text-sm text-gray-500 flex flex-col items-center gap-2">
							<BellOff size={28} className="text-gray-400" />
							<p>Você não tem notificações.</p>
						</div>
					) : (
						items.map((n) => (
							<NotificationItem
								key={n.id}
								notification={n}
								onClick={handleClick}
								compact
							/>
						))
					)}
				</div>

				<Link
					href="/market/notificacoes"
					onClick={() => setOpen(false)}
					className="block border-t px-4 py-3 text-center text-sm font-medium text-primary hover:bg-gray-50"
				>
					Ver todas
				</Link>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

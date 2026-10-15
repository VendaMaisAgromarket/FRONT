"use client";

import NotificationItem from "@/components/notifications/NotificationItem";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import useNotificationClick from "@/hooks/useNotificationClick";
import { listNotifications, markAllAsRead } from "@/services/notifications";
import { useNotificationsStore } from "@/store/notificationsStore";
import { AppNotification } from "@/types/types";
import { BellOff, LoaderCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

const PAGE_SIZE = 20;

type Filter = "all" | "unread";

export default function NotificationsPage() {
	const [filter, setFilter] = useState<Filter>("all");
	const [items, setItems] = useState<AppNotification[]>([]);
	const [nextCursor, setNextCursor] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [loadingMore, setLoadingMore] = useState(false);
	const [error, setError] = useState(false);
	const [markingAll, setMarkingAll] = useState(false);
	const { unreadCount, setUnreadCount } = useNotificationsStore();

	const handleClick = useNotificationClick((id, readAt) => {
		setItems((prev) => prev.map((n) => (n.id === id ? { ...n, readAt } : n)));
	});

	const loadFirstPage = useCallback(
		async (signal?: { aborted: boolean }) => {
			try {
				setLoading(true);
				setError(false);
				const page = await listNotifications({
					limit: PAGE_SIZE,
					unreadOnly: filter === "unread",
				});
				if (signal?.aborted) return;
				setItems(page.items);
				setNextCursor(page.nextCursor);
				setUnreadCount(page.unreadCount);
			} catch {
				if (!signal?.aborted) setError(true);
			} finally {
				if (!signal?.aborted) setLoading(false);
			}
		},
		[filter, setUnreadCount]
	);

	useEffect(() => {
		const signal = { aborted: false };
		loadFirstPage(signal);
		return () => {
			signal.aborted = true;
		};
	}, [loadFirstPage]);

	async function loadMore() {
		if (!nextCursor) return;
		try {
			setLoadingMore(true);
			const page = await listNotifications({
				limit: PAGE_SIZE,
				cursor: nextCursor,
				unreadOnly: filter === "unread",
			});
			setItems((prev) => [...prev, ...page.items]);
			setNextCursor(page.nextCursor);
			setUnreadCount(page.unreadCount);
		} catch {
			toast.error("Não foi possível carregar mais notificações.");
		} finally {
			setLoadingMore(false);
		}
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
		<main className="max-w-3xl mx-auto px-4 py-6 space-y-4">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<h1 className="text-2xl font-bold text-gray-900">Notificações</h1>
				<Button
					variant="outline"
					size="sm"
					disabled={markingAll || unreadCount === 0}
					onClick={handleMarkAll}
				>
					Marcar todas como lidas
				</Button>
			</div>

			<div className="flex gap-2" role="tablist">
				{(
					[
						["all", "Todas"],
						["unread", `Não lidas${unreadCount ? ` (${unreadCount > 99 ? "99+" : unreadCount})` : ""}`],
					] as const
				).map(([value, label]) => (
					<Button
						key={value}
						role="tab"
						aria-selected={filter === value}
						variant={filter === value ? "default" : "outline"}
						size="sm"
						onClick={() => setFilter(value)}
					>
						{label}
					</Button>
				))}
			</div>

			<div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden divide-y">
				{loading ? (
					Array.from({ length: 5 }).map((_, i) => (
						<div key={i} className="flex gap-3 p-4">
							<Skeleton className="size-9 rounded-full" />
							<div className="flex-1 space-y-2">
								<Skeleton className="h-4 w-1/3" />
								<Skeleton className="h-4 w-full" />
								<Skeleton className="h-3 w-20" />
							</div>
						</div>
					))
				) : error ? (
					<div className="py-12 px-4 text-center space-y-3">
						<p className="text-gray-600">Não foi possível carregar as notificações.</p>
						<Button variant="outline" onClick={() => loadFirstPage()}>
							Tentar novamente
						</Button>
					</div>
				) : items.length === 0 ? (
					<div className="py-12 px-4 text-center flex flex-col items-center gap-3">
						<div className="size-16 bg-gray-100 rounded-full flex items-center justify-center">
							<BellOff className="size-7 text-gray-400" />
						</div>
						<p className="text-gray-600">
							{filter === "unread"
								? "Nenhuma notificação não lida."
								: "Você ainda não tem notificações."}
						</p>
					</div>
				) : (
					items.map((n) => (
						<NotificationItem key={n.id} notification={n} onClick={handleClick} />
					))
				)}
			</div>

			{!loading && !error && nextCursor && (
				<div className="flex justify-center">
					<Button variant="outline" onClick={loadMore} disabled={loadingMore}>
						{loadingMore && <LoaderCircle className="size-4 animate-spin" />}
						Carregar mais
					</Button>
				</div>
			)}
		</main>
	);
}

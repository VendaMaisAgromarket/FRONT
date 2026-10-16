import { getUnreadCount, NotificationsUnauthorizedError } from "@/services/notifications";
import { toast } from "sonner";
import { create } from "zustand";

interface NotificationsState {
	unreadCount: number;
	// null até a primeira leitura — evita toast de "novas notificações" no carregamento
	lastFetchedCount: number | null;
	stopped: boolean;
	setUnreadCount: (count: number) => void;
	decrementUnread: () => void;
	refreshUnreadCount: () => Promise<void>;
	stopPolling: () => void;
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
	unreadCount: 0,
	lastFetchedCount: null,
	stopped: false,
	setUnreadCount: (count) =>
		set({ unreadCount: Math.max(0, count), lastFetchedCount: Math.max(0, count) }),
	decrementUnread: () => {
		const next = Math.max(0, get().unreadCount - 1);
		set({ unreadCount: next, lastFetchedCount: next });
	},
	refreshUnreadCount: async () => {
		if (get().stopped) return;
		try {
			const count = await getUnreadCount();
			const previous = get().lastFetchedCount;
			if (previous !== null && count > previous) {
				toast("Você tem novas notificações", {
					action: {
						label: "Ver",
						onClick: () => window.location.assign("/market/notificacoes"),
					},
				});
			}
			set({ unreadCount: count, lastFetchedCount: count });
		} catch (e) {
			if (e instanceof NotificationsUnauthorizedError) set({ stopped: true });
		}
	},
	stopPolling: () => set({ stopped: true }),
}));

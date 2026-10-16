import { getNotificationHref } from "@/components/notifications/notificationUtils";
import { markAsRead, NotificationsUnauthorizedError } from "@/services/notifications";
import { useNotificationsStore } from "@/store/notificationsStore";
import { AppNotification } from "@/types/types";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// Clique numa notificação: marca como lida de forma otimista (sem bloquear a
// navegação) e navega para o destino. `onMarkedRead` atualiza a lista local.
export default function useNotificationClick(
	onMarkedRead: (id: string, readAt: string) => void
) {
	const router = useRouter();
	const decrementUnread = useNotificationsStore((s) => s.decrementUnread);
	const stopPolling = useNotificationsStore((s) => s.stopPolling);

	return function handleClick(n: AppNotification) {
		if (n.readAt === null) {
			onMarkedRead(n.id, new Date().toISOString());
			decrementUnread();
			markAsRead(n.id).catch((e) => {
				// 401 = sessão expirada: para o polling. Outros erros (ex.: 404, notificação
				// já não existe) são corrigidos pelo próximo ciclo do contador.
				if (e instanceof NotificationsUnauthorizedError) stopPolling();
			});
		}

		const href = getNotificationHref(n);
		if (href) router.push(href);
		else toast.info("Esta notificação não tem uma página associada.");
	};
}

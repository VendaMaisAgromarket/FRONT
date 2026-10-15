import { getNotificationHref } from "@/components/notifications/notificationUtils";
import { markAsRead } from "@/services/notifications";
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

	return function handleClick(n: AppNotification) {
		if (n.readAt === null) {
			onMarkedRead(n.id, new Date().toISOString());
			decrementUnread();
			markAsRead(n.id).catch(() => {
				// 404 = notificação já não existe; o próximo polling corrige o contador
			});
		}

		const href = getNotificationHref(n);
		if (href) router.push(href);
		else toast.info("Esta notificação não tem uma página associada.");
	};
}

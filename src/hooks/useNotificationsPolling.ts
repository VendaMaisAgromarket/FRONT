import { useNotificationsStore } from "@/store/notificationsStore";
import { useEffect } from "react";

const POLLING_INTERVAL_MS = 30_000;

// Polling do contador de não lidas: só com a aba visível, refaz ao focar a aba.
// Para no 401 (o store marca `stopped`) e ao desmontar (logout recarrega a página).
export default function useNotificationsPolling(enabled: boolean) {
	const refreshUnreadCount = useNotificationsStore((s) => s.refreshUnreadCount);

	useEffect(() => {
		if (!enabled) return;

		let interval: ReturnType<typeof setInterval> | null = null;

		function start() {
			if (interval) return;
			refreshUnreadCount();
			interval = setInterval(refreshUnreadCount, POLLING_INTERVAL_MS);
		}

		function stop() {
			if (interval) clearInterval(interval);
			interval = null;
		}

		function onVisibilityChange() {
			if (document.visibilityState === "visible") start();
			else stop();
		}

		if (document.visibilityState === "visible") start();
		document.addEventListener("visibilitychange", onVisibilityChange);

		return () => {
			stop();
			document.removeEventListener("visibilitychange", onVisibilityChange);
		};
	}, [enabled, refreshUnreadCount]);
}

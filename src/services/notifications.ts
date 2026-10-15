import { NotificationsPage } from "@/types/types";

// Chamadas feitas do navegador para as rotas /api/notifications (proxy com o JWT da sessão).

export class NotificationsUnauthorizedError extends Error {
	constructor() {
		super("Sessão expirada");
	}
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
	const res = await fetch(url, { cache: "no-store", credentials: "include", ...init });
	if (res.status === 401) throw new NotificationsUnauthorizedError();
	if (!res.ok) throw new Error(`HTTP ${res.status}`);
	if (res.status === 204) return undefined as T;
	return res.json();
}

export function listNotifications(params: {
	limit?: number;
	cursor?: string | null;
	unreadOnly?: boolean;
} = {}): Promise<NotificationsPage> {
	const qs = new URLSearchParams();
	if (params.limit) qs.set("limit", String(params.limit));
	if (params.cursor) qs.set("cursor", params.cursor);
	if (params.unreadOnly) qs.set("unreadOnly", "true");
	return request<NotificationsPage>(`/api/notifications?${qs.toString()}`);
}

export async function getUnreadCount(): Promise<number> {
	const data = await request<{ count: number }>("/api/notifications/unread-count");
	return data.count ?? 0;
}

export function markAsRead(id: string): Promise<void> {
	return request<void>(`/api/notifications/${encodeURIComponent(id)}/read`, {
		method: "PATCH",
	});
}

export function markAllAsRead(): Promise<{ updated: number }> {
	return request<{ updated: number }>("/api/notifications/read-all", {
		method: "PATCH",
	});
}

import { AppNotification } from "@/types/types";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
	Bell,
	CheckCircle2,
	Package,
	RefreshCw,
	Scale,
	Sprout,
	Wallet,
	XCircle,
	type LucideIcon,
} from "lucide-react";

const iconByType: Record<string, LucideIcon> = {
	NEW_ORDER: Package,
	ORDER_ACCEPTED: CheckCircle2,
	ORDER_REJECTED: XCircle,
	DOWN_PAYMENT_RECEIVED: Wallet,
	WEIGHT_REGISTERED: Scale,
	FINAL_PAYMENT_RECEIVED: Wallet,
	ORDER_STATUS_CHANGED: RefreshCw,
	PRODUCT_HARVEST_REMINDER: Sprout,
};

export function getNotificationIcon(type: string): LucideIcon {
	return iconByType[type] ?? Bell;
}

const sellerTypes = new Set(["NEW_ORDER", "DOWN_PAYMENT_RECEIVED", "FINAL_PAYMENT_RECEIVED"]);

// Destino do clique. Vendas abrem o detalhe no painel do lado do usuário
// (vendedor → /market/orders, comprador → /market/history); o lembrete de colheita
// abre a edição do anúncio. Tipos desconhecidos caem no saleId/productId preenchido.
export function getNotificationHref(n: AppNotification): string | null {
	const productId = n.productId ?? n.data?.productId ?? null;

	if (n.type === "PRODUCT_HARVEST_REMINDER" || (!n.saleId && productId != null)) {
		return productId != null
			? `/market/edit-product/${encodeURIComponent(String(productId))}`
			: null;
	}

	if (n.saleId) {
		const role = n.data?.role ?? (sellerTypes.has(n.type) ? "seller" : "buyer");
		const base = role === "seller" ? "/market/orders" : "/market/history";
		return `${base}?saleId=${encodeURIComponent(n.saleId)}`;
	}

	return null;
}

export function formatRelativeTime(iso: string): string {
	return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: ptBR });
}

// Formato acordado na plataforma: 25/06/2026, 17:58h (fuso de Brasília)
export function formatNotificationDatetime(iso: string): string {
	const d = new Date(iso);
	const date = d.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
	const time = d.toLocaleTimeString("pt-BR", {
		timeZone: "America/Sao_Paulo",
		hour: "2-digit",
		minute: "2-digit",
	});
	return `${date}, ${time}h`;
}

export function formatBadgeCount(count: number): string {
	return count > 99 ? "99+" : String(count);
}

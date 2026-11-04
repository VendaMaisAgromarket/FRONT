import { AppNotification } from "@/types/types";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
	Bell,
	CheckCircle2,
	MapPin,
	Package,
	RefreshCw,
	Scale,
	Sprout,
	UserRoundCog,
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
	PROFILE_UPDATED: UserRoundCog,
	ADDRESS_CREATED: MapPin,
	ADDRESS_UPDATED: MapPin,
	ADDRESS_DELETED: MapPin,
};

export function getNotificationIcon(type: string): LucideIcon {
	return iconByType[type] ?? Bell;
}

// Rotas também usadas pelo back nos links dos e-mails — manter alinhado.
export const NOTIFICATION_ROUTES = {
	sellerSales: "/market/orders",
	buyerPurchases: "/market/history",
	profile: "/market/profile/personal-info",
	addresses: "/market/profile/personal-info/addresses",
	editProduct: "/market/edit-product",
} as const;

// Destino do clique. Vendas: o papel vem SEMPRE de `data.role` — o mesmo tipo (NEW_ORDER,
// ORDER_ACCEPTED, WEIGHT_REGISTERED…) chega para comprador e vendedor. Perfil e endereços vão
// para as páginas do perfil (nunca para um endereço específico: ele pode ter sido removido).
// O lembrete de colheita abre a edição do anúncio. Tipo desconhecido sem saleId/productId → sem link.
export function getNotificationHref(n: AppNotification): string | null {
	if (n.type === "PROFILE_UPDATED") return NOTIFICATION_ROUTES.profile;
	if (n.type.startsWith("ADDRESS_")) return NOTIFICATION_ROUTES.addresses;

	const productId = n.productId ?? n.data?.productId ?? null;

	if (n.type === "PRODUCT_HARVEST_REMINDER" || (!n.saleId && productId != null)) {
		return productId != null
			? `${NOTIFICATION_ROUTES.editProduct}/${encodeURIComponent(String(productId))}`
			: null;
	}

	if (n.saleId) {
		const role = n.data?.role;
		if (role !== "seller" && role !== "buyer") return null;
		const base = role === "seller" ? NOTIFICATION_ROUTES.sellerSales : NOTIFICATION_ROUTES.buyerPurchases;
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

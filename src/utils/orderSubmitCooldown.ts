// Espera entre envios do pedido no checkout. Paliativo enquanto POST /sales é lento:
// sem isso o cliente clica de novo e gera pedidos duplicados. Fica no localStorage
// para valer também após recarregar a página.

const STORAGE_KEY = "vendaplus:lastOrderSubmitAt";
export const ORDER_SUBMIT_COOLDOWN_MS = 2 * 60 * 1000;

export function getOrderCooldownRemainingMs(): number {
	try {
		const last = Number(localStorage.getItem(STORAGE_KEY)) || 0;
		return Math.max(0, last + ORDER_SUBMIT_COOLDOWN_MS - Date.now());
	} catch {
		return 0;
	}
}

export function startOrderCooldown() {
	try {
		localStorage.setItem(STORAGE_KEY, String(Date.now()));
	} catch {
		// Sem storage (aba anônima/bloqueado): resta a trava em memória do formulário
	}
}

export function clearOrderCooldown() {
	try {
		localStorage.removeItem(STORAGE_KEY);
	} catch {
		// ignore
	}
}

export function formatCooldown(ms: number): string {
	const totalSeconds = Math.ceil(ms / 1000);
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = String(totalSeconds % 60).padStart(2, "0");
	return `${minutes}:${seconds}`;
}

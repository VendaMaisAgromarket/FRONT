/** Motivos exibidos na tela de login via `?reason=`. */
export const LOGIN_NOTICES = {
	expired: "Sua sessão expirou. Entre novamente.",
	"password-changed": "Senha alterada. Entre novamente com a nova senha.",
	"password-reset": "Senha redefinida com sucesso. Entre com a nova senha.",
} as const;

export type LoginReason = keyof typeof LOGIN_NOTICES;

/**
 * Aceita só caminhos internos ("/market/..."), para o `?redirect=` não virar open redirect
 * ("//evil.com", "https://evil.com", "/\evil.com").
 */
export function safeRedirectPath(path: string | null | undefined): string | null {
	if (!path || !path.startsWith("/") || path.startsWith("//") || path.startsWith("/\\")) {
		return null;
	}
	return path;
}

export function loginUrl(reason?: LoginReason, redirect?: string | null) {
	const params = new URLSearchParams();
	if (reason) params.set("reason", reason);
	const safe = safeRedirectPath(redirect);
	if (safe) params.set("redirect", safe);
	const qs = params.toString();
	return qs ? `/login?${qs}` : "/login";
}

/** Rota que limpa o cookie de sessão e manda para o login com "sessão expirou". */
export function sessionExpiredUrl(redirect?: string | null) {
	const safe = safeRedirectPath(redirect);
	return safe
		? `/api/auth/expired?redirect=${encodeURIComponent(safe)}`
		: "/api/auth/expired";
}

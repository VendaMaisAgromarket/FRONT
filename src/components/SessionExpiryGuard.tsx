"use client";

import { sessionExpiredUrl } from "@/lib/authRedirect";
import { useEffect } from "react";

// Rotas de login/sessão têm 401 próprio (credencial errada), não de sessão expirada.
const IGNORED_PREFIXES = ["/api/auth"];

let redirecting = false;

function isSessionApiRequest(input: RequestInfo | URL) {
	const raw = input instanceof Request ? input.url : String(input);
	const url = new URL(raw, window.location.origin);
	return (
		url.origin === window.location.origin &&
		url.pathname.startsWith("/api/") &&
		!IGNORED_PREFIXES.some((p) => url.pathname.startsWith(p))
	);
}

/**
 * "Interceptor" global das chamadas do navegador às rotas /api/* (proxy com o JWT da sessão).
 * Um 401 significa que o back rejeitou o JWT — ex.: emitido antes de uma troca de senha
 * ("Unauthorized - Session expired") ou usuário removido. Limpa o cookie e manda para o
 * login com "Sua sessão expirou", preservando a rota atual em ?redirect=.
 */
export default function SessionExpiryGuard() {
	useEffect(() => {
		const originalFetch = window.fetch;

		window.fetch = async (input, init) => {
			const res = await originalFetch(input, init);
			if (res.status === 401 && !redirecting && isSessionApiRequest(input)) {
				redirecting = true;
				const current = window.location.pathname + window.location.search;
				window.location.assign(sessionExpiredUrl(current));
			}
			return res;
		};

		return () => {
			window.fetch = originalFetch;
		};
	}, []);

	return null;
}

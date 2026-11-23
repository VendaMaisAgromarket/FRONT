import {
	CertificationDocType,
	CertificationScope,
	CertificationStatus,
	FarmCertificationDocumentUrl,
} from "@/types/types";

// Base comum das certificações de fazenda e de safra. Chamadas feitas do navegador para
// /api/certifications/<scope> (proxy com o JWT da sessão). Erros da API vêm como
// { error: "mensagem em pt-BR" }: a mensagem fica em ApiError.message.

export function certificationApiBase(scope: CertificationScope) {
	return `/api/certifications/${scope}`;
}

export class ApiError extends Error {
	constructor(
		public status: number,
		message: string
	) {
		super(message);
	}
}

const FALLBACK_BY_STATUS: Record<number, string> = {
	401: "Sua sessão expirou. Entre novamente.",
	403: "Você não tem permissão para esta ação.",
	404: "Não encontrado.",
	502: "Falha ao enviar os arquivos. Tente novamente.",
};

export function toApiError(status: number, body: unknown): ApiError {
	const msg =
		body && typeof body === "object" && typeof (body as { error?: unknown }).error === "string"
			? (body as { error: string }).error
			: FALLBACK_BY_STATUS[status] ?? "Não foi possível concluir a operação. Tente novamente.";
	return new ApiError(status, msg);
}

export async function request<T>(url: string, init?: RequestInit): Promise<T> {
	let res: Response;
	try {
		res = await fetch(url, { cache: "no-store", credentials: "include", ...init });
	} catch {
		throw new ApiError(0, "Sem conexão com o servidor. Tente novamente.");
	}
	const body = res.status === 204 ? undefined : await res.json().catch(() => undefined);
	if (!res.ok) throw toApiError(res.status, body);
	return body as T;
}

export function json(method: string, body: unknown): RequestInit {
	return { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}

// ---------- Envio multipart ----------

export type UploadFile = { file: File; docType: CertificationDocType };

/**
 * Monta o multipart. Campos vazios são omitidos, exceto os de `keepEmpty` (enviados como "",
 * ex.: `variety` da safra, onde vazio no PUT apaga o valor).
 */
export function buildCertificationFormData(
	values: Record<string, string | number | null | undefined>,
	files: UploadFile[],
	keepEmpty: string[] = []
) {
	const fd = new FormData();
	Object.entries(values).forEach(([k, v]) => {
		const value = typeof v === "string" ? v.trim() : v;
		if (value !== "" && value != null) fd.append(k, String(value));
		else if (keepEmpty.includes(k)) fd.append(k, "");
	});
	// Campo de arquivo é exatamente "documents" (sem colchetes), uma vez por arquivo.
	files.forEach(({ file, docType }) => {
		fd.append("documents", file);
		fd.append("documentTypes", docType);
	});
	return fd;
}

// XHR em vez de fetch para ter progresso de upload. Sem Content-Type manual: o navegador
// monta o multipart com o boundary.
export function sendMultipart<T>(
	method: "POST" | "PUT",
	url: string,
	fd: FormData,
	onProgress?: (percent: number) => void
): Promise<T> {
	return new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		xhr.open(method, url);
		xhr.withCredentials = true;
		xhr.upload.onprogress = (e) => {
			if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
		};
		xhr.onload = () => {
			let body: unknown;
			try {
				body = JSON.parse(xhr.responseText);
			} catch {
				body = undefined;
			}
			if (xhr.status >= 200 && xhr.status < 300) resolve(body as T);
			else if (xhr.status === 413) reject(new ApiError(413, "Os arquivos são grandes demais para um único envio."));
			else reject(toApiError(xhr.status, body));
		};
		xhr.onerror = () => reject(new ApiError(0, "Sem conexão com o servidor. Tente novamente."));
		xhr.send(fd);
	});
}

// ---------- Leitura comum ----------

export function getCertification<T>(scope: CertificationScope, id: string) {
	return request<T>(`${certificationApiBase(scope)}/${encodeURIComponent(id)}`);
}

// Buscar no momento do clique: a URL expira em 10 minutos e não deve ser guardada.
export function getCertificationDocumentUrl(scope: CertificationScope, id: string, documentId: string) {
	return request<FarmCertificationDocumentUrl>(
		`${certificationApiBase(scope)}/${encodeURIComponent(id)}/documents/${encodeURIComponent(documentId)}/url`
	);
}

// Abre o documento numa nova aba com uma URL assinada recém-buscada. A aba é aberta antes
// do await para não ser bloqueada como pop-up.
export async function openCertificationDocument(scope: CertificationScope, id: string, documentId: string) {
	const win = window.open("", "_blank");
	try {
		const { url } = await getCertificationDocumentUrl(scope, id, documentId);
		if (win) {
			win.opener = null;
			win.location.href = url;
		} else {
			window.open(url, "_blank", "noopener");
		}
	} catch (e) {
		win?.close();
		throw e;
	}
}

// ---------- Admin ----------
// `revision` é o do detalhe que o admin analisou: se o dono reenviou depois, a API responde 409.

export function listAdminCertifications<T>(
	scope: CertificationScope,
	params: {
		status?: CertificationStatus;
		type?: string | null;
		userId?: string;
		limit?: number;
		cursor?: string | null;
	}
) {
	const qs = new URLSearchParams();
	if (params.status) qs.set("status", params.status);
	if (params.type) qs.set("type", params.type);
	if (params.userId) qs.set("userId", params.userId);
	if (params.limit) qs.set("limit", String(params.limit));
	if (params.cursor) qs.set("cursor", params.cursor);
	return request<{ items: T[]; nextCursor: string | null }>(
		`${certificationApiBase(scope)}/admin?${qs.toString()}`
	);
}

function adminAction<T>(scope: CertificationScope, id: string, action: string, body: unknown) {
	return request<T>(
		`${certificationApiBase(scope)}/admin/${encodeURIComponent(id)}/${action}`,
		json("PATCH", body)
	);
}

export function approveCertification<T>(
	scope: CertificationScope,
	id: string,
	body: { revision: number; documentId?: string; notes?: string }
) {
	return adminAction<T>(scope, id, "approve", body);
}

export function rejectCertification<T>(
	scope: CertificationScope,
	id: string,
	body: { revision: number; reason: string; notes?: string }
) {
	return adminAction<T>(scope, id, "reject", body);
}

export function revokeCertification<T>(
	scope: CertificationScope,
	id: string,
	body: { revision: number; reason: string; notes?: string }
) {
	return adminAction<T>(scope, id, "revoke", body);
}

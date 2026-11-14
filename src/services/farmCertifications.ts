import {
	FarmCertification,
	FarmCertificationAdminPage,
	FarmCertificationBadge,
	FarmCertificationDetail,
	FarmCertificationDocType,
	FarmCertificationDocumentUrl,
	FarmCertificationStatus,
	FarmCertificationType,
} from "@/types/types";

// Chamadas feitas do navegador para /api/certifications/farm (proxy com o JWT da sessão).
// Erros da API vêm como { error: "mensagem em pt-BR" }: a mensagem fica em ApiError.message.

const BASE = "/api/certifications/farm";

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
	404: "Certificação não encontrada.",
	502: "Falha ao enviar os arquivos. Tente novamente.",
};

function toApiError(status: number, body: unknown): ApiError {
	const msg =
		body && typeof body === "object" && typeof (body as { error?: unknown }).error === "string"
			? (body as { error: string }).error
			: FALLBACK_BY_STATUS[status] ?? "Não foi possível concluir a operação. Tente novamente.";
	return new ApiError(status, msg);
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
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

function json(method: string, body: unknown): RequestInit {
	return { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}

// ---------- Produtor ----------

export type FarmCertificationFormValues = {
	farmName: string;
	city: string;
	uf: string;
	ccir: string;
	car: string;
	areaHectares: string;
	type: FarmCertificationType;
	certifierName: string;
	certifierCnpj: string;
	certificateNumber: string;
	issuedAt: string; // AAAA-MM-DD
	validUntil: string; // AAAA-MM-DD
};

export type UploadFile = { file: File; docType: FarmCertificationDocType };

function buildFormData(values: FarmCertificationFormValues, files: UploadFile[]) {
	const fd = new FormData();
	Object.entries(values).forEach(([k, v]) => {
		const value = typeof v === "string" ? v.trim() : v;
		if (value !== "" && value != null) fd.append(k, String(value));
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
function sendMultipart(
	method: "POST" | "PUT",
	url: string,
	fd: FormData,
	onProgress?: (percent: number) => void
): Promise<FarmCertificationDetail> {
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
			if (xhr.status >= 200 && xhr.status < 300) resolve(body as FarmCertificationDetail);
			else if (xhr.status === 413) reject(new ApiError(413, "Os arquivos são grandes demais para um único envio."));
			else reject(toApiError(xhr.status, body));
		};
		xhr.onerror = () => reject(new ApiError(0, "Sem conexão com o servidor. Tente novamente."));
		xhr.send(fd);
	});
}

export function submitFarmCertification(
	values: FarmCertificationFormValues,
	files: UploadFile[],
	onProgress?: (percent: number) => void
) {
	return sendMultipart("POST", BASE, buildFormData(values, files), onProgress);
}

export function resubmitFarmCertification(
	id: string,
	values: FarmCertificationFormValues,
	files: UploadFile[],
	onProgress?: (percent: number) => void
) {
	return sendMultipart("PUT", `${BASE}/${encodeURIComponent(id)}`, buildFormData(values, files), onProgress);
}

export function listMyFarmCertifications() {
	return request<FarmCertification[]>(`${BASE}/mine`);
}

export function getFarmCertification(id: string) {
	return request<FarmCertificationDetail>(`${BASE}/${encodeURIComponent(id)}`);
}

// Buscar no momento do clique: a URL expira em 10 minutos e não deve ser guardada.
export function getFarmCertificationDocumentUrl(id: string, documentId: string) {
	return request<FarmCertificationDocumentUrl>(
		`${BASE}/${encodeURIComponent(id)}/documents/${encodeURIComponent(documentId)}/url`
	);
}

export function getFarmCertificationBadge(userId: string) {
	return request<FarmCertificationBadge>(`${BASE}/badge/${encodeURIComponent(userId)}`);
}

// ---------- Admin ----------

export function listAdminFarmCertifications(params: {
	status?: FarmCertificationStatus;
	type?: FarmCertificationType | null;
	userId?: string;
	limit?: number;
	cursor?: string | null;
}) {
	const qs = new URLSearchParams();
	if (params.status) qs.set("status", params.status);
	if (params.type) qs.set("type", params.type);
	if (params.userId) qs.set("userId", params.userId);
	if (params.limit) qs.set("limit", String(params.limit));
	if (params.cursor) qs.set("cursor", params.cursor);
	return request<FarmCertificationAdminPage>(`${BASE}/admin?${qs.toString()}`);
}

export function approveFarmCertification(id: string, body: { documentId?: string; notes?: string }) {
	return request<FarmCertificationDetail>(
		`${BASE}/admin/${encodeURIComponent(id)}/approve`,
		json("PATCH", body)
	);
}

export function rejectFarmCertification(id: string, body: { reason: string; notes?: string }) {
	return request<FarmCertificationDetail>(
		`${BASE}/admin/${encodeURIComponent(id)}/reject`,
		json("PATCH", body)
	);
}

export function revokeFarmCertification(id: string, body: { reason: string; notes?: string }) {
	return request<FarmCertificationDetail>(
		`${BASE}/admin/${encodeURIComponent(id)}/revoke`,
		json("PATCH", body)
	);
}

// Abre o documento numa nova aba com uma URL assinada recém-buscada. A aba é aberta antes
// do await para não ser bloqueada como pop-up.
export async function openFarmCertificationDocument(id: string, documentId: string) {
	const win = window.open("", "_blank");
	try {
		const { url } = await getFarmCertificationDocumentUrl(id, documentId);
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

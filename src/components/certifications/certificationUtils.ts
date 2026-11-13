import {
	FarmCertificationDocType,
	FarmCertificationEventAction,
	FarmCertificationStatus,
	FarmCertificationType,
} from "@/types/types";
import { brasiliaDateKey } from "@/utils/functions";

// Rotas usadas também pelo back nos links de e-mail e notificações — manter alinhado.
export const CERTIFICATION_ROUTES = {
	producerList: "/market/certifications/farm",
	producerNew: "/market/certifications/farm/new",
	producerEdit: (id: string) => `/market/certifications/farm/${encodeURIComponent(id)}/edit`,
	adminList: "/admin/certifications/farm",
	adminDetail: (id: string) => `/admin/certifications/farm/${encodeURIComponent(id)}`,
} as const;

// Disparado após aprovar/recusar/revogar: o menu do admin atualiza o contador de pendentes
export const PENDING_CHANGED_EVENT = "farm-certifications:pending-changed";

export const CERTIFICATION_TYPE_LABELS: Record<FarmCertificationType, string> = {
	ORGANIC_SISORG: "Orgânico (SisOrg)",
	GLOBALGAP: "GlobalG.A.P.",
	RAINFOREST_ALLIANCE: "Rainforest Alliance",
	FAIR_TRADE: "Fair Trade",
	OTHER: "Outra",
};

export const CERTIFICATION_TYPES = Object.keys(CERTIFICATION_TYPE_LABELS) as FarmCertificationType[];

export const CERTIFICATION_STATUS_LABELS: Record<FarmCertificationStatus, string> = {
	PENDING: "Em análise",
	APPROVED: "Aprovada",
	REJECTED: "Recusada",
	EXPIRED: "Vencida",
	REVOKED: "Revogada",
};

export const CERTIFICATION_STATUS_CLASSES: Record<FarmCertificationStatus, string> = {
	PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
	APPROVED: "bg-green-100 text-green-800 border-green-200",
	REJECTED: "bg-red-100 text-red-800 border-red-200",
	EXPIRED: "bg-gray-100 text-gray-700 border-gray-200",
	REVOKED: "bg-red-200 text-red-900 border-red-300",
};

export const CERTIFICATION_EVENT_LABELS: Record<FarmCertificationEventAction, string> = {
	SUBMITTED: "Enviada",
	RESUBMITTED: "Corrigida e reenviada",
	APPROVED: "Aprovada",
	REJECTED: "Recusada",
	REVOKED: "Revogada",
	EXPIRED: "Vencida (automático)",
};

export const DOC_TYPE_LABELS: Record<FarmCertificationDocType, string> = {
	CERTIFICATE: "Certificado",
	AUDIT_REPORT: "Laudo de auditoria",
	OTHER: "Outro",
};

export const DOC_TYPES = Object.keys(DOC_TYPE_LABELS) as FarmCertificationDocType[];

export const UFS = [
	"AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA",
	"PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const;

// Limites de arquivo (iguais aos do back)
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_FILES_PER_UPLOAD = 5;
export const MAX_FILES_TOTAL = 15;
export const ACCEPTED_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png", ".webp"];
export const ACCEPTED_MIME = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

export function isAcceptedFile(file: File): boolean {
	const name = file.name.toLowerCase();
	return (
		ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext)) &&
		(file.type === "" || ACCEPTED_MIME.includes(file.type))
	);
}

export function formatFileSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}

// ---------- Datas ----------
// issuedAt/validUntil são dias de calendário (início do dia em Brasília). Sempre formatar
// no fuso America/Sao_Paulo para 31/12/2027 não virar 30/12.

export function formatCalendarDate(iso: string): string {
	return new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

// Para preencher <input type="date"> (AAAA-MM-DD)
export function isoToDateInput(iso: string): string {
	return brasiliaDateKey(new Date(iso));
}

export function todayKey(): string {
	return brasiliaDateKey(new Date());
}

function keyToUtcMs(key: string): number {
	const [y, m, d] = key.split("-").map(Number);
	return Date.UTC(y, m - 1, d);
}

// Dias de calendário entre hoje e a validade (negativo = vencida). 0 = vence hoje.
export function daysUntil(iso: string): number {
	return Math.round((keyToUtcMs(isoToDateInput(iso)) - keyToUtcMs(todayKey())) / 86_400_000);
}

export function isExpiredDate(iso: string): boolean {
	return daysUntil(iso) < 0;
}

export function expiringLabel(days: number): string {
	if (days === 0) return "vence hoje";
	if (days === 1) return "vence amanhã";
	return `vence em ${days} dias`;
}

export function formatArea(value: string | number): string {
	const n = Number(value);
	return Number.isFinite(n)
		? `${n.toLocaleString("pt-BR", { maximumFractionDigits: 4 })} ha`
		: String(value);
}

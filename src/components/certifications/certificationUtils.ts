import {
	CertificationScope,
	FarmCertificationDocType,
	FarmCertificationEventAction,
	FarmCertificationStatus,
	FarmCertificationType,
	HarvestCertificationType,
	ProductionUnit,
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

// Rotas por escopo (fazenda | safra). Também usadas pelo back nos e-mails e notificações.
export function certificationRoutes(scope: CertificationScope) {
	const enc = encodeURIComponent;
	return {
		list: `/market/certifications/${scope}`,
		new: `/market/certifications/${scope}/new`,
		edit: (id: string) => `/market/certifications/${scope}/${enc(id)}/edit`,
		// Lista com o detalhe já aberto (ex.: depois de enviar uma safra, para vincular anúncios)
		listWithDetail: (id: string) => `/market/certifications/${scope}?open=${enc(id)}`,
		adminList: `/admin/certifications/${scope}`,
		adminDetail: (id: string) => `/admin/certifications/${scope}/${enc(id)}`,
	};
}

export const SCOPE_LABELS: Record<CertificationScope, string> = {
	farm: "Fazenda",
	harvest: "Safra",
};

// Disparado após aprovar/recusar/revogar: o menu do admin atualiza o contador de pendentes
export const PENDING_CHANGED_EVENT = "certifications:pending-changed";

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

// ---------- Safra ----------

export const HARVEST_TYPE_LABELS: Record<HarvestCertificationType, string> = {
	TRACEABILITY: "Rastreabilidade",
	RESIDUE_ANALYSIS: "Análise de resíduos",
	ORGANIC: "Orgânico",
	GLOBALGAP: "GlobalG.A.P.",
	OTHER: "Outra",
};

export const HARVEST_TYPES = Object.keys(HARVEST_TYPE_LABELS) as HarvestCertificationType[];

export const PRODUCTION_UNIT_LABELS: Record<ProductionUnit, string> = { KG: "kg", TON: "t" };

// Rótulo do tipo, para telas comuns aos dois escopos
export function certificationTypeLabel(scope: CertificationScope, type: string): string {
	const labels: Record<string, string> = scope === "farm" ? CERTIFICATION_TYPE_LABELS : HARVEST_TYPE_LABELS;
	return labels[type] ?? type;
}

export function certificationTypeOptions(scope: CertificationScope): [string, string][] {
	return Object.entries(scope === "farm" ? CERTIFICATION_TYPE_LABELS : HARVEST_TYPE_LABELS);
}

// Ano agrícola: "2026/27" (o segundo ano é o seguinte) ou um ano só, "2026". Mesma regra do back.
const HARVEST_SEASON_RE = /^(\d{4})(?:\/(\d{2}))?$/;

export function harvestSeasonYears(season: string): number[] | null {
	const m = HARVEST_SEASON_RE.exec(season);
	if (!m) return null;
	const first = Number(m[1]);
	if (!m[2]) return [first];
	const second = first + 1;
	return Number(m[2]) === second % 100 ? [first, second] : null;
}

// Opções do select: anos agrícolas próximos e os anos únicos correspondentes
export function harvestSeasonOptions(current?: string): string[] {
	const year = Number(todayKey().slice(0, 4));
	const opts: string[] = [];
	for (let y = year - 1; y <= year + 1; y++) opts.push(`${y}/${String((y + 1) % 100).padStart(2, "0")}`);
	for (let y = year - 1; y <= year + 1; y++) opts.push(String(y));
	// Na correção, mantém o valor salvo mesmo se já estiver fora da janela
	if (current && !opts.includes(current)) opts.unshift(current);
	return opts;
}

// "Tomate Italiano — safra 2026/27 · Talhão 3"
export function harvestTitle(c: { crop: string; variety: string | null; harvestSeason: string; plotIdentifier?: string }) {
	const name = [c.crop, c.variety].filter(Boolean).join(" ");
	return `${name} — safra ${c.harvestSeason}${c.plotIdentifier ? ` · ${c.plotIdentifier}` : ""}`;
}

export function formatDecimal(value: string | number, suffix = ""): string {
	const n = Number(value);
	return Number.isFinite(n)
		? `${n.toLocaleString("pt-BR", { maximumFractionDigits: 4 })}${suffix ? ` ${suffix}` : ""}`
		: String(value);
}

// Sem acento e minúsculo, para comparar cultura com nome/variedade/categoria do anúncio
export function normalizeText(v: string | null | undefined): string {
	return (v ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * Prévia (no cliente) das regras de vínculo do back, só para destacar anúncios compatíveis.
 * Quem decide é a API.
 */
export function isProductCompatible(
	cert: { crop: string; plantingDate: string; validUntil: string },
	product: { name: string; variety?: string | null; category?: string | null; harvestAt: string }
): boolean {
	const crop = normalizeText(cert.crop);
	const cropMatches = [product.name, product.variety, product.category]
		.map(normalizeText)
		.filter(Boolean)
		.some((f) => f.includes(crop) || crop.includes(f));
	const harvest = isoToDateInput(product.harvestAt);
	return cropMatches && harvest >= isoToDateInput(cert.plantingDate) && harvest <= isoToDateInput(cert.validUntil);
}

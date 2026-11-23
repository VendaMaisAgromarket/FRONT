import {
	FarmCertification,
	FarmCertificationAdminItem,
	FarmCertificationBadge,
	FarmCertificationDetail,
	FarmCertificationStatus,
	FarmCertificationType,
} from "@/types/types";
import {
	UploadFile,
	approveCertification,
	buildCertificationFormData,
	certificationApiBase,
	getCertification,
	getCertificationDocumentUrl,
	listAdminCertifications,
	openCertificationDocument,
	rejectCertification,
	request,
	revokeCertification,
	sendMultipart,
} from "./certifications";

// Certificação de fazenda. A base comum (erros, multipart, documentos, admin) fica em ./certifications.
export { ApiError } from "./certifications";
export type { UploadFile } from "./certifications";

const BASE = certificationApiBase("farm");

// ---------- Dono ----------

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

export function submitFarmCertification(
	values: FarmCertificationFormValues,
	files: UploadFile[],
	onProgress?: (percent: number) => void
) {
	return sendMultipart<FarmCertificationDetail>("POST", BASE, buildCertificationFormData(values, files), onProgress);
}

export function resubmitFarmCertification(
	id: string,
	values: FarmCertificationFormValues,
	files: UploadFile[],
	onProgress?: (percent: number) => void
) {
	return sendMultipart<FarmCertificationDetail>(
		"PUT",
		`${BASE}/${encodeURIComponent(id)}`,
		buildCertificationFormData(values, files),
		onProgress
	);
}

export function listMyFarmCertifications() {
	return request<FarmCertification[]>(`${BASE}/mine`);
}

export function getFarmCertification(id: string) {
	return getCertification<FarmCertificationDetail>("farm", id);
}

export function getFarmCertificationDocumentUrl(id: string, documentId: string) {
	return getCertificationDocumentUrl("farm", id, documentId);
}

export function openFarmCertificationDocument(id: string, documentId: string) {
	return openCertificationDocument("farm", id, documentId);
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
	return listAdminCertifications<FarmCertificationAdminItem>("farm", params);
}

export function approveFarmCertification(id: string, body: { revision: number; documentId?: string; notes?: string }) {
	return approveCertification<FarmCertificationDetail>("farm", id, body);
}

export function rejectFarmCertification(id: string, body: { revision: number; reason: string; notes?: string }) {
	return rejectCertification<FarmCertificationDetail>("farm", id, body);
}

export function revokeFarmCertification(id: string, body: { revision: number; reason: string; notes?: string }) {
	return revokeCertification<FarmCertificationDetail>("farm", id, body);
}

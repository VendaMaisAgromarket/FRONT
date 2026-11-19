import {
	HarvestCertification,
	HarvestCertificationDetail,
	HarvestCertificationType,
	HarvestLinkResult,
	HarvestProductBadge,
	ProductionUnit,
} from "@/types/types";
import {
	UploadFile,
	buildCertificationFormData,
	certificationApiBase,
	getCertification,
	request,
	sendMultipart,
} from "./certifications";

// Certificação de safra. A base comum (erros, multipart, documentos, admin) fica em ./certifications.

const BASE = certificationApiBase("harvest");

export type HarvestCertificationFormValues = {
	harvestSeason: string; // "2026/27" ou "2026"
	crop: string;
	variety: string;
	plotIdentifier: string;
	plantedAreaHectares: string; // com ponto decimal
	estimatedProduction: string; // com ponto decimal
	productionUnit: ProductionUnit;
	plantingDate: string; // AAAA-MM-DD
	harvestDate: string;
	type: HarvestCertificationType;
	certifierName: string;
	certifierCnpj: string;
	certificateNumber: string;
	issuedAt: string;
	validUntil: string;
};

// `variety` vai sempre, mesmo vazia: no PUT, vazio apaga a variedade.
const KEEP_EMPTY = ["variety"];

export function submitHarvestCertification(
	values: HarvestCertificationFormValues,
	files: UploadFile[],
	onProgress?: (percent: number) => void
) {
	return sendMultipart<HarvestCertificationDetail>(
		"POST",
		BASE,
		buildCertificationFormData(values, files, KEEP_EMPTY),
		onProgress
	);
}

export function resubmitHarvestCertification(
	id: string,
	values: HarvestCertificationFormValues,
	files: UploadFile[],
	onProgress?: (percent: number) => void
) {
	return sendMultipart<HarvestCertificationDetail>(
		"PUT",
		`${BASE}/${encodeURIComponent(id)}`,
		buildCertificationFormData(values, files, KEEP_EMPTY),
		onProgress
	);
}

export function listMyHarvestCertifications() {
	return request<HarvestCertification[]>(`${BASE}/mine`);
}

export function getHarvestCertification(id: string) {
	return getCertification<HarvestCertificationDetail>("harvest", id);
}

// Vínculo com anúncio: chamada separada do cadastro/edição do produto.
export function linkHarvestCertificationProduct(id: string, productId: string) {
	return request<HarvestLinkResult>(
		`${BASE}/${encodeURIComponent(id)}/products/${encodeURIComponent(productId)}`,
		{ method: "PUT" }
	);
}

export function unlinkHarvestCertificationProduct(id: string, productId: string) {
	return request<void>(`${BASE}/${encodeURIComponent(id)}/products/${encodeURIComponent(productId)}`, {
		method: "DELETE",
	});
}

// Público: selo de safra de um anúncio
export function getHarvestProductBadge(productId: string) {
	return request<HarvestProductBadge>(`${BASE}/product/${encodeURIComponent(productId)}/badge`);
}

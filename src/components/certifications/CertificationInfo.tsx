import { FarmCertification, HarvestCertification } from "@/types/types";
import { ReactNode } from "react";
import {
	CERTIFICATION_TYPE_LABELS,
	HARVEST_TYPE_LABELS,
	PRODUCTION_UNIT_LABELS,
	formatArea,
	formatCalendarDate,
	formatDecimal,
} from "./certificationUtils";

export function InfoSection({ title, children }: { title: string; children: ReactNode }) {
	return (
		<section className="space-y-3">
			<h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">{title}</h3>
			{children}
		</section>
	);
}

export function InfoGrid({ items }: { items: [string, ReactNode][] }) {
	return (
		<dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
			{items.map(([label, value]) => (
				<div key={label} className="min-w-0">
					<dt className="text-xs text-gray-500">{label}</dt>
					<dd className="break-words text-sm text-gray-900">{value || "—"}</dd>
				</div>
			))}
		</dl>
	);
}

// Blocos "Fazenda" e "Certificado" (dono ou admin)
export default function CertificationInfo({ certification: c }: { certification: FarmCertification }) {
	return (
		<div className="space-y-6">
			<InfoSection title="Fazenda">
				<InfoGrid
					items={[
						["Nome", c.farmName],
						["Município/UF", `${c.city}/${c.uf}`],
						["CCIR", c.ccir],
						["CAR", c.car],
						["Área", formatArea(c.areaHectares)],
					]}
				/>
			</InfoSection>
			<InfoSection title="Certificado">
				<InfoGrid
					items={[
						["Tipo", CERTIFICATION_TYPE_LABELS[c.type] ?? c.type],
						["Certificadora", c.certifierName],
						["CNPJ da certificadora", c.certifierCnpj],
						["Número do certificado", c.certificateNumber],
						["Emissão", formatCalendarDate(c.issuedAt)],
						["Validade", formatCalendarDate(c.validUntil)],
					]}
				/>
			</InfoSection>
		</div>
	);
}

// Blocos "Safra" e "Certificado" (dono ou admin)
export function HarvestCertificationInfo({ certification: c }: { certification: HarvestCertification }) {
	return (
		<div className="space-y-6">
			<InfoSection title="Safra">
				<InfoGrid
					items={[
						["Cultura", c.crop],
						["Variedade", c.variety],
						["Ano agrícola", c.harvestSeason],
						["Talhão/lote", c.plotIdentifier],
						["Área plantada", formatArea(c.plantedAreaHectares)],
						[
							"Produção estimada",
							formatDecimal(c.estimatedProduction, PRODUCTION_UNIT_LABELS[c.productionUnit] ?? c.productionUnit),
						],
						["Plantio", formatCalendarDate(c.plantingDate)],
						["Colheita", formatCalendarDate(c.harvestDate)],
					]}
				/>
			</InfoSection>
			<InfoSection title="Certificado">
				<InfoGrid
					items={[
						["Tipo", HARVEST_TYPE_LABELS[c.type] ?? c.type],
						["Certificadora ou laboratório", c.certifierName],
						["CNPJ", c.certifierCnpj],
						["Número do certificado", c.certificateNumber],
						["Emissão", formatCalendarDate(c.issuedAt)],
						["Validade", formatCalendarDate(c.validUntil)],
					]}
				/>
			</InfoSection>
		</div>
	);
}

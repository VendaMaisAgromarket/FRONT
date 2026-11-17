import { FarmCertification } from "@/types/types";
import { ReactNode } from "react";
import {
	CERTIFICATION_TYPE_LABELS,
	formatArea,
	formatCalendarDate,
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

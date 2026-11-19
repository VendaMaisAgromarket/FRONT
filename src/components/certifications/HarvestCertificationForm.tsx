"use client";

import { Form } from "@/components/ui/form";
import { ApiError } from "@/services/certifications";
import {
	HarvestCertificationFormValues,
	resubmitHarvestCertification,
	submitHarvestCertification,
} from "@/services/harvestCertifications";
import { HarvestCertificationDetail, HarvestCertificationType, ProductionUnit } from "@/types/types";
import { formatCnpj } from "@/utils/functions";
import { zodResolver } from "@hookform/resolvers/zod";
import { useId, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
	CertificateFields,
	DATE_RE,
	DocumentsField,
	FormFooter,
	FormSelectField,
	FormTextField,
	certificateFieldsSchema,
	positiveDecimal,
	refineCertificateDates,
	requiredDate,
	toApiDecimal,
	toInputDecimal,
	usePendingFiles,
} from "./CertificationFormParts";
import {
	HARVEST_TYPES,
	PRODUCTION_UNIT_LABELS,
	certificationTypeOptions,
	harvestSeasonOptions,
	harvestSeasonYears,
	isoToDateInput,
} from "./certificationUtils";

const schema = z
	.object({
		harvestSeason: z
			.string()
			.min(1, "Selecione o ano agrícola")
			.refine((v) => harvestSeasonYears(v) !== null, "Ano agrícola inválido"),
		crop: z.string().trim().min(2, "Mínimo de 2 caracteres").max(80, "Máximo de 80 caracteres"),
		variety: z.string().trim().max(80, "Máximo de 80 caracteres"),
		plotIdentifier: z.string().trim().min(1, "Informe o talhão ou lote").max(80, "Máximo de 80 caracteres"),
		plantedAreaHectares: positiveDecimal("Informe a área plantada"),
		estimatedProduction: positiveDecimal("Informe a produção estimada"),
		productionUnit: z.enum(["KG", "TON"], { errorMap: () => ({ message: "Selecione a unidade" }) }),
		plantingDate: requiredDate("Informe a data de plantio"),
		harvestDate: requiredDate("Informe a data de colheita"),
		type: z.enum(HARVEST_TYPES as [HarvestCertificationType, ...HarvestCertificationType[]], {
			errorMap: () => ({ message: "Selecione o tipo" }),
		}),
		...certificateFieldsSchema,
	})
	.superRefine((v, ctx) => {
		if (DATE_RE.test(v.plantingDate) && DATE_RE.test(v.harvestDate)) {
			if (v.harvestDate < v.plantingDate) {
				ctx.addIssue({
					code: "custom",
					path: ["harvestDate"],
					message: "A colheita não pode ser antes do plantio",
				});
			}
			const years = harvestSeasonYears(v.harvestSeason);
			if (years && !years.includes(Number(v.harvestDate.slice(0, 4)))) {
				ctx.addIssue({
					code: "custom",
					path: ["harvestDate"],
					message: `A colheita precisa ser em ${years.join(" ou ")} (safra ${v.harvestSeason})`,
				});
			}
		}
		refineCertificateDates(v, ctx);
	});

type Values = z.input<typeof schema>;

type Props = {
	// Sem `initial` = envio novo (POST). Com `initial` = correção (PUT).
	initial?: HarvestCertificationDetail;
	// Culturas dos anúncios do usuário, para o autocomplete (facilita o vínculo depois)
	cropSuggestions?: string[];
	onSuccess: (result: HarvestCertificationDetail) => void;
	onCancel: () => void;
	// 409 no modo correção: a certificação mudou (ex.: admin já avaliou)
	onConflict?: () => void;
};

function toDefaults(c?: HarvestCertificationDetail): Values {
	return {
		harvestSeason: c?.harvestSeason ?? "",
		crop: c?.crop ?? "",
		variety: c?.variety ?? "",
		plotIdentifier: c?.plotIdentifier ?? "",
		plantedAreaHectares: c ? toInputDecimal(c.plantedAreaHectares) : "",
		estimatedProduction: c ? toInputDecimal(c.estimatedProduction) : "",
		productionUnit: (c?.productionUnit ?? "") as ProductionUnit,
		plantingDate: c ? isoToDateInput(c.plantingDate) : "",
		harvestDate: c ? isoToDateInput(c.harvestDate) : "",
		type: (c?.type ?? "") as HarvestCertificationType,
		certifierName: c?.certifierName ?? "",
		certifierCnpj: c?.certifierCnpj ? formatCnpj(c.certifierCnpj) : "",
		certificateNumber: c?.certificateNumber ?? "",
		issuedAt: c ? isoToDateInput(c.issuedAt) : "",
		validUntil: c ? isoToDateInput(c.validUntil) : "",
	};
}

const onlyDecimal = (v: string) => v.replace(/[^\d.,]/g, "");

export default function HarvestCertificationForm({
	initial,
	cropSuggestions = [],
	onSuccess,
	onCancel,
	onConflict,
}: Props) {
	const isEdit = !!initial;
	const existingDocs = initial?.documents ?? [];
	const pending = usePendingFiles(existingDocs.length);
	const [apiError, setApiError] = useState<string | null>(null);
	const [progress, setProgress] = useState<number | null>(null);
	const cropListId = useId();

	const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: toDefaults(initial) });
	const { control } = form;
	const submitting = form.formState.isSubmitting;

	async function onSubmit(values: Values) {
		setApiError(null);
		if (!isEdit && pending.files.length === 0) {
			pending.setError("Anexe ao menos um laudo ou documento.");
			return;
		}

		const payload: HarvestCertificationFormValues = {
			...values,
			productionUnit: values.productionUnit as ProductionUnit,
			type: values.type as HarvestCertificationType,
			plantedAreaHectares: toApiDecimal(values.plantedAreaHectares),
			estimatedProduction: toApiDecimal(values.estimatedProduction),
		};
		const uploads = pending.uploads();

		try {
			setProgress(uploads.length ? 0 : null);
			const result = isEdit
				? await resubmitHarvestCertification(initial.id, payload, uploads, setProgress)
				: await submitHarvestCertification(payload, uploads, setProgress);
			onSuccess(result);
		} catch (e) {
			setApiError(e instanceof Error ? e.message : "Não foi possível enviar. Tente novamente.");
			if (e instanceof ApiError && e.status === 409 && isEdit) onConflict?.();
		} finally {
			setProgress(null);
		}
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8" noValidate>
				<fieldset className="space-y-4" disabled={submitting}>
					<legend className="mb-2 text-lg font-semibold text-gray-900">Safra</legend>
					<div className="grid gap-4 sm:grid-cols-[180px_1fr]">
						<FormSelectField
							control={control}
							name="harvestSeason"
							label="Ano agrícola"
							required
							options={harvestSeasonOptions(initial?.harvestSeason).map((s) => [
								s,
								s.includes("/") ? s : `${s} (ano único)`,
							])}
						/>
						<FormTextField
							control={control}
							name="crop"
							label="Cultura"
							required
							placeholder="Ex.: Tomate"
							list={cropSuggestions.length ? cropListId : undefined}
							description="Use o mesmo nome dos seus anúncios: o vínculo confere a cultura."
						/>
						{cropSuggestions.length > 0 && (
							<datalist id={cropListId}>
								{cropSuggestions.map((c) => (
									<option key={c} value={c} />
								))}
							</datalist>
						)}
					</div>
					<div className="grid gap-4 sm:grid-cols-2">
						<FormTextField control={control} name="variety" label="Variedade" placeholder="Ex.: Italiano" />
						<FormTextField
							control={control}
							name="plotIdentifier"
							label="Talhão/lote"
							required
							placeholder="Ex.: Talhão 3"
						/>
					</div>
					<div className="grid gap-4 sm:grid-cols-[1fr_1fr_120px]">
						<FormTextField
							control={control}
							name="plantedAreaHectares"
							label="Área plantada (ha)"
							required
							inputMode="decimal"
							placeholder="Ex.: 4,5"
							transform={onlyDecimal}
						/>
						<FormTextField
							control={control}
							name="estimatedProduction"
							label="Produção estimada"
							required
							inputMode="decimal"
							placeholder="Ex.: 120"
							transform={onlyDecimal}
						/>
						<FormSelectField
							control={control}
							name="productionUnit"
							label="Unidade"
							required
							placeholder="kg/t"
							options={Object.entries(PRODUCTION_UNIT_LABELS)}
						/>
					</div>
					<div className="grid gap-4 sm:grid-cols-2">
						<FormTextField control={control} name="plantingDate" label="Data de plantio" required type="date" />
						<FormTextField control={control} name="harvestDate" label="Data de colheita" required type="date" />
					</div>
				</fieldset>

				<fieldset className="space-y-4" disabled={submitting}>
					<legend className="mb-2 text-lg font-semibold text-gray-900">Certificado</legend>
					<CertificateFields
						control={control}
						typeOptions={certificationTypeOptions("harvest")}
						certifierLabel="Certificadora ou laboratório"
						cnpjLabel="CNPJ da certificadora/laboratório"
					/>
				</fieldset>

				<DocumentsField
					title="Laudos e documentos"
					existingDocs={existingDocs}
					pending={pending}
					disabled={submitting}
				/>

				<FormFooter
					apiError={apiError}
					progress={progress}
					submitting={submitting}
					isEdit={isEdit}
					onCancel={onCancel}
				/>
			</form>
		</Form>
	);
}

"use client";

import { Form } from "@/components/ui/form";
import {
	ApiError,
	FarmCertificationFormValues,
	resubmitFarmCertification,
	submitFarmCertification,
} from "@/services/farmCertifications";
import { FarmCertificationDetail, FarmCertificationType } from "@/types/types";
import { formatCnpj } from "@/utils/functions";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
	CertificateFields,
	DocumentsField,
	FormFooter,
	FormSelectField,
	FormTextField,
	certificateFieldsSchema,
	positiveDecimal,
	refineCertificateDates,
	toApiDecimal,
	toInputDecimal,
	usePendingFiles,
} from "./CertificationFormParts";
import {
	CERTIFICATION_TYPES,
	UFS,
	certificationTypeOptions,
	isoToDateInput,
} from "./certificationUtils";

const schema = z
	.object({
		farmName: z.string().trim().min(2, "Mínimo de 2 caracteres").max(120, "Máximo de 120 caracteres"),
		city: z.string().trim().min(2, "Mínimo de 2 caracteres").max(80, "Máximo de 80 caracteres"),
		uf: z.enum(UFS, { errorMap: () => ({ message: "Selecione a UF" }) }),
		ccir: z.string().trim().max(60, "Máximo de 60 caracteres"),
		car: z.string().trim().max(60, "Máximo de 60 caracteres"),
		areaHectares: positiveDecimal("Informe a área"),
		type: z.enum(CERTIFICATION_TYPES as [FarmCertificationType, ...FarmCertificationType[]], {
			errorMap: () => ({ message: "Selecione o tipo" }),
		}),
		...certificateFieldsSchema,
	})
	.superRefine((v, ctx) => {
		if (!v.ccir && !v.car) {
			ctx.addIssue({ code: "custom", path: ["ccir"], message: "Informe ao menos um: CCIR ou CAR" });
			ctx.addIssue({ code: "custom", path: ["car"], message: "Informe ao menos um: CCIR ou CAR" });
		}
		refineCertificateDates(v, ctx);
	});

type Values = z.input<typeof schema>;

type Props = {
	// Sem `initial` = envio novo (POST). Com `initial` = correção (PUT).
	initial?: FarmCertificationDetail;
	defaultCcir?: string | null;
	onSuccess: (result: FarmCertificationDetail) => void;
	onCancel: () => void;
	// 409 no modo correção: a certificação mudou (ex.: admin já avaliou)
	onConflict?: () => void;
};

function toDefaults(c?: FarmCertificationDetail, defaultCcir?: string | null): Values {
	return {
		farmName: c?.farmName ?? "",
		city: c?.city ?? "",
		uf: (c?.uf ?? "") as Values["uf"],
		ccir: c?.ccir ?? defaultCcir ?? "",
		car: c?.car ?? "",
		areaHectares: c ? toInputDecimal(c.areaHectares) : "",
		type: (c?.type ?? "") as Values["type"],
		certifierName: c?.certifierName ?? "",
		certifierCnpj: c?.certifierCnpj ? formatCnpj(c.certifierCnpj) : "",
		certificateNumber: c?.certificateNumber ?? "",
		issuedAt: c ? isoToDateInput(c.issuedAt) : "",
		validUntil: c ? isoToDateInput(c.validUntil) : "",
	};
}

export default function FarmCertificationForm({ initial, defaultCcir, onSuccess, onCancel, onConflict }: Props) {
	const isEdit = !!initial;
	const existingDocs = initial?.documents ?? [];
	const pending = usePendingFiles(existingDocs.length);
	const [apiError, setApiError] = useState<string | null>(null);
	const [progress, setProgress] = useState<number | null>(null);

	const form = useForm<Values>({
		resolver: zodResolver(schema),
		defaultValues: toDefaults(initial, defaultCcir),
	});
	const { control } = form;

	// CCIR do perfil chega depois do primeiro render: preenche só se o campo ainda estiver vazio
	useEffect(() => {
		if (!isEdit && defaultCcir && !form.getValues("ccir")) form.setValue("ccir", defaultCcir);
	}, [defaultCcir, isEdit, form]);

	const submitting = form.formState.isSubmitting;

	async function onSubmit(values: Values) {
		setApiError(null);
		if (!isEdit && pending.files.length === 0) {
			pending.setError("Anexe ao menos um documento.");
			return;
		}

		const payload: FarmCertificationFormValues = {
			...values,
			type: values.type as FarmCertificationType,
			areaHectares: toApiDecimal(values.areaHectares),
		};
		const uploads = pending.uploads();

		try {
			setProgress(uploads.length ? 0 : null);
			const result = isEdit
				? await resubmitFarmCertification(initial.id, payload, uploads, setProgress)
				: await submitFarmCertification(payload, uploads, setProgress);
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
					<legend className="mb-2 text-lg font-semibold text-gray-900">Fazenda</legend>
					<FormTextField control={control} name="farmName" label="Nome da fazenda" required />
					<div className="grid gap-4 sm:grid-cols-[1fr_140px]">
						<FormTextField control={control} name="city" label="Município" required />
						<FormSelectField
							control={control}
							name="uf"
							label="UF"
							required
							placeholder="UF"
							options={UFS.map((uf) => [uf, uf])}
						/>
					</div>
					<div className="grid gap-4 sm:grid-cols-3">
						<FormTextField control={control} name="ccir" label="CCIR" />
						<FormTextField control={control} name="car" label="CAR" />
						<FormTextField
							control={control}
							name="areaHectares"
							label="Área (ha)"
							required
							inputMode="decimal"
							placeholder="Ex.: 12,5"
							transform={(v) => v.replace(/[^\d.,]/g, "")}
						/>
					</div>
					<p className="text-xs text-gray-500">Informe ao menos um: CCIR ou CAR.</p>
				</fieldset>

				<fieldset className="space-y-4" disabled={submitting}>
					<legend className="mb-2 text-lg font-semibold text-gray-900">Certificado</legend>
					<CertificateFields control={control} typeOptions={certificationTypeOptions("farm")} />
				</fieldset>

				<DocumentsField existingDocs={existingDocs} pending={pending} disabled={submitting} />

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

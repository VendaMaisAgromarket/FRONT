"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { isValidCnpj } from "@/lib/validation";
import {
	ApiError,
	FarmCertificationFormValues,
	resubmitFarmCertification,
	submitFarmCertification,
} from "@/services/farmCertifications";
import {
	FarmCertificationDetail,
	FarmCertificationDocType,
	FarmCertificationType,
} from "@/types/types";
import { formatCnpj } from "@/utils/functions";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, FileText, LoaderCircle, Upload, X } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
	ACCEPTED_EXTENSIONS,
	CERTIFICATION_TYPE_LABELS,
	CERTIFICATION_TYPES,
	DOC_TYPE_LABELS,
	DOC_TYPES,
	MAX_FILES_PER_UPLOAD,
	MAX_FILES_TOTAL,
	MAX_FILE_BYTES,
	UFS,
	formatFileSize,
	isAcceptedFile,
	isoToDateInput,
	todayKey,
} from "./certificationUtils";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const schema = z
	.object({
		farmName: z.string().trim().min(2, "Mínimo de 2 caracteres").max(120, "Máximo de 120 caracteres"),
		city: z.string().trim().min(2, "Mínimo de 2 caracteres").max(80, "Máximo de 80 caracteres"),
		uf: z.enum(UFS, { errorMap: () => ({ message: "Selecione a UF" }) }),
		ccir: z.string().trim().max(60, "Máximo de 60 caracteres"),
		car: z.string().trim().max(60, "Máximo de 60 caracteres"),
		areaHectares: z
			.string()
			.trim()
			.min(1, "Informe a área")
			.refine((v) => {
				const n = Number(v.replace(",", "."));
				return Number.isFinite(n) && n > 0;
			}, "Informe um número maior que zero"),
		type: z.enum(CERTIFICATION_TYPES as [FarmCertificationType, ...FarmCertificationType[]], {
			errorMap: () => ({ message: "Selecione o tipo" }),
		}),
		certifierName: z.string().trim().min(2, "Mínimo de 2 caracteres").max(120, "Máximo de 120 caracteres"),
		certifierCnpj: z.string().refine(isValidCnpj, "CNPJ inválido"),
		certificateNumber: z.string().trim().min(1, "Informe o número").max(80, "Máximo de 80 caracteres"),
		issuedAt: z
			.string()
			.regex(DATE_RE, "Informe a data de emissão")
			.refine((v) => v <= todayKey(), "A emissão não pode ser uma data futura"),
		validUntil: z
			.string()
			.regex(DATE_RE, "Informe a validade")
			.refine((v) => v >= todayKey(), "O certificado está vencido"),
	})
	.superRefine((v, ctx) => {
		if (!v.ccir && !v.car) {
			ctx.addIssue({ code: "custom", path: ["ccir"], message: "Informe ao menos um: CCIR ou CAR" });
			ctx.addIssue({ code: "custom", path: ["car"], message: "Informe ao menos um: CCIR ou CAR" });
		}
		if (DATE_RE.test(v.issuedAt) && DATE_RE.test(v.validUntil) && v.validUntil <= v.issuedAt) {
			ctx.addIssue({
				code: "custom",
				path: ["validUntil"],
				message: "A validade precisa ser posterior à emissão",
			});
		}
	});

type Values = z.input<typeof schema>;

type PendingFile = { key: string; file: File; docType: FarmCertificationDocType };

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
		areaHectares: c ? String(Number(c.areaHectares)).replace(".", ",") : "",
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
	const [files, setFiles] = useState<PendingFile[]>([]);
	const [fileError, setFileError] = useState<string | null>(null);
	const [apiError, setApiError] = useState<string | null>(null);
	const [progress, setProgress] = useState<number | null>(null);
	const [dragOver, setDragOver] = useState(false);
	const inputId = useId();

	const form = useForm<Values>({
		resolver: zodResolver(schema),
		defaultValues: toDefaults(initial, defaultCcir),
	});

	// CCIR do perfil chega depois do primeiro render: preenche só se o campo ainda estiver vazio
	useEffect(() => {
		if (!isEdit && defaultCcir && !form.getValues("ccir")) form.setValue("ccir", defaultCcir);
	}, [defaultCcir, isEdit, form]);

	const submitting = form.formState.isSubmitting;
	const remainingTotal = MAX_FILES_TOTAL - existingDocs.length;

	function addFiles(list: FileList | File[]) {
		const incoming = Array.from(list);
		const errors: string[] = [];
		const accepted: PendingFile[] = [];
		const limit = Math.min(MAX_FILES_PER_UPLOAD, remainingTotal);

		for (const file of incoming) {
			if (!isAcceptedFile(file)) {
				errors.push(`"${file.name}": formato não aceito (use PDF, JPG, PNG ou WEBP).`);
				continue;
			}
			if (file.size > MAX_FILE_BYTES) {
				errors.push(`"${file.name}": maior que 10 MB.`);
				continue;
			}
			if (files.length + accepted.length >= limit) {
				errors.push(
					limit === remainingTotal && remainingTotal < MAX_FILES_PER_UPLOAD
						? `Limite de ${MAX_FILES_TOTAL} documentos por certificação atingido.`
						: `Envie no máximo ${MAX_FILES_PER_UPLOAD} arquivos por vez.`
				);
				break;
			}
			accepted.push({ key: crypto.randomUUID(), file, docType: "CERTIFICATE" });
		}

		setFiles((prev) => [...prev, ...accepted]);
		setFileError(errors.length ? errors.join(" ") : null);
	}

	function removeFile(key: string) {
		setFiles((prev) => prev.filter((f) => f.key !== key));
		setFileError(null);
	}

	function setDocType(key: string, docType: FarmCertificationDocType) {
		setFiles((prev) => prev.map((f) => (f.key === key ? { ...f, docType } : f)));
	}

	async function onSubmit(values: Values) {
		setApiError(null);
		if (!isEdit && files.length === 0) {
			setFileError("Anexe ao menos um documento.");
			return;
		}

		const payload: FarmCertificationFormValues = {
			...values,
			type: values.type as FarmCertificationType,
			areaHectares: values.areaHectares.trim().replace(",", "."),
		};
		const uploads = files.map(({ file, docType }) => ({ file, docType }));

		try {
			setProgress(uploads.length ? 0 : null);
			const result = isEdit
				? await resubmitFarmCertification(initial.id, payload, uploads, setProgress)
				: await submitFarmCertification(payload, uploads, setProgress);
			onSuccess(result);
		} catch (e) {
			const msg = e instanceof Error ? e.message : "Não foi possível enviar. Tente novamente.";
			setApiError(msg);
			if (e instanceof ApiError && e.status === 409 && isEdit) onConflict?.();
		} finally {
			setProgress(null);
		}
	}

	const textField = (
		name: keyof Values,
		label: string,
		opts: { required?: boolean; placeholder?: string; type?: string; inputMode?: "decimal"; max?: string; transform?: (v: string) => string } = {}
	) => (
		<FormField
			control={form.control}
			name={name}
			render={({ field }) => (
				<FormItem>
					<FormLabel>
						{label} {opts.required && <span className="text-red-500">*</span>}
					</FormLabel>
					<FormControl>
						<Input
							{...field}
							type={opts.type ?? "text"}
							inputMode={opts.inputMode}
							placeholder={opts.placeholder}
							max={opts.max}
							onChange={(e) => field.onChange(opts.transform ? opts.transform(e.target.value) : e.target.value)}
						/>
					</FormControl>
					<FormMessage />
				</FormItem>
			)}
		/>
	);

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8" noValidate>
				{/* Fazenda */}
				<fieldset className="space-y-4" disabled={submitting}>
					<legend className="mb-2 text-lg font-semibold text-gray-900">Fazenda</legend>
					{textField("farmName", "Nome da fazenda", { required: true })}
					<div className="grid gap-4 sm:grid-cols-[1fr_140px]">
						{textField("city", "Município", { required: true })}
						<FormField
							control={form.control}
							name="uf"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										UF <span className="text-red-500">*</span>
									</FormLabel>
									<Select value={field.value} onValueChange={field.onChange}>
										<FormControl>
											<SelectTrigger className="w-full">
												<SelectValue placeholder="UF" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{UFS.map((uf) => (
												<SelectItem key={uf} value={uf}>
													{uf}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>
					<div className="grid gap-4 sm:grid-cols-3">
						{textField("ccir", "CCIR")}
						{textField("car", "CAR")}
						{textField("areaHectares", "Área (ha)", {
							required: true,
							inputMode: "decimal",
							placeholder: "Ex.: 12,5",
							transform: (v) => v.replace(/[^\d.,]/g, ""),
						})}
					</div>
					<p className="text-xs text-gray-500">Informe ao menos um: CCIR ou CAR.</p>
				</fieldset>

				{/* Certificado */}
				<fieldset className="space-y-4" disabled={submitting}>
					<legend className="mb-2 text-lg font-semibold text-gray-900">Certificado</legend>
					<FormField
						control={form.control}
						name="type"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									Tipo <span className="text-red-500">*</span>
								</FormLabel>
								<Select value={field.value} onValueChange={field.onChange}>
									<FormControl>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="Selecione o tipo" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{CERTIFICATION_TYPES.map((t) => (
											<SelectItem key={t} value={t}>
												{CERTIFICATION_TYPE_LABELS[t]}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>
					<div className="grid gap-4 sm:grid-cols-2">
						{textField("certifierName", "Certificadora", { required: true })}
						{textField("certifierCnpj", "CNPJ da certificadora", {
							required: true,
							placeholder: "00.000.000/0000-00",
							transform: formatCnpj,
						})}
					</div>
					{textField("certificateNumber", "Número do certificado", { required: true })}
					<div className="grid gap-4 sm:grid-cols-2">
						{textField("issuedAt", "Data de emissão", { required: true, type: "date", max: todayKey() })}
						{textField("validUntil", "Validade", { required: true, type: "date" })}
					</div>
				</fieldset>

				{/* Documentos */}
				<fieldset className="space-y-4" disabled={submitting}>
					<legend className="mb-2 text-lg font-semibold text-gray-900">Documentos</legend>

					{isEdit && existingDocs.length > 0 && (
						<div className="space-y-2">
							<p className="text-sm text-gray-600">Já enviados (não podem ser removidos):</p>
							<ul className="divide-y rounded-md border bg-gray-50">
								{existingDocs.map((d) => (
									<li key={d.id} className="flex items-center gap-3 p-3 text-sm">
										<FileText className="size-4 shrink-0 text-gray-500" />
										<span className="min-w-0 flex-1 truncate">{d.originalName}</span>
										<span className="text-xs text-gray-500">
											{DOC_TYPE_LABELS[d.docType]} · {formatFileSize(d.sizeBytes)}
										</span>
									</li>
								))}
							</ul>
						</div>
					)}

					{remainingTotal > 0 ? (
						<label
							htmlFor={inputId}
							onDragOver={(e) => {
								e.preventDefault();
								setDragOver(true);
							}}
							onDragLeave={() => setDragOver(false)}
							onDrop={(e) => {
								e.preventDefault();
								setDragOver(false);
								if (!submitting) addFiles(e.dataTransfer.files);
							}}
							className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
								dragOver ? "border-primary bg-primary/5" : "border-gray-300 hover:bg-gray-50"
							}`}
						>
							<Upload className="size-6 text-gray-500" />
							<span className="text-sm font-medium text-gray-800">
								Arraste os arquivos aqui ou clique para selecionar
							</span>
							<span className="text-xs text-gray-500">
								PDF, JPG, PNG ou WEBP · até 10 MB cada · até {MAX_FILES_PER_UPLOAD} por envio
								{isEdit ? ` · ${remainingTotal} restante(s) nesta certificação` : ""}
							</span>
							<input
								id={inputId}
								type="file"
								multiple
								accept={ACCEPTED_EXTENSIONS.join(",")}
								className="sr-only"
								onChange={(e) => {
									if (e.target.files) addFiles(e.target.files);
									e.target.value = "";
								}}
							/>
						</label>
					) : (
						<p className="text-sm text-gray-600">
							Limite de {MAX_FILES_TOTAL} documentos atingido para esta certificação.
						</p>
					)}

					{fileError && <p className="text-sm text-destructive">{fileError}</p>}

					{files.length > 0 && (
						<ul className="divide-y rounded-md border">
							{files.map((f) => (
								<li key={f.key} className="flex flex-wrap items-center gap-3 p-3">
									<FileText className="size-4 shrink-0 text-gray-500" />
									<div className="min-w-0 flex-1">
										<p className="truncate text-sm font-medium" title={f.file.name}>
											{f.file.name}
										</p>
										<p className="text-xs text-gray-500">{formatFileSize(f.file.size)}</p>
									</div>
									<Select
										value={f.docType}
										onValueChange={(v) => setDocType(f.key, v as FarmCertificationDocType)}
										disabled={submitting}
									>
										<SelectTrigger className="w-44" aria-label={`Tipo de ${f.file.name}`}>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{DOC_TYPES.map((t) => (
												<SelectItem key={t} value={t}>
													{DOC_TYPE_LABELS[t]}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<Button
										type="button"
										variant="ghost"
										size="icon"
										onClick={() => removeFile(f.key)}
										aria-label={`Remover ${f.file.name}`}
									>
										<X className="size-4" />
									</Button>
								</li>
							))}
						</ul>
					)}
				</fieldset>

				{apiError && (
					<Alert variant="destructive">
						<AlertCircle className="size-4" />
						<AlertDescription>{apiError}</AlertDescription>
					</Alert>
				)}

				{progress !== null && (
					<div className="space-y-1" aria-live="polite">
						<div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
							<div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
						</div>
						<p className="text-xs text-gray-600">
							{progress < 100 ? `Enviando arquivos… ${progress}%` : "Processando…"}
						</p>
					</div>
				)}

				<div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
					<Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
						Cancelar
					</Button>
					<Button type="submit" disabled={submitting}>
						{submitting && <LoaderCircle className="size-4 animate-spin" />}
						{isEdit ? "Corrigir e reenviar" : "Enviar para análise"}
					</Button>
				</div>
			</form>
		</Form>
	);
}

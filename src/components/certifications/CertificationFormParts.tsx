"use client";

// Peças comuns aos formulários de certificação (fazenda e safra): campos do certificado,
// upload de documentos, progresso e rodapé.

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { isValidCnpj } from "@/lib/validation";
import { UploadFile } from "@/services/certifications";
import { CertificationDocType, CertificationDocument } from "@/types/types";
import { formatCnpj } from "@/utils/functions";
import { AlertCircle, FileText, LoaderCircle, Upload, X } from "lucide-react";
import { ReactNode, useId, useState } from "react";
import { Control, FieldPath, FieldValues } from "react-hook-form";
import { z } from "zod";
import {
	ACCEPTED_EXTENSIONS,
	DOC_TYPE_LABELS,
	DOC_TYPES,
	MAX_FILES_PER_UPLOAD,
	MAX_FILES_TOTAL,
	MAX_FILE_BYTES,
	formatFileSize,
	isAcceptedFile,
	todayKey,
} from "./certificationUtils";

// ---------- Validação ----------

export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function positiveDecimal(emptyMessage: string) {
	return z
		.string()
		.trim()
		.min(1, emptyMessage)
		.refine((v) => {
			const n = Number(v.replace(",", "."));
			return Number.isFinite(n) && n > 0;
		}, "Informe um número maior que zero");
}

export function requiredDate(emptyMessage: string) {
	return z.string().regex(DATE_RE, emptyMessage);
}

// "12,5" → "12.5" (a API exige ponto decimal)
export function toApiDecimal(v: string) {
	return v.trim().replace(",", ".");
}

// "12.5" (do banco) → "12,5" (para o input)
export function toInputDecimal(v: string | number) {
	return String(Number(v)).replace(".", ",");
}

// Campos do certificado, iguais na fazenda e na safra
export const certificateFieldsSchema = {
	certifierName: z.string().trim().min(2, "Mínimo de 2 caracteres").max(120, "Máximo de 120 caracteres"),
	certifierCnpj: z.string().refine(isValidCnpj, "CNPJ inválido"),
	certificateNumber: z.string().trim().min(1, "Informe o número").max(80, "Máximo de 80 caracteres"),
	issuedAt: requiredDate("Informe a data de emissão").refine(
		(v) => v <= todayKey(),
		"A emissão não pode ser uma data futura"
	),
	validUntil: requiredDate("Informe a validade").refine((v) => v >= todayKey(), "O certificado está vencido"),
};

export function refineCertificateDates(v: { issuedAt: string; validUntil: string }, ctx: z.RefinementCtx) {
	if (DATE_RE.test(v.issuedAt) && DATE_RE.test(v.validUntil) && v.validUntil <= v.issuedAt) {
		ctx.addIssue({ code: "custom", path: ["validUntil"], message: "A validade precisa ser posterior à emissão" });
	}
}

// ---------- Campos ----------

type TextFieldProps<T extends FieldValues> = {
	control: Control<T>;
	name: FieldPath<T>;
	label: string;
	required?: boolean;
	placeholder?: string;
	type?: string;
	inputMode?: "decimal" | "text";
	max?: string;
	min?: string;
	list?: string;
	transform?: (v: string) => string;
	description?: ReactNode;
};

export function FormTextField<T extends FieldValues>(p: TextFieldProps<T>) {
	return (
		<FormField
			control={p.control}
			name={p.name}
			render={({ field }) => (
				<FormItem>
					<FormLabel>
						{p.label} {p.required && <span className="text-red-500">*</span>}
					</FormLabel>
					<FormControl>
						<Input
							{...field}
							value={field.value ?? ""}
							type={p.type ?? "text"}
							inputMode={p.inputMode}
							placeholder={p.placeholder}
							max={p.max}
							min={p.min}
							list={p.list}
							onChange={(e) => field.onChange(p.transform ? p.transform(e.target.value) : e.target.value)}
						/>
					</FormControl>
					{p.description && <p className="text-xs text-gray-500">{p.description}</p>}
					<FormMessage />
				</FormItem>
			)}
		/>
	);
}

type SelectFieldProps<T extends FieldValues> = {
	control: Control<T>;
	name: FieldPath<T>;
	label: string;
	required?: boolean;
	placeholder?: string;
	options: [string, string][]; // [valor, rótulo]
	triggerClassName?: string;
};

export function FormSelectField<T extends FieldValues>(p: SelectFieldProps<T>) {
	return (
		<FormField
			control={p.control}
			name={p.name}
			render={({ field }) => (
				<FormItem>
					<FormLabel>
						{p.label} {p.required && <span className="text-red-500">*</span>}
					</FormLabel>
					<Select value={field.value} onValueChange={field.onChange}>
						<FormControl>
							<SelectTrigger className={p.triggerClassName ?? "w-full"}>
								<SelectValue placeholder={p.placeholder ?? "Selecione"} />
							</SelectTrigger>
						</FormControl>
						<SelectContent>
							{p.options.map(([value, label]) => (
								<SelectItem key={value} value={value}>
									{label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<FormMessage />
				</FormItem>
			)}
		/>
	);
}

type CertificateFieldValues = {
	type: string;
	certifierName: string;
	certifierCnpj: string;
	certificateNumber: string;
	issuedAt: string;
	validUntil: string;
};

// Seção "Certificado": tipo, certificadora, CNPJ, número, emissão e validade
export function CertificateFields<T extends FieldValues & CertificateFieldValues>({
	control,
	typeOptions,
	certifierLabel = "Certificadora",
	cnpjLabel = "CNPJ da certificadora",
}: {
	control: Control<T>;
	typeOptions: [string, string][];
	certifierLabel?: string;
	cnpjLabel?: string;
}) {
	const n = (name: keyof CertificateFieldValues) => name as FieldPath<T>;
	return (
		<>
			<FormSelectField
				control={control}
				name={n("type")}
				label="Tipo"
				required
				placeholder="Selecione o tipo"
				options={typeOptions}
			/>
			<div className="grid gap-4 sm:grid-cols-2">
				<FormTextField control={control} name={n("certifierName")} label={certifierLabel} required />
				<FormTextField
					control={control}
					name={n("certifierCnpj")}
					label={cnpjLabel}
					required
					placeholder="00.000.000/0000-00"
					transform={formatCnpj}
				/>
			</div>
			<FormTextField control={control} name={n("certificateNumber")} label="Número do certificado" required />
			<div className="grid gap-4 sm:grid-cols-2">
				<FormTextField
					control={control}
					name={n("issuedAt")}
					label="Data de emissão"
					required
					type="date"
					max={todayKey()}
				/>
				<FormTextField control={control} name={n("validUntil")} label="Validade" required type="date" />
			</div>
		</>
	);
}

// ---------- Documentos ----------

type PendingFile = { key: string; file: File; docType: CertificationDocType };

// Arquivos novos a enviar, com os limites do back (10 MB, 5 por envio, 15 no total)
export function usePendingFiles(existingCount: number) {
	const [files, setFiles] = useState<PendingFile[]>([]);
	const [error, setError] = useState<string | null>(null);
	const remainingTotal = MAX_FILES_TOTAL - existingCount;

	function add(list: FileList | File[]) {
		const errors: string[] = [];
		const accepted: PendingFile[] = [];
		const limit = Math.min(MAX_FILES_PER_UPLOAD, remainingTotal);

		for (const file of Array.from(list)) {
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
		setError(errors.length ? errors.join(" ") : null);
	}

	return {
		files,
		error,
		setError,
		remainingTotal,
		add,
		remove: (key: string) => {
			setFiles((prev) => prev.filter((f) => f.key !== key));
			setError(null);
		},
		setDocType: (key: string, docType: CertificationDocType) =>
			setFiles((prev) => prev.map((f) => (f.key === key ? { ...f, docType } : f))),
		uploads: (): UploadFile[] => files.map(({ file, docType }) => ({ file, docType })),
	};
}

export function DocumentsField({
	title = "Documentos",
	existingDocs,
	pending,
	disabled,
}: {
	title?: string;
	existingDocs: CertificationDocument[];
	pending: ReturnType<typeof usePendingFiles>;
	disabled: boolean;
}) {
	const [dragOver, setDragOver] = useState(false);
	const inputId = useId();
	const isEdit = existingDocs.length > 0;

	return (
		<fieldset className="space-y-4" disabled={disabled}>
			<legend className="mb-2 text-lg font-semibold text-gray-900">{title}</legend>

			{isEdit && (
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

			{pending.remainingTotal > 0 ? (
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
						if (!disabled) pending.add(e.dataTransfer.files);
					}}
					// O input real é sr-only: o foco do teclado aparece como anel no rótulo
					className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/40 focus-within:ring-offset-2 ${
						dragOver ? "border-primary bg-primary/5" : "border-gray-300 hover:bg-gray-50"
					}`}
				>
					<Upload className="size-6 text-gray-500" />
					<span className="text-sm font-medium text-gray-800">
						Arraste os arquivos aqui ou clique para selecionar
					</span>
					<span className="text-xs text-gray-500">
						PDF, JPG, PNG ou WEBP · até 10 MB cada · até {MAX_FILES_PER_UPLOAD} por envio
						{isEdit ? ` · ${pending.remainingTotal} restante(s) nesta certificação` : ""}
					</span>
					<input
						id={inputId}
						type="file"
						multiple
						accept={ACCEPTED_EXTENSIONS.join(",")}
						className="sr-only"
						onChange={(e) => {
							if (e.target.files) pending.add(e.target.files);
							e.target.value = "";
						}}
					/>
				</label>
			) : (
				<p className="text-sm text-gray-600">
					Limite de {MAX_FILES_TOTAL} documentos atingido para esta certificação.
				</p>
			)}

			{pending.error && <p className="text-sm text-destructive">{pending.error}</p>}

			{pending.files.length > 0 && (
				<ul className="divide-y rounded-md border">
					{pending.files.map((f) => (
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
								onValueChange={(v) => pending.setDocType(f.key, v as CertificationDocType)}
								disabled={disabled}
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
								onClick={() => pending.remove(f.key)}
								aria-label={`Remover ${f.file.name}`}
							>
								<X className="size-4" />
							</Button>
						</li>
					))}
				</ul>
			)}
		</fieldset>
	);
}

// ---------- Rodapé: erro da API, progresso do upload e botões ----------

export function FormFooter({
	apiError,
	progress,
	submitting,
	isEdit,
	onCancel,
}: {
	apiError: string | null;
	progress: number | null;
	submitting: boolean;
	isEdit: boolean;
	onCancel: () => void;
}) {
	return (
		<>
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
		</>
	);
}

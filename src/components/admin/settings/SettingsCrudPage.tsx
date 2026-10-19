"use client";

import { SettingsMutationResult, SettingsResource } from "@/actions/adminSettings";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import useSettingsCrud from "@/hooks/useSettingsCrud";
import { AlertCircle, Lock, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { ReactNode, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

export type FormValues = Record<string, string>;
export type FormMode = "create" | "edit";

/** Erro exibido no formulário: `title` nomeia o problema, `description` diz o que fazer. */
export type SettingsError = { title: string; description: string };

export type ValidationContext<T> = {
	items: T[];
	/** Registro em edição (null na criação) — usado para ignorá-lo na checagem de duplicidade. */
	editing: T | null;
};

export type SettingsField = {
	name: string;
	label: string;
	type?: "text" | "email" | "password" | "number" | "select";
	options?: { value: string; label: string }[];
	placeholder?: string;
	helper?: string | ((mode: FormMode) => string | undefined);
	/** Campo obrigatório: sempre, ou só na criação. */
	required?: boolean | "create";
	/** Mostra o campo só em um dos modos. */
	only?: FormMode;
	/** Na edição o campo é só exibido (não editável) e não deve ir no payload. */
	lockedOnEdit?: boolean;
	mask?: (value: string) => string;
};

export type SettingsColumn<T> = {
	header: string;
	render: (item: T) => ReactNode;
	className?: string;
};

export type SettingsCrudConfig<T> = {
	resource: SettingsResource;
	title: string;
	description: string;
	/** Nome no singular, usado nos títulos dos modais ("Novo <singular>"). */
	singular: string;
	newLabel: string;
	columns: SettingsColumn<T>[];
	fields: SettingsField[];
	getId: (item: T) => string;
	getLabel: (item: T) => string;
	searchText: (item: T) => string;
	toForm: (item: T | null) => FormValues;
	toPayload: (values: FormValues, mode: FormMode) => Record<string, unknown>;
	validate?: (
		values: FormValues,
		mode: FormMode,
		ctx: ValidationContext<T>
	) => SettingsError | null;
	canDelete?: (item: T, currentUserId: string) => boolean;
	/** Possível vínculo que impede a exclusão — citado como causa provável quando o back responde 500. */
	inUseDescription: string;
	sortBy?: (a: T, b: T) => number;
};

// Mensagens de validação devolvidas pelo back (400) → título do erro.
// A descrição exibida é a própria mensagem do back.
const BACK_ERROR_TITLES: [match: string, title: string][] = [
	["CPF já cadastrado", "CPF já cadastrado"],
	["CNPJ já cadastrado", "CNPJ já cadastrado"],
	["Email já cadastrado", "E-mail já cadastrado"],
	["CPF ou CNPJ é obrigatório", "CPF ou CNPJ obrigatório"],
	["CPF inválido", "CPF inválido"],
	["CNPJ inválido", "CNPJ inválido"],
	["senha", "Senha fora do padrão"],
	["Perfil inválido", "Perfil inválido"],
	["Já existe uma unidade", "Sigla já cadastrada"],
	["Não é possível deletar", "Registro em uso"],
	["obrigatório", "Campo obrigatório"],
	["não pode ser vazio", "Campo obrigatório"],
];

const SESSION_EXPIRED: SettingsError = {
	title: "Sessão expirada",
	description: "Faça login novamente para continuar.",
};
const FORBIDDEN: SettingsError = {
	title: "Acesso negado",
	description: "Seu usuário não tem permissão de administrador para esta ação.",
};
const CONNECTION_ERROR: SettingsError = {
	title: "Falha de conexão",
	description: "Não foi possível falar com o servidor. Verifique sua internet e tente novamente.",
};

// Falhas transitórias (limite de requisições / servidor fora do ar): vale tentar de novo.
function transientError(status: number): SettingsError | null {
	if (status === 429) {
		return {
			title: "Muitas requisições",
			description: "O servidor recebeu muitas requisições em pouco tempo. Aguarde alguns segundos e tente novamente.",
		};
	}
	if (status === 502 || status === 503 || status === 504) {
		return {
			title: "Servidor indisponível",
			description: `O servidor está temporariamente fora do ar (código ${status}). Tente novamente em instantes.`,
		};
	}
	return null;
}

function listError(status: number): SettingsError {
	if (status === 401) return SESSION_EXPIRED;
	if (status === 403) return FORBIDDEN;
	return (
		transientError(status) ?? {
			title: "Erro ao carregar a lista",
			description: `O servidor não respondeu corretamente (código ${status}). Tente novamente mais tarde.`,
		}
	);
}

function mutationError(
	result: Extract<SettingsMutationResult, { ok: false }>,
	action: "salvar" | "excluir",
	inUseDescription: string
): SettingsError {
	if (result.status === 401) return SESSION_EXPIRED;
	if (result.status === 403) return FORBIDDEN;
	if (result.status === 404) {
		return {
			title: "Registro não encontrado",
			description: "Ele pode ter sido excluído por outro administrador. Feche e atualize a lista.",
		};
	}
	if (result.status === 400 || result.status === 409) {
		const match = result.error
			? BACK_ERROR_TITLES.find(([text]) => result.error!.toLowerCase().includes(text.toLowerCase()))
			: undefined;
		return {
			title: match?.[1] ?? "Dados inválidos",
			description: result.error ?? "Revise os campos preenchidos e tente novamente.",
		};
	}
	const transient = transientError(result.status);
	if (transient) return transient;
	// 500 na exclusão: o back não diferencia vínculo (chave estrangeira) de outras falhas,
	// então o vínculo é citado só como causa provável, junto com a orientação de tentar de novo.
	if (action === "excluir") {
		return {
			title: "Não foi possível excluir",
			description: `Causa provável: ${inUseDescription} Se não for o caso, tente novamente em instantes (código ${result.status}).`,
		};
	}
	return {
		title: "Erro no servidor",
		description: `O servidor não conseguiu salvar (código ${result.status}). Tente novamente; se persistir, contate o suporte.`,
	};
}

export default function SettingsCrudPage<T>({ config }: { config: SettingsCrudConfig<T> }) {
	const {
		result,
		isLoading,
		isError,
		isFetching,
		refetch,
		createMutation,
		updateMutation,
		deleteMutation,
	} = useSettingsCrud<T>(config.resource);

	const [search, setSearch] = useState("");
	const [mode, setMode] = useState<FormMode | null>(null);
	const [editing, setEditing] = useState<T | null>(null);
	const [values, setValues] = useState<FormValues>({});
	const [formError, setFormError] = useState<SettingsError | null>(null);
	const [confirmDelete, setConfirmDelete] = useState(false);
	// Identifica a instância do formulário aberta: respostas de uma requisição só
	// são aplicadas se o formulário que a disparou ainda for o atual.
	const formInstance = useRef(0);

	const items = useMemo(() => {
		if (!result?.ok) return [];
		const term = search.trim().toLowerCase();
		const filtered = term
			? result.data.filter((item) => config.searchText(item).toLowerCase().includes(term))
			: result.data;
		return config.sortBy ? [...filtered].sort(config.sortBy) : filtered;
	}, [result, search, config]);

	const currentUserId = result?.ok ? result.currentUserId : "";
	const isSaving = createMutation.isPending || updateMutation.isPending;
	const isBusy = isSaving || deleteMutation.isPending;
	const visibleFields = config.fields.filter((f) => !f.only || f.only === mode);

	function openCreate() {
		formInstance.current += 1;
		setEditing(null);
		setValues(config.toForm(null));
		setFormError(null);
		setMode("create");
	}

	function openEdit(item: T) {
		formInstance.current += 1;
		setEditing(item);
		setValues(config.toForm(item));
		setFormError(null);
		setMode("edit");
	}

	function closeForm() {
		formInstance.current += 1;
		setMode(null);
		setEditing(null);
		setConfirmDelete(false);
	}

	function setField(field: SettingsField, raw: string) {
		const value = field.mask ? field.mask(raw) : raw;
		setValues((prev) => ({ ...prev, [field.name]: value }));
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!mode) return;

		const missing = visibleFields.find(
			(f) =>
				!(f.lockedOnEdit && mode === "edit") &&
				(f.required === true || (f.required === "create" && mode === "create")) &&
				!values[f.name]?.trim()
		);
		if (missing) {
			setFormError({
				title: "Campo obrigatório",
				description: `Preencha o campo "${missing.label}".`,
			});
			return;
		}
		const customError = config.validate?.(values, mode, {
			items: result?.ok ? result.data : [],
			editing,
		});
		if (customError) {
			setFormError(customError);
			return;
		}

		const body = config.toPayload(values, mode);
		const instance = formInstance.current;
		let res: SettingsMutationResult;
		try {
			res =
				mode === "create"
					? await createMutation.mutateAsync(body)
					: await updateMutation.mutateAsync({ id: config.getId(editing as T), body });
		} catch {
			res = { ok: false, status: 0 };
		}
		if (instance !== formInstance.current) return;

		if (!res.ok && res.status === 0) {
			setFormError(CONNECTION_ERROR);
			return;
		}
		if (!res.ok) {
			setFormError(mutationError(res, "salvar", config.inUseDescription));
			return;
		}

		toast.success(
			mode === "create" ? `${config.singular} adicionado com sucesso.` : "Alterações salvas."
		);
		closeForm();
	}

	async function handleDelete() {
		if (!editing) return;
		const instance = formInstance.current;
		let res: SettingsMutationResult;
		try {
			res = await deleteMutation.mutateAsync(config.getId(editing));
		} catch {
			res = { ok: false, status: 0 };
		}
		if (instance !== formInstance.current) return;
		setConfirmDelete(false);
		if (!res.ok) {
			setFormError(
				res.status === 0
					? CONNECTION_ERROR
					: mutationError(res, "excluir", config.inUseDescription)
			);
			return;
		}
		toast.success(`${config.singular} excluído.`);
		closeForm();
	}

	function renderField(field: SettingsField) {
		const id = `settings-${field.name}`;
		const helper = typeof field.helper === "function" ? field.helper(mode!) : field.helper;
		const isRequired =
			field.required === true || (field.required === "create" && mode === "create");

		if (field.lockedOnEdit && mode === "edit") {
			const raw = values[field.name] ?? "";
			const display =
				field.type === "select"
					? field.options?.find((opt) => opt.value === raw)?.label ?? raw
					: raw;
			return (
				<div key={field.name} className="space-y-1.5">
					<Label htmlFor={id} className="text-muted-foreground">
						{field.label}
					</Label>
					<div
						id={id}
						className="flex h-9 items-center justify-between gap-2 rounded-md border border-dashed border-border bg-muted/50 px-3 text-sm"
						title="Este campo não pode ser alterado"
					>
						<span className={display ? "text-foreground" : "text-muted-foreground"}>
							{display || "Não informado"}
						</span>
						<Lock size={14} className="shrink-0 text-muted-foreground" />
					</div>
				</div>
			);
		}

		return (
			<div key={field.name} className="space-y-1.5">
				<Label htmlFor={id}>
					{field.label}
					{isRequired && <span className="text-destructive">*</span>}
				</Label>
				{field.type === "select" ? (
					<Select
						value={values[field.name] ?? ""}
						onValueChange={(v) => setField(field, v)}
					>
						<SelectTrigger id={id} className="w-full">
							<SelectValue placeholder={field.placeholder ?? "Selecione"} />
						</SelectTrigger>
						<SelectContent>
							{field.options?.map((opt) => (
								<SelectItem key={opt.value} value={opt.value}>
									{opt.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				) : (
					<Input
						id={id}
						type={field.type ?? "text"}
						step={field.type === "number" ? "0.01" : undefined}
						min={field.type === "number" ? "0" : undefined}
						autoComplete={field.type === "password" ? "new-password" : "off"}
						placeholder={field.placeholder}
						value={values[field.name] ?? ""}
						onChange={(e) => setField(field, e.target.value)}
					/>
				)}
				{helper && <p className="text-xs text-muted-foreground">{helper}</p>}
			</div>
		);
	}

	return (
		<div className="space-y-2">
			<div className="rounded-xl border border-border bg-white p-4">
				<h1 className="text-2xl font-bold text-foreground sm:text-3xl">{config.title}</h1>
				<p className="text-xs text-muted-foreground">{config.description}</p>
			</div>

			<div className="rounded-xl border border-border bg-white p-4 space-y-4">
				<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
					<Button onClick={openCreate} className="gap-1 sm:order-first">
						<Plus size={16} />
						{config.newLabel}
					</Button>
					<div className="relative sm:ml-auto sm:w-72">
						<Search
							size={16}
							className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
						/>
						<Input
							placeholder="Buscar..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="pl-8"
						/>
					</div>
				</div>

				{isLoading ? (
					<div className="space-y-2">
						{Array.from({ length: 5 }).map((_, i) => (
							<Skeleton key={i} className="h-10 w-full" />
						))}
					</div>
				) : isError || !result || !result.ok ? (
					<div className="flex flex-col items-center gap-3 py-10 text-center">
						<div>
							<p className="text-sm font-semibold text-destructive">
								{(result && !result.ok ? listError(result.status) : CONNECTION_ERROR).title}
							</p>
							<p className="text-sm text-muted-foreground">
								{(result && !result.ok ? listError(result.status) : CONNECTION_ERROR).description}
							</p>
						</div>
						<Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
							{isFetching ? "Tentando..." : "Tentar novamente"}
						</Button>
					</div>
				) : items.length === 0 ? (
					<p className="py-10 text-center text-sm text-muted-foreground">
						{search ? "Nenhum resultado para a busca." : "Nenhum registro cadastrado."}
					</p>
				) : (
					<Table>
						<TableHeader>
							<TableRow>
								{config.columns.map((col) => (
									<TableHead key={col.header} className={col.className}>
										{col.header}
									</TableHead>
								))}
								<TableHead className="w-16 text-right">Editar</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{items.map((item) => (
								<TableRow key={config.getId(item)}>
									{config.columns.map((col) => (
										<TableCell key={col.header} className={col.className}>
											{col.render(item)}
										</TableCell>
									))}
									<TableCell className="text-right">
										<Button
											variant="ghost"
											size="icon"
											onClick={() => openEdit(item)}
											aria-label={`Editar ${config.getLabel(item)}`}
										>
											<Pencil size={16} />
										</Button>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				)}
			</div>

			{/* Enquanto salva/exclui, o modal não pode ser fechado pelo usuário (Esc, clique fora, Cancelar). */}
			<Dialog open={mode !== null} onOpenChange={(open) => !open && !isBusy && closeForm()}>
				<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
					<form onSubmit={handleSubmit} className="space-y-4">
						<DialogHeader>
							<DialogTitle>
								{mode === "create"
									? config.newLabel
									: `Editar ${config.singular.toLowerCase()}`}
							</DialogTitle>
							<DialogDescription>
								{mode === "edit" && editing
									? config.getLabel(editing)
									: "Preencha os dados abaixo."}
							</DialogDescription>
						</DialogHeader>

						<div className="space-y-3">{visibleFields.map(renderField)}</div>

						{formError && (
							<div
								role="alert"
								className="flex gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm"
							>
								<AlertCircle size={18} className="mt-0.5 shrink-0 text-destructive" />
								<div>
									<p className="font-semibold text-destructive">{formError.title}</p>
									<p className="text-foreground/80">{formError.description}</p>
								</div>
							</div>
						)}

						<DialogFooter className="gap-2 sm:justify-between">
							{mode === "edit" &&
							editing &&
							(config.canDelete?.(editing, currentUserId) ?? true) ? (
								<Button
									type="button"
									variant="destructive"
									className="gap-1"
									onClick={() => setConfirmDelete(true)}
									disabled={isSaving || deleteMutation.isPending}
								>
									<Trash2 size={16} />
									Excluir
								</Button>
							) : (
								<span />
							)}
							<div className="flex gap-2">
								<Button type="button" variant="outline" onClick={closeForm} disabled={isBusy}>
									Cancelar
								</Button>
								<Button type="submit" disabled={isBusy}>
									{isSaving ? "Salvando..." : "Salvar"}
								</Button>
							</div>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			<AlertDialog
				open={confirmDelete}
				onOpenChange={(open) => !deleteMutation.isPending && setConfirmDelete(open)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Excluir {config.singular.toLowerCase()}?</AlertDialogTitle>
						<AlertDialogDescription>
							{editing ? `"${config.getLabel(editing)}" será excluído permanentemente. ` : ""}
							Esta ação não pode ser desfeita.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={deleteMutation.isPending}>Cancelar</AlertDialogCancel>
						<AlertDialogAction
							onClick={(e) => {
								e.preventDefault();
								handleDelete();
							}}
							disabled={deleteMutation.isPending}
							className="bg-destructive text-white hover:bg-destructive/90"
						>
							{deleteMutation.isPending ? "Excluindo..." : "Excluir"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

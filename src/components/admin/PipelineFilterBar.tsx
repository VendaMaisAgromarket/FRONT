"use client";

import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { PipelineFilterOptions } from "@/types/types";
import { Filter } from "lucide-react";
import { ReactNode, useState } from "react";

const ALL = "__all__";

export type PipelineFilterValue = {
	status?: string;
	produto?: string;
	comprador?: string;
	vendedor?: string;
};

type PipelineFilterBarProps = {
	options: PipelineFilterOptions;
	onApply: (value: PipelineFilterValue) => void;
};

function Field({ label, children }: { label: string; children: ReactNode }) {
	return (
		<div className="flex min-w-0 flex-1 flex-col gap-1 sm:min-w-[8.5rem]">
			<span className="text-xs text-muted-foreground">{label}</span>
			{children}
		</div>
	);
}

export default function PipelineFilterBar({ options, onApply }: PipelineFilterBarProps) {
	const [draft, setDraft] = useState<PipelineFilterValue>({});

	function set(key: keyof PipelineFilterValue, next: string) {
		setDraft((prev) => ({ ...prev, [key]: next === ALL ? undefined : next }));
	}

	return (
		<div className="rounded-xl border border-border bg-white p-4">
			<div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
				<Field label="Status">
					<Select value={draft.status ?? ALL} onValueChange={(v) => set("status", v)}>
						<SelectTrigger size="sm" className="w-full">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value={ALL}>Todos</SelectItem>
							{options.status.map((s) => (
								<SelectItem key={s.value} value={s.value}>
									{s.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</Field>

				<Field label="Produto">
					<Select value={draft.produto ?? ALL} onValueChange={(v) => set("produto", v)}>
						<SelectTrigger size="sm" className="w-full">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value={ALL}>Todos</SelectItem>
							{options.produtos.map((p) => (
								<SelectItem key={p.id} value={p.id}>
									{p.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</Field>

				<Field label="Comprador">
					<Select value={draft.comprador ?? ALL} onValueChange={(v) => set("comprador", v)}>
						<SelectTrigger size="sm" className="w-full">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value={ALL}>Todos</SelectItem>
							{options.compradores.map((c) => (
								<SelectItem key={c.id} value={c.id}>
									{c.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</Field>

				<Field label="Vendedor">
					<Select value={draft.vendedor ?? ALL} onValueChange={(v) => set("vendedor", v)}>
						<SelectTrigger size="sm" className="w-full">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value={ALL}>Todos</SelectItem>
							{options.vendedores.map((v) => (
								<SelectItem key={v.id} value={v.id}>
									{v.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</Field>

				{/* tipoOperacao: back aceita o filtro mas ainda não tem fonte de dado (filterOptions.tiposOperacao sempre []) */}
				<Field label="Tipo de Operação">
					<Select value={ALL} disabled>
						<SelectTrigger size="sm" className="w-full">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value={ALL}>Todos</SelectItem>
						</SelectContent>
					</Select>
				</Field>

				<Button size="sm" className="gap-1.5" onClick={() => onApply(draft)}>
					<Filter size={14} />
					Aplicar filtros
				</Button>
			</div>
		</div>
	);
}

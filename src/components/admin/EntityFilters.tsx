"use client";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { ExecutiveOverviewFilterOptions } from "@/types/types";
import { ReactNode } from "react";

const ALL = "__all__";

export type EntityFiltersValue = {
	produto?: string;
	comprador?: string;
	vendedor?: string;
};

type EntityFiltersProps = {
	options: ExecutiveOverviewFilterOptions;
	value: EntityFiltersValue;
	onChange: (value: EntityFiltersValue) => void;
	showTipoOperacao?: boolean;
};

function FilterField({ label, children }: { label: string; children: ReactNode }) {
	return (
		<div className="flex shrink-0 flex-col gap-1">
			<span className="text-xs text-muted-foreground">{label}</span>
			{children}
		</div>
	);
}

export default function EntityFilters({
	options,
	value,
	onChange,
	showTipoOperacao = true,
}: EntityFiltersProps) {
	function set(key: keyof EntityFiltersValue, next: string) {
		onChange({ ...value, [key]: next === ALL ? undefined : next });
	}

	return (
		<>
			<FilterField label="Produto">
				<Select value={value.produto ?? ALL} onValueChange={(v) => set("produto", v)}>
					<SelectTrigger size="sm" className="w-[8.5rem]">
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
			</FilterField>

			<FilterField label="Comprador">
				<Select value={value.comprador ?? ALL} onValueChange={(v) => set("comprador", v)}>
					<SelectTrigger size="sm" className="w-[8.5rem]">
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
			</FilterField>

			<FilterField label="Vendedor">
				<Select value={value.vendedor ?? ALL} onValueChange={(v) => set("vendedor", v)}>
					<SelectTrigger size="sm" className="w-[8.5rem]">
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
			</FilterField>

			{/* tipoOperacao: back aceita o filtro mas ainda não tem fonte de dado (filterOptions.tiposOperacao sempre []) */}
			{showTipoOperacao && (
				<FilterField label="Tipo de Operação">
					<Select value={ALL} disabled>
						<SelectTrigger size="sm" className="w-[8.5rem]">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value={ALL}>Todos</SelectItem>
						</SelectContent>
					</Select>
				</FilterField>
			)}
		</>
	);
}

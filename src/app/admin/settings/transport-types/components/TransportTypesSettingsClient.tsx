"use client";

import SettingsCrudPage, {
	SettingsCrudConfig,
} from "@/components/admin/settings/SettingsCrudPage";
import { currencyFormatter } from "@/utils/functions";

type TransportType = {
	id: string;
	type: string;
	valueFreight: number;
};

const config: SettingsCrudConfig<TransportType> = {
	resource: "transport-types",
	title: "Tipos de transporte",
	description: "Modalidades de entrega oferecidas nos pedidos",
	singular: "Tipo de transporte",
	newLabel: "Novo tipo",
	columns: [
		{ header: "Tipo", render: (t) => <span className="font-medium">{t.type}</span> },
		{ header: "Valor do frete", render: (t) => currencyFormatter(t.valueFreight ?? 0) },
	],
	fields: [
		{ name: "type", label: "Tipo", required: true, placeholder: "Ex.: Retirada" },
		{
			name: "valueFreight",
			label: "Valor do frete (R$)",
			type: "number",
			required: true,
			placeholder: "0,00",
		},
	],
	getId: (t) => t.id,
	getLabel: (t) => t.type,
	searchText: (t) => t.type,
	sortBy: (a, b) => a.type.localeCompare(b.type, "pt-BR"),
	toForm: (t) => ({ type: t?.type ?? "", valueFreight: t ? String(t.valueFreight ?? 0) : "" }),
	validate: (v, _mode, { items, editing }) => {
		const value = Number(v.valueFreight.replace(",", "."));
		if (!Number.isFinite(value) || value < 0) {
			return { title: "Valor de frete inválido", description: "Informe um valor numérico igual ou maior que zero." };
		}
		const name = v.type.trim().toLowerCase();
		const duplicate = items.find((t) => t.id !== editing?.id && t.type.trim().toLowerCase() === name);
		return duplicate
			? { title: "Tipo já cadastrado", description: `Já existe o tipo de transporte "${duplicate.type}".` }
			: null;
	},
	toPayload: (v) => ({
		type: v.type.trim(),
		valueFreight: Number(v.valueFreight.replace(",", ".")),
	}),
	inUseDescription: "Este tipo de transporte já foi usado em vendas e não pode ser excluído. Você pode editá-lo.",
};

export default function TransportTypesSettingsClient() {
	return <SettingsCrudPage config={config} />;
}

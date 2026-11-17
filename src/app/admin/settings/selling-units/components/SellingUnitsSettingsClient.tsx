"use client";

import SettingsCrudPage, {
	SettingsCrudConfig,
} from "@/components/admin/settings/SettingsCrudPage";

type SellingUnit = {
	id: string;
	unit: string;
	title: string;
};

const config: SettingsCrudConfig<SellingUnit> = {
	resource: "selling-units",
	title: "Unidades do produto",
	description: "Unidades de medida usadas no cadastro e na venda de produtos",
	singular: "Unidade",
	newLabel: "Nova unidade",
	columns: [
		{ header: "Nome", render: (u) => <span className="font-medium">{u.title}</span> },
		{ header: "Sigla", render: (u) => u.unit },
	],
	fields: [
		{ name: "title", label: "Nome", required: true, placeholder: "Ex.: Quilograma" },
		{
			name: "unit",
			label: "Sigla",
			required: true,
			placeholder: "Ex.: kg",
			helper: "Salva em minúsculas e deve ser única.",
		},
	],
	getId: (u) => u.id,
	getLabel: (u) => `${u.title} (${u.unit})`,
	searchText: (u) => `${u.title} ${u.unit}`,
	toForm: (u) => ({ title: u?.title ?? "", unit: u?.unit ?? "" }),
	validate: (v, _mode, { items, editing }) => {
		const unit = v.unit.trim().toLowerCase();
		const duplicate = items.find((u) => u.id !== editing?.id && u.unit === unit);
		return duplicate
			? { title: "Sigla já cadastrada", description: `A sigla "${unit}" já é usada pela unidade "${duplicate.title}".` }
			: null;
	},
	toPayload: (v) => ({ title: v.title.trim(), unit: v.unit.trim() }),
	inUseDescription: "existem produtos cadastrados com esta unidade.",
};

export default function SellingUnitsSettingsClient() {
	return <SettingsCrudPage config={config} />;
}

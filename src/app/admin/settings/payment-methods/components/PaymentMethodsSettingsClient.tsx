"use client";

import SettingsCrudPage, {
	SettingsCrudConfig,
} from "@/components/admin/settings/SettingsCrudPage";

type PaymentMethod = {
	id: string;
	method: string;
};

const config: SettingsCrudConfig<PaymentMethod> = {
	resource: "payment-methods",
	title: "Métodos de pagamento",
	description: "Formas de pagamento disponíveis no checkout",
	singular: "Método de pagamento",
	newLabel: "Novo método",
	columns: [{ header: "Método", render: (m) => <span className="font-medium">{m.method}</span> }],
	fields: [
		{
			name: "method",
			label: "Nome do método",
			required: true,
			placeholder: "Ex.: Pix",
			// O fluxo de pagamento identifica o tipo pelo nome (pix/boleto/cartão).
			helper: "O checkout identifica o tipo pelo nome: mantenha \"Pix\", \"Boleto\" ou \"Cartão\" no texto.",
		},
	],
	getId: (m) => m.id,
	getLabel: (m) => m.method,
	searchText: (m) => m.method,
	sortBy: (a, b) => a.method.localeCompare(b.method, "pt-BR"),
	toForm: (m) => ({ method: m?.method ?? "" }),
	validate: (v, _mode, { items, editing }) => {
		const name = v.method.trim().toLowerCase();
		const duplicate = items.find((m) => m.id !== editing?.id && m.method.trim().toLowerCase() === name);
		return duplicate
			? { title: "Método já cadastrado", description: `Já existe o método "${duplicate.method}".` }
			: null;
	},
	toPayload: (v) => ({ method: v.method.trim() }),
	inUseDescription:
		"Este método já foi usado em vendas ou pagamentos e não pode ser excluído. Você pode renomeá-lo.",
};

export default function PaymentMethodsSettingsClient() {
	return <SettingsCrudPage config={config} />;
}

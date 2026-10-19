"use client";

import SettingsCrudPage, {
	SettingsCrudConfig,
} from "@/components/admin/settings/SettingsCrudPage";

type PaymentMethod = {
	id: string;
	method: string;
};

// O checkout decide disponibilidade e fluxo pelo nome do método (isWip/getDescription em
// mapPaymentMethodToData e a página de pagamento), e cada um compara de um jeito
// (primeira palavra, nome exato, substring). Só estes nomes são reconhecidos igual por todos.
const CANONICAL_METHODS = ["Pix", "Boleto", "Cartão"];

function toCanonical(method: string): string {
	return CANONICAL_METHODS.find((m) => m.toLowerCase() === method.trim().toLowerCase()) ?? "";
}

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
			label: "Método",
			type: "select",
			required: true,
			placeholder: "Selecione o método",
			options: CANONICAL_METHODS.map((m) => ({ value: m, label: m })),
			helper: "Somente os métodos suportados pelo checkout podem ser cadastrados.",
		},
	],
	getId: (m) => m.id,
	getLabel: (m) => m.method,
	searchText: (m) => m.method,
	sortBy: (a, b) => a.method.localeCompare(b.method, "pt-BR"),
	// Nome legado fora do padrão abre vazio: o admin precisa escolher um método suportado.
	toForm: (m) => ({ method: m ? toCanonical(m.method) : "" }),
	validate: (v, _mode, { items, editing }) => {
		if (!CANONICAL_METHODS.includes(v.method)) {
			return {
				title: "Método não suportado",
				description: `Escolha um destes: ${CANONICAL_METHODS.join(", ")}.`,
			};
		}
		const name = v.method.toLowerCase();
		const duplicate = items.find((m) => m.id !== editing?.id && m.method.trim().toLowerCase() === name);
		return duplicate
			? { title: "Método já cadastrado", description: `Já existe o método "${duplicate.method}".` }
			: null;
	},
	toPayload: (v) => ({ method: v.method }),
	inUseDescription: "este método já foi usado em vendas ou pagamentos.",
};

export default function PaymentMethodsSettingsClient() {
	return <SettingsCrudPage config={config} />;
}

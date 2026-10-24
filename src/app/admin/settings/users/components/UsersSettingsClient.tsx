"use client";

import SettingsCrudPage, {
	SettingsCrudConfig,
} from "@/components/admin/settings/SettingsCrudPage";
import { Badge } from "@/components/ui/badge";
import { PASSWORD_REGEX, isValidCnpj, isValidCpf } from "@/lib/validation";
import {
	cleanNumericString,
	formatCnpj,
	formatCpf,
	formatCpfCnpj,
	formatPhoneNumber,
} from "@/utils/functions";

type AdminUser = {
	id: string;
	name: string;
	email: string;
	phone_number: string;
	cpf: string | null;
	cnpj: string | null;
	ccir: string | null;
	role: string;
	img: string | null;
	valid: boolean;
};

const ROLE_LABELS: Record<string, string> = {
	buyer: "Comprador",
	producer: "Produtor",
	admin: "Administrador",
};


const config: SettingsCrudConfig<AdminUser> = {
	resource: "users",
	title: "Usuários",
	description: "Gerencie os usuários cadastrados na plataforma",
	singular: "Usuário",
	newLabel: "Novo usuário",
	columns: [
		{ header: "Nome", render: (u) => <span className="font-medium">{u.name}</span> },
		{ header: "E-mail", render: (u) => u.email, className: "hidden md:table-cell" },
		{
			header: "CPF/CNPJ",
			render: (u) => (u.cpf || u.cnpj ? formatCpfCnpj(u.cpf || u.cnpj || "") : "—"),
			className: "hidden lg:table-cell",
		},
		{
			header: "Telefone",
			render: (u) => formatPhoneNumber(u.phone_number) || "—",
			className: "hidden lg:table-cell",
		},
		{
			header: "Perfil",
			render: (u) => (
				<Badge variant={u.role === "admin" ? "default" : "outline"}>
					{ROLE_LABELS[u.role] ?? u.role}
				</Badge>
			),
		},
	],
	fields: [
		{
			name: "role",
			label: "Perfil",
			type: "select",
			required: true,
			lockedOnEdit: true,
			options: Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label })),
		},
		{ name: "name", label: "Nome", required: true },
		{ name: "email", label: "E-mail", type: "email", required: true },
		{
			name: "phone_number",
			label: "Telefone",
			required: true,
			placeholder: "(00) 00000-0000",
			mask: formatPhoneNumber,
		},
		{ name: "cpf", label: "CPF", placeholder: "000.000.000-00", mask: formatCpf, lockedOnEdit: true },
		{
			name: "cnpj",
			label: "CNPJ",
			placeholder: "00.000.000/0000-00",
			mask: formatCnpj,
			lockedOnEdit: true,
			helper: "Informe CPF ou CNPJ — o login é feito por um deles.",
		},
		{ name: "ccir", label: "CCIR", helper: "Opcional, usado para produtores rurais." },
		{
			name: "password",
			label: "Senha",
			type: "password",
			required: "create",
			helper: (mode) =>
				mode === "edit"
					? "Deixe em branco para manter a senha atual."
					: "Mínimo 8 caracteres, com maiúscula, minúscula, número e caractere especial.",
		},
	],
	getId: (u) => u.id,
	getLabel: (u) => u.name,
	searchText: (u) =>
		[u.name, u.email, u.cpf, u.cnpj, ROLE_LABELS[u.role] ?? u.role].filter(Boolean).join(" "),
	sortBy: (a, b) => a.name.localeCompare(b.name, "pt-BR"),
	toForm: (u) => ({
		role: u?.role ?? "buyer",
		name: u?.name ?? "",
		email: u?.email ?? "",
		phone_number: formatPhoneNumber(u?.phone_number ?? ""),
		cpf: u?.cpf ? formatCpf(u.cpf) : "",
		cnpj: u?.cnpj ? formatCnpj(u.cnpj) : "",
		ccir: u?.ccir ?? "",
		password: "",
	}),
	validate: (v, mode, { items, editing }) => {
		const email = v.email.trim().toLowerCase();
		// CPF/CNPJ só são editáveis na criação; na edição ficam bloqueados e não são validados.
		const cpf = mode === "create" ? cleanNumericString(v.cpf) : "";
		const cnpj = mode === "create" ? cleanNumericString(v.cnpj) : "";
		const ccir = v.ccir.trim();

		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			return { title: "E-mail inválido", description: `"${v.email}" não é um endereço de e-mail válido.` };
		}
		if (cleanNumericString(v.phone_number).length < 10) {
			return { title: "Telefone inválido", description: "Informe o telefone com DDD (10 ou 11 dígitos)." };
		}
		if (mode === "create" && !cpf && !cnpj) {
			return { title: "CPF ou CNPJ obrigatório", description: "Informe ao menos um dos dois — o login é feito por eles." };
		}
		if (cpf && !isValidCpf(cpf)) {
			return { title: "CPF inválido", description: "Confira os números digitados: os dígitos verificadores não conferem." };
		}
		if (cnpj && !isValidCnpj(cnpj)) {
			return { title: "CNPJ inválido", description: "Confira os números digitados: os dígitos verificadores não conferem." };
		}
		if (v.password && !PASSWORD_REGEX.test(v.password)) {
			return {
				title: "Senha fora do padrão",
				description: "Use pelo menos 8 caracteres, com letra maiúscula, minúscula, número e caractere especial.",
			};
		}

		// O back só devolve erro genérico na edição; checamos duplicidade aqui com a lista já carregada.
		const others = items.filter((u) => u.id !== editing?.id);
		const owner = (pred: (u: AdminUser) => boolean) => others.find(pred)?.name;
		const emailOwner = owner((u) => u.email.toLowerCase() === email);
		if (emailOwner) {
			return { title: "E-mail já cadastrado", description: `Este e-mail já pertence ao usuário "${emailOwner}".` };
		}
		const cpfOwner = cpf && owner((u) => cleanNumericString(u.cpf ?? "") === cpf);
		if (cpfOwner) {
			return { title: "CPF já cadastrado", description: `Este CPF já pertence ao usuário "${cpfOwner}".` };
		}
		const cnpjOwner = cnpj && owner((u) => cleanNumericString(u.cnpj ?? "") === cnpj);
		if (cnpjOwner) {
			return { title: "CNPJ já cadastrado", description: `Este CNPJ já pertence ao usuário "${cnpjOwner}".` };
		}
		const ccirOwner = ccir && owner((u) => (u.ccir ?? "").trim() === ccir);
		if (ccirOwner) {
			return { title: "CCIR já cadastrado", description: `Este CCIR já pertence ao usuário "${ccirOwner}".` };
		}
		return null;
	},
	toPayload: (v, mode) => {
		const payload: Record<string, unknown> = {
			name: v.name.trim(),
			email: v.email.trim(),
			phone_number: cleanNumericString(v.phone_number),
		};
		// "" quebraria a unicidade de CCIR no banco: no cadastro o campo vazio é omitido;
		// na edição vai null explícito, para que apagar o campo realmente limpe o valor.
		const ccir = v.ccir.trim();
		if (ccir) payload.ccir = ccir;
		else if (mode === "edit") payload.ccir = null;
		if (v.password) payload.password = v.password;
		// Perfil, CPF e CNPJ são bloqueados na edição — só vão no cadastro.
		if (mode === "create") {
			const cpf = cleanNumericString(v.cpf);
			const cnpj = cleanNumericString(v.cnpj);
			if (cpf) payload.cpf = cpf;
			if (cnpj) payload.cnpj = cnpj;
			payload.role = v.role;
		}
		return payload;
	},
	// Impede o admin de excluir a própria conta por engano.
	canDelete: (u, currentUserId) => u.id !== currentUserId,
	inUseDescription:
		"o usuário tem endereços, produtos, pedidos ou contratos vinculados.",
};

export default function UsersSettingsClient() {
	return <SettingsCrudPage config={config} />;
}

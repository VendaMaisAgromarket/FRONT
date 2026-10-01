"use server";

import { signInSchema, SignUpFormValues } from "@/lib/schemas";
import { createSession } from "@/lib/session";
import { SignInFormState } from "@/types/types";
import mapUserTypeToRole from "@/utils/mappers/userTypeToRole";
import { jwtDecode } from "jwt-decode";
import z from "zod";

const apiUrl = process.env.NEXT_PUBLIC_URL;

export async function signIn(
	state: SignInFormState | undefined,
	formData: z.infer<typeof signInSchema>
): Promise<SignInFormState> {
	const result = signInSchema.safeParse(formData);

	if (!result.success) {
		return {
			message: "Erro de validação. Por favor, corrija os campos",
			errors: result.error.flatten().fieldErrors,
		};
	}
	try {
		const res = await fetch(`${apiUrl}/api/auth`, {
			method: "POST",
			credentials: "include",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(result.data),
		});

		//TODO: Melhorar o tratamento de erros vindos da API
		if (!res.ok) {
			return {
				message: "Erro",
				errors: {
					password: [
						"CPF/CNPJ ou senha digitados não condizem com nenhum usuário. Por favor tente novamente",
					],
				},
			};
		}

		const data = await res.json();
		const payload = {
			...(jwtDecode(data.access_token) as {
				id: string;
				role: string;
				name: string;
				email: string;
				exp: number;
			}),
			jwt: data.access_token,
		};
		await createSession(payload);

		return {
			message: "Login realizado com sucesso.",
		};
	} catch (err) {
		console.error("Erro no fetch /api/login:", err);
		return {
			message: "Erro ao realizar login, por favor tente novamente.",
		};
	}
}

export async function signUp(data: SignUpFormValues) {
	const {
		userType,
		firstSecurityQuestion,
		secondSecurityQuestion,
		thirdSecurityQuestion,
		cpfCnpj,
		// Confirmação de senha e aceite de termos são validados/usados só no
		// frontend — o backend não tem esses campos, não devem ser enviados.
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		confirmPassword,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		acceptPrivacyPolicy,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		acceptTermsOfUse,
		...rest
	} = data;

	const rawDoc = cpfCnpj.replace(/\D/g, '');
	const docField = rawDoc.length === 11 ? { cpf: rawDoc } : { cnpj: rawDoc };

	let payload = {
		securityQuestions: {
			answer_1: firstSecurityQuestion,
			answer_2: secondSecurityQuestion,
			answer_3: thirdSecurityQuestion,
		},
		role: mapUserTypeToRole(userType),
		...docField,
	};

	if ("ccir" in rest && rest.ccir !== undefined && rest.ccir !== "") {
		payload = { ...payload, ...rest };
	} else {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { ccir, ...woCcir } = rest as { ccir?: string };
		payload = { ...payload, ...woCcir };
	}

	try {
		const res = await fetch(`${apiUrl}/api/user`, {
			method: "POST",
			credentials: "include",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		});

		const { data } = await res.json();

		return {
			success: res.ok,
			message: data.message,
		};
	} catch (err) {
		console.error("Erro ao cadastrar: ", err);
		return {
			success: false,
			message:
				"Ocorreu um erro inesperado no servidor. Por favor tente novamente.",
		};
	}
}

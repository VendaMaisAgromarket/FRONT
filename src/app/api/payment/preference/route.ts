import { verifySession } from "@/lib/session";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { validatePaymentData } from "@/lib/validation";

async function auth() {
	const token = (await cookies()).get("session")?.value;
	if (!token)
		return { error: NextResponse.json({ error: "Sessão não encontrada" }, { status: 401 }) };
	const session = await verifySession(token);
	return { jwt: session?.jwt as string | undefined };
}

export async function POST(req: NextRequest) {
	try {
		const { jwt, error } = await auth();
		if (error) return error;

		const body = await req.json();

		// Validar dados recebidos
		const validation = validatePaymentData(body);
		if (!validation.valid) {
			return NextResponse.json(
				{ error: validation.error || "Dados inválidos" },
				{ status: 400 }
			);
		}

		const res = await fetch(`${process.env.API_URL}/payment/preference`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${jwt}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify(body),
		});

		const data = await res.json();

		if (!res.ok) {
			// Passar a mensagem de erro do backend, especialmente para erros do gateway de pagamento
			const errorMessage = data.message || data.error || "Erro ao criar preferência de pagamento";
			return NextResponse.json(
				{
					error: errorMessage,
					message: errorMessage // Garantir que a mensagem esteja disponível
				},
				{ status: res.status }
			);
		}

		return NextResponse.json(data, { status: res.status });
	} catch (e) {
		console.error("[PAYMENT PREFERENCE POST]", e);
		return NextResponse.json(
			{ error: "Erro interno ao criar preferência de pagamento" },
			{ status: 500 }
		);
	}
}


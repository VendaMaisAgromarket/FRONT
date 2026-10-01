"use server";

import { verifySession } from "@/lib/session";
import { cookies } from "next/headers";

interface CreatePaymentPreferenceParams {
	saleId: string;
	paymentMethodId: string;
	productId: string;
	title: string;
	unit_price: number;
	quantity: number;
	amount: number;
}

const API_URI = process.env.API_URL || process.env.NEXT_PUBLIC_URL;

export async function createPaymentPreference(params: CreatePaymentPreferenceParams) {
	const cookieStore = await cookies();
	const token = cookieStore.get("session")?.value;
	const { jwt } = await verifySession(token);

	try {
		const res = await fetch(`${API_URI}/payment/preference`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${jwt}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify(params),
		});

		const data = await res.json();

		if (!res.ok) {
			return {
				success: false,
				message: data.error || data.message || "Erro ao criar preferência de pagamento",
			};
		}

		return {
			success: true,
			data: {
				paymentId: data.paymentId,
				asaas_payment_id: data.asaas_payment_id,
				init_point: data.init_point,
			},
		};
	} catch (error: unknown) {
		console.error("Erro ao criar preferência de pagamento:", error);
		return {
			success: false,
			message: error instanceof Error ? error.message : "Erro interno ao criar preferência de pagamento",
		};
	}
}


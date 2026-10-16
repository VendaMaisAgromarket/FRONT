"use server";

import { verifySession } from "@/lib/session";
import { cookies } from "next/headers";

interface CreateNewProductPayload {
	transportTypeId: string;
	transportValue: number;
	addressId: string | null;
	paymentMethodId: string;
	packagingType?: string;
	boughtProducts: {
		productId: string;
		sellingUnitProductId: string;
		amount: number;
	}[];
}

const API_URI = process.env.NEXT_PUBLIC_URL;

export async function createNewOrder(payload: CreateNewProductPayload) {
	const cookieStore = await cookies();
	const token = cookieStore.get("session")?.value;
	const { id, jwt } = await verifySession(token);
	const data = { ...payload, buyerId: id };

	const res = await fetch(`${API_URI}/api/order`, {
		method: "POST",
		headers: { Authorization: `Bearer ${jwt}` },
		body: JSON.stringify(data),
	});

	const responseData = await res.json();

	if (res.ok) {
		return {
			success: true,
			message: res.statusText,
			status: res.status,
			orderId: responseData.data?.id,
		};
	}

	return {
		success: false,
		message: res.statusText,
		status: res.status,
		code: responseData.code as string | undefined,
	};
}

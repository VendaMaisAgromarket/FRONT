import { getApiSessionJwt } from "@/lib/session";
import { NextResponse } from "next/server";

export async function PATCH() {
	const jwt = await getApiSessionJwt();

	if (!jwt) {
		return NextResponse.json({ error: "Sessão expirada" }, { status: 401 });
	}

	const res = await fetch(`${process.env.API_URL}/notifications/read-all`, {
		method: "PATCH",
		headers: { Authorization: `Bearer ${jwt}` },
	});

	if (res.ok) {
		return NextResponse.json(await res.json());
	}

	return NextResponse.json(
		{ error: "Erro ao marcar notificações como lidas" },
		{ status: res.status }
	);
}

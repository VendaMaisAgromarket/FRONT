import { verifySession } from "@/lib/session";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function PATCH() {
	const session = (await cookies()).get("session")?.value;

	if (!session) {
		return NextResponse.json({ error: "Sessão não encontrada" }, { status: 401 });
	}

	const token = await verifySession(session);

	const res = await fetch(`${process.env.API_URL}/notifications/read-all`, {
		method: "PATCH",
		headers: { Authorization: `Bearer ${token.jwt}` },
	});

	if (res.ok) {
		return NextResponse.json(await res.json());
	}

	return NextResponse.json(
		{ error: "Erro ao marcar notificações como lidas" },
		{ status: res.status }
	);
}

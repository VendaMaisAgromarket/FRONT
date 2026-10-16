import { getApiSessionJwt } from "@/lib/session";
import { NextResponse } from "next/server";

export async function GET() {
	const jwt = await getApiSessionJwt();

	if (!jwt) {
		return NextResponse.json({ error: "Sessão expirada" }, { status: 401 });
	}

	const res = await fetch(`${process.env.API_URL}/notifications/unread-count`, {
		headers: { Authorization: `Bearer ${jwt}` },
		cache: "no-store",
	});

	if (res.ok) {
		return NextResponse.json(await res.json());
	}

	return NextResponse.json(
		{ error: "Erro ao buscar notificações não lidas" },
		{ status: res.status }
	);
}

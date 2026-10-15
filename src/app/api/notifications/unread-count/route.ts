import { verifySession } from "@/lib/session";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
	const session = (await cookies()).get("session")?.value;

	if (!session) {
		return NextResponse.json({ error: "Sessão não encontrada" }, { status: 401 });
	}

	const token = await verifySession(session);

	const res = await fetch(`${process.env.API_URL}/notifications/unread-count`, {
		headers: { Authorization: `Bearer ${token.jwt}` },
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

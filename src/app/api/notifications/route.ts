import { verifySession } from "@/lib/session";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	const session = (await cookies()).get("session")?.value;

	if (!session) {
		return NextResponse.json({ error: "Sessão não encontrada" }, { status: 401 });
	}

	const token = await verifySession(session);

	const { searchParams } = new URL(request.url);
	const upstreamUrl = new URL(`${process.env.API_URL}/notifications`);
	for (const key of ["limit", "cursor", "unreadOnly"]) {
		const value = searchParams.get(key);
		if (value) upstreamUrl.searchParams.set(key, value);
	}

	const res = await fetch(upstreamUrl, {
		headers: { Authorization: `Bearer ${token.jwt}` },
		cache: "no-store",
	});

	if (res.ok) {
		return NextResponse.json(await res.json());
	}

	return NextResponse.json(
		{ error: "Erro ao buscar notificações" },
		{ status: res.status }
	);
}

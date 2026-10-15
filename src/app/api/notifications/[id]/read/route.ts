import { verifySession } from "@/lib/session";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
	_req: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const session = (await cookies()).get("session")?.value;

	if (!session) {
		return NextResponse.json({ error: "Sessão não encontrada" }, { status: 401 });
	}

	const token = await verifySession(session);
	const { id } = await params;

	const res = await fetch(
		`${process.env.API_URL}/notifications/${encodeURIComponent(id)}/read`,
		{
			method: "PATCH",
			headers: { Authorization: `Bearer ${token.jwt}` },
		}
	);

	if (res.ok) {
		return new NextResponse(null, { status: 204 });
	}

	return NextResponse.json(
		{ error: "Erro ao marcar notificação como lida" },
		{ status: res.status }
	);
}

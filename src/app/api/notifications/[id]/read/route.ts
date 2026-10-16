import { getApiSessionJwt } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
	_req: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const jwt = await getApiSessionJwt();

	if (!jwt) {
		return NextResponse.json({ error: "Sessão expirada" }, { status: 401 });
	}
	const { id } = await params;

	const res = await fetch(
		`${process.env.API_URL}/notifications/${encodeURIComponent(id)}/read`,
		{
			method: "PATCH",
			headers: { Authorization: `Bearer ${jwt}` },
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

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
  const upstreamUrl = new URL(`${process.env.API_URL}/dashboard/pipeline`);
  for (const key of [
    "page",
    "pageSize",
    "startDate",
    "endDate",
    "stage",
    "blocked",
    "produto",
    "comprador",
    "vendedor",
    "tipoOperacao",
  ]) {
    const value = searchParams.get(key);
    if (value) upstreamUrl.searchParams.set(key, value);
  }

  const res = await fetch(upstreamUrl, {
    headers: {
      Authorization: `Bearer ${token.jwt}`,
    },
    cache: "no-store",
  });

  if (res.ok) {
    const data = await res.json();
    return NextResponse.json(data);
  }

  return NextResponse.json(
    { error: "Erro ao buscar pipeline das operações" },
    { status: res.status }
  );
}

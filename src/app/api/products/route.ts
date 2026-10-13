import { verifySession } from "@/lib/session";
import { Product } from "@/types/types";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = (await cookies()).get("session")?.value;
  const token = await verifySession(session);
  // Repassa filtros suportados pelo back (ex.: ?category=)
  const query = req.nextUrl.searchParams.toString();

  const res = await fetch(`${process.env.API_URL}/products${query ? `?${query}` : ""}`, {
    headers: {
      Authorization: `Bearer ${token.jwt}`,
    },
  });
  if (res.ok) {
    const data: Product[] = await res.json();

    return NextResponse.json(data);
  }
  return NextResponse.error();
}

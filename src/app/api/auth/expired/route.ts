import { deleteSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

// Server Components (ex: SessionProvider) não podem alterar cookies — quando a sessão
// é rejeitada pelo back, eles redirecionam pra cá, que limpa o cookie e manda pro login.
export async function GET(request: NextRequest) {
	await deleteSession();
	return NextResponse.redirect(new URL("/login", request.url));
}

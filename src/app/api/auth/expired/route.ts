import { loginUrl } from "@/lib/authRedirect";
import { deleteSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

// Server Components (ex: SessionProvider) não podem alterar cookies — quando a sessão
// é rejeitada pelo back (ex.: JWT emitido antes de uma troca de senha), eles redirecionam
// pra cá, que limpa o cookie e manda pro login com aviso e a rota para voltar.
export async function GET(request: NextRequest) {
	await deleteSession();
	const redirect = request.nextUrl.searchParams.get("redirect");
	return NextResponse.redirect(new URL(loginUrl("expired", redirect), request.url));
}

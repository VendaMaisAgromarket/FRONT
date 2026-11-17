import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { decrypt } from "./lib/session";

export default async function middleware(req: NextRequest) {
  const protectedRoutes = ["/", "/market"];
  const currPath = req.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.includes(currPath);

  // Layouts (Server Components) não têm acesso à URL: repassamos a rota atual para que,
  // se a sessão for rejeitada pelo back, o login saiba para onde voltar (?redirect=).
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", currPath + req.nextUrl.search);
  const next = () => NextResponse.next({ request: { headers: requestHeaders } });

  if (isProtectedRoute) {
    const cookie = (await cookies()).get("session")?.value;
    const session = await decrypt(cookie);

    if (session && currPath === "/") {
      return NextResponse.redirect(new URL("/market", req.nextUrl));
    }

    if (!session && currPath !== "/") {
      return NextResponse.redirect(new URL("/login", req.nextUrl));
    }
  }

  return next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
    "/market/:path",
  ],
};

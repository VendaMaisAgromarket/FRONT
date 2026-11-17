import { getApiSessionJwt } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

// Proxy de /certifications/farm/* do back, com o JWT da sessão.
// - multipart (POST/PUT): o corpo é repassado em stream, com o Content-Type original (boundary).
// - Erros do back ({ error }) são repassados com o mesmo status, para o front exibir a mensagem.
// - /badge/:userId é público: segue sem token quando não há sessão.

type Ctx = { params: Promise<{ path?: string[] }> };

const SEGMENT = /^[A-Za-z0-9_-]{1,100}$/;

async function proxy(req: NextRequest, { params }: Ctx) {
	const { path = [] } = await params;

	if (!path.every((s) => SEGMENT.test(s))) {
		return NextResponse.json({ error: "Rota inválida" }, { status: 400 });
	}

	const isPublic = req.method === "GET" && path[0] === "badge" && path.length === 2;
	const jwt = await getApiSessionJwt();
	if (!jwt && !isPublic) {
		return NextResponse.json({ error: "Sessão expirada" }, { status: 401 });
	}

	const upstream = new URL(
		`${process.env.API_URL}/certifications/farm${path.length ? `/${path.join("/")}` : ""}`
	);
	req.nextUrl.searchParams.forEach((value, key) => upstream.searchParams.set(key, value));

	const headers: Record<string, string> = {};
	if (jwt) headers.Authorization = `Bearer ${jwt}`;

	const hasBody = req.method !== "GET" && req.method !== "HEAD";
	const contentType = req.headers.get("content-type");
	if (hasBody && contentType) headers["Content-Type"] = contentType;

	let res: Response;
	try {
		res = await fetch(upstream, {
			method: req.method,
			headers,
			body: hasBody ? req.body : undefined,
			cache: "no-store",
			// Necessário para repassar o corpo como stream (Node fetch)
			...(hasBody ? { duplex: "half" } : {}),
		} as RequestInit);
	} catch (err) {
		console.error("[API CERTIFICATIONS FARM]", err);
		return NextResponse.json(
			{ error: "Não foi possível falar com o servidor. Tente novamente." },
			{ status: 502 }
		);
	}

	if (res.status === 204) return new NextResponse(null, { status: 204 });

	const text = await res.text();
	try {
		return NextResponse.json(JSON.parse(text), { status: res.status });
	} catch {
		return NextResponse.json(
			res.ok ? {} : { error: text || `Erro ${res.status}` },
			{ status: res.status }
		);
	}
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;

import { verifySession } from "@/lib/session";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const session = (await cookies()).get("session")?.value;
	const token = await verifySession(session);
	const { id } = await params;

	if (!token) {
		return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
	}

	try {
		const cleanId = id.trim();
		// Repassa filtros suportados pelo back (ex.: ?status=all)
		const query = req.nextUrl.searchParams.toString();
		const url = `${process.env.API_URL}/products/${cleanId}${query ? `?${query}` : ""}`;
		
		const res = await fetch(url, {
			method: "GET",
			headers: {
				Authorization: `Bearer ${token.jwt}`,
			},
		});
		const data = await res.json();

		return NextResponse.json(data, { status: res.status });
	} catch (err) {
		return NextResponse.json({ message: err }, { status: 500 });
	}
}

export async function PUT(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const session = (await cookies()).get("session")?.value;
	const token = await verifySession(session);
	const { id } = await params;

	if (!token) {
		return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
	}

	try {
		const contentType = req.headers.get("content-type");
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		let body: any;
		const headers: HeadersInit = {
			Authorization: `Bearer ${token.jwt}`,
		};

		// Verificar se é FormData ou JSON
		if (contentType?.includes("multipart/form-data")) {
			// É FormData (com imagens)
			const formData = await req.formData();
			body = formData;
			// Não adicionar Content-Type, o fetch vai adicionar automaticamente com boundary
		} else {
			// É JSON (sem imagens)
			const productData = await req.json();
			headers["Content-type"] = "application/json";
			body = JSON.stringify(productData);
		}

		const res = await fetch(`${process.env.API_URL}/products/${id}`, {
			method: "PUT",
			headers,
			body,
		});

		// Retornar o corpo da resposta se existir
		if (res.ok) {
			const responseText = await res.text();
			if (responseText && responseText.trim().length > 0) {
				try {
					const responseData = JSON.parse(responseText);
					return NextResponse.json(responseData, { status: res.status });
				} catch {
					return new NextResponse(responseText, { status: res.status });
				}
			}
			return new NextResponse(null, { status: res.status });
		} else {
			const errorText = await res.text();
			return new NextResponse(errorText, { status: res.status });
		}
	} catch (err) {
		console.error("Erro no PUT /api/sellerProducts/[id]:", err);
		return NextResponse.json({ message: err }, { status: 500 });
	}
}

export async function DELETE(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const session = (await cookies()).get("session")?.value;
	const token = await verifySession(session);
	const { id } = await params;

	try {
		const res = await fetch(`${process.env.API_URL}/products/${id}`, {
			method: "DELETE",
			headers: {
				Authorization: `Bearer ${token.jwt}`,
			},
		});

		return new NextResponse(null, { status: res.status });
	} catch (err) {
		return NextResponse.json({ message: err }, { status: 500 });
	}
}

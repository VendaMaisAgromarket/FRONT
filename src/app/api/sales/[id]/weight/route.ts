import { verifySession } from "@/lib/session";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

async function auth() {
    const token = (await cookies()).get("session")?.value;
    if (!token)
        return { error: NextResponse.json({ error: "Sessão não encontrada" }, { status: 401 }) };
    const session = await verifySession(token);
    return { jwt: session?.jwt as string | undefined };
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { jwt, error } = await auth();
        if (error) return error;

        const { id } = await params;
        const incoming = await req.formData();

        const file = incoming.get("file");
        const weightKg = incoming.get("weightKg");

        if (!file || !weightKg) {
            return NextResponse.json({ error: "Arquivo e peso são obrigatórios" }, { status: 400 });
        }

        const weightNum = Number(weightKg);
        if (isNaN(weightNum) || weightNum <= 0) {
            return NextResponse.json({ error: "Peso inválido" }, { status: 400 });
        }

        const forward = new FormData();
        forward.append("file", file as Blob);
        forward.append("weightKg", String(weightNum));

        // Não definir Content-Type — o fetch define automaticamente com o boundary correto
        const res = await fetch(`${process.env.API_URL}/sales/${id}/weight`, {
            method: "POST",
            headers: { Authorization: `Bearer ${jwt}` },
            body: forward,
        });

        const data = await res.json();

        if (!res.ok) {
            return NextResponse.json(
                { error: data.message || data.error || "Erro ao registrar pesagem", code: data.code },
                { status: res.status }
            );
        }

        return NextResponse.json(data, { status: res.status });
    } catch (e) {
        console.error("[WEIGHT POST]", e);
        return NextResponse.json({ error: "Erro interno ao registrar pesagem" }, { status: 500 });
    }
}

import { NextResponse } from "next/server";

// Pagamento com cartão de crédito (POST /payment/card no Asaas) está
// temporariamente desabilitado: o endpoint recebe os dados do cartão em
// claro no backend, e a decisão de negócio foi aguardar uma tokenização
// client-side segura antes de reabilitar este fluxo (ver CardPayment.tsx).
export async function POST() {
    return NextResponse.json(
        { error: "Pagamento com cartão de crédito temporariamente indisponível" },
        { status: 501 }
    );
}

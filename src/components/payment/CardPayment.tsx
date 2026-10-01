"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, Clock } from "lucide-react";
import { useRouter } from "next/navigation";

interface CardPaymentProps {
    saleId: string;
    paymentMethodId: string;
    amount: number;
    email: string;
    onSuccess?: () => void;
}

// Pagamento com cartão de crédito está temporariamente indisponível: o
// endpoint Asaas (POST /payment/card) recebe os dados do cartão em claro no
// backend, e a decisão de negócio foi aguardar uma tokenização client-side
// segura antes de reabilitar este formulário (ver isWip em
// mapPaymentMethodToData.tsx, que já bloqueia a seleção deste método).
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function CardPayment(props: CardPaymentProps) {
    const router = useRouter();

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Pagamento com Cartão
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-col items-center text-center gap-3 py-6">
                    <div className="h-12 w-12 bg-amber-100 rounded-full flex items-center justify-center">
                        <Clock className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                        <h3 className="font-medium text-gray-900">Em breve</h3>
                        <p className="text-sm text-gray-600 mt-1">
                            O pagamento com cartão de crédito está temporariamente indisponível
                            enquanto finalizamos a integração segura com o novo gateway de pagamento.
                            Escolha PIX ou boleto para continuar.
                        </p>
                    </div>
                    <Button variant="outline" onClick={() => router.back()}>
                        Voltar
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

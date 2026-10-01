"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Copy, CheckCircle, XCircle, FileText, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { BoletoPaymentResponse, PaymentSyncResponse } from "@/types/types";
import { useRouter } from "next/navigation";

interface BoletoPaymentProps {
    paymentData: BoletoPaymentResponse;
    onSuccess?: () => void;
    phase?: string;
}

export default function BoletoPayment({ paymentData, onSuccess, phase }: BoletoPaymentProps) {
    const router = useRouter();
    const [status, setStatus] = useState<string>(paymentData.payment.status);
    const [cancelling, setCancelling] = useState(false);

    const {
        digitable_line,
        invoice_url,
        expiration_date,
    } = paymentData.payment;

    // Polling para verificar status
    useEffect(() => {
        let intervalId: NodeJS.Timeout;

        const checkStatus = async () => {
            if (status === "completed" || status === "cancelled" || status === "failed") {
                return;
            }

            try {
                // Reutiliza a rota de sync que já criamos para o PIX
                const res = await fetch(`/api/payment/sync/${paymentData.paymentId}`);
                const data: PaymentSyncResponse = await res.json();

                if (data.success && data.payment) {
                    setStatus(data.payment.status);

                    if (data.payment.status === "completed") {
                        toast.success("Pagamento confirmado!");
                        if (onSuccess) onSuccess();
                        router.refresh();
                    }
                }
            } catch (error) {
                console.error("Erro ao verificar status:", error);
            }
        };

        // Verificar a cada 10 segundos (boleto demora mais que PIX)
        if (status === "pending" || status === "action_required") {
            intervalId = setInterval(checkStatus, 10000);
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [status, paymentData.paymentId, onSuccess, router]);

    const copyToClipboard = () => {
        if (!digitable_line) return;
        navigator.clipboard.writeText(digitable_line);
        toast.success("Linha digitável copiada!");
    };

    const handleCancel = async () => {
        if (!confirm("Tem certeza que deseja cancelar este pagamento?")) return;

        try {
            setCancelling(true);
            // Reutiliza a rota de cancelamento do PIX (que aponta para /payment/{id}/cancel)
            // O backend usa o mesmo endpoint para cancelar qualquer pagamento pendente
            const res = await fetch("/api/payment/cancel-pix", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ paymentId: paymentData.paymentId }),
            });

            const data = await res.json();

            if (res.ok) {
                setStatus("cancelled");
                toast.info("Pagamento cancelado.");
            } else {
                toast.error(data.error || "Erro ao cancelar pagamento");
            }
        } catch (error) {
            console.error("Erro ao cancelar:", error);
            toast.error("Erro ao cancelar pagamento");
        } finally {
            setCancelling(false);
        }
    };

    if (status === "completed") {
        const isDownPayment = phase === "down_payment";
        return (
            <Card className="border-green-200 bg-green-50">
                <CardContent className="pt-6 flex flex-col items-center text-center space-y-4">
                    <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-green-800">
                            {isDownPayment ? "Entrada Confirmada!" : "Pagamento Confirmado!"}
                        </h3>
                        <p className="text-green-700">
                            {isDownPayment
                                ? "Pagamento de entrada (30%) recebido. O vendedor será notificado para autorizar a colheita."
                                : "Seu pedido está sendo processado."}
                        </p>
                        {isDownPayment && (
                            <p className="text-sm text-green-600 mt-2">
                                Após o registro da pesagem pelo vendedor, o pagamento do saldo (70%) será liberado.
                            </p>
                        )}
                    </div>
                    <Button
                        onClick={() => router.push("/market/history")}
                        className="bg-green-600 hover:bg-green-700 text-white"
                    >
                        Ver Meus Pedidos
                    </Button>
                </CardContent>
            </Card>
        );
    }

    if (status === "cancelled" || status === "failed") {
        return (
            <Card className="border-red-200 bg-red-50">
                <CardContent className="pt-6 flex flex-col items-center text-center space-y-4">
                    <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center">
                        <XCircle className="h-8 w-8 text-red-600" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-red-800">Pagamento Cancelado</h3>
                        <p className="text-red-700">Este pagamento foi cancelado ou expirou.</p>
                    </div>
                    <Button variant="outline" onClick={() => window.location.reload()}>
                        Tentar Novamente
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-center flex items-center justify-center gap-2">
                    <FileText className="h-5 w-5" />
                    Boleto Bancário
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="text-center space-y-2">
                    <p className="text-sm text-gray-600">
                        Vencimento: <span className="font-medium text-red-600">
                            {new Date(expiration_date).toLocaleDateString('pt-BR')}
                        </span>
                    </p>
                </div>

                {digitable_line ? (
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-gray-700 block">
                            Linha Digitável
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                readOnly
                                value={digitable_line}
                                className="flex-1 px-3 py-2 border rounded-md text-sm bg-gray-50 text-gray-600 focus:outline-none font-mono"
                            />
                            <Button size="icon" variant="outline" onClick={copyToClipboard}>
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                ) : (
                    <p className="text-xs text-center text-gray-500">
                        Use o botão abaixo para visualizar o boleto e obter a linha digitável.
                    </p>
                )}

                <div className="flex flex-col gap-3">
                    <Button
                        className="w-full gap-2"
                        variant="outline"
                        onClick={() => window.open(invoice_url, '_blank')}
                    >
                        <ExternalLink className="h-4 w-4" />
                        Visualizar/Imprimir Boleto
                    </Button>
                </div>

                <div className="pt-4 flex flex-col gap-3 border-t">
                    <div className="flex items-center justify-center gap-2 text-sm text-blue-600 bg-blue-50 p-3 rounded-md">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Aguardando pagamento...
                    </div>
                    <p className="text-xs text-center text-gray-500">
                        A confirmação pode levar de 1 a 3 dias úteis após o pagamento.
                    </p>

                    <Button
                        variant="ghost"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={handleCancel}
                        disabled={cancelling}
                    >
                        {cancelling ? "Cancelando..." : "Cancelar Pagamento"}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

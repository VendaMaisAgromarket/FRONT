'use client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CardContent } from '@/components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { currencyFormatter } from '@/utils/functions'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet'
import {
    Eye,
    MessageSquare,
    ShoppingCart,
    CreditCard,
    CheckCircle,
    FileText,
    LoaderCircle,
    RefreshCw,
    AlertCircle,
    ExternalLink,
    Receipt,
} from 'lucide-react'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { isValidUUID } from '@/lib/validation'
import Image from 'next/image'
import SaleDetailClient from '@/components/sale/SaleDetailClient'
import ContractTemplate from '@/components/sale/ContractTemplate'
import { getContractView } from '@/actions/contract'
import { getAll } from '@/actions/paymentMethods'
import type { SaleData, PaymentMethodsData } from '@/types/types'

export type OrderItemView = {
    productId: number
    name: string
    quantityLabel: string
    imageEmoji?: string
    imageUrl?: string
}

export type OrderView = {
    id: string
    orderNumber?: number
    dateLabel: string
    total: number
    deliveryDateLabel?: string
    actualDeliveryDate?: string
    status: 'delivered' | 'pending' | 'rejected' | 'ready' | 'received' | 'completed' | 'waiting' | 'preparing'
    statusLabel: string
    items: OrderItemView[]
    vendorLabel: string
    paymentCompleted: boolean
    paymentMethodId: string
    sellerApproved: boolean | null
}

function FirstItem({ name, quantityLabel }: { name: string; quantityLabel: string }) {
    return (
        <div className="space-y-1">
            <p className="text-sm text-gray-900">{name}</p>
            <p className="text-sm text-gray-500">{quantityLabel}</p>
        </div>
    )
}

export default React.memo(function OrderCard({ order, saleData }: { order: OrderView; saleData?: SaleData }) {
    const first = order.items?.[0]
    const router = useRouter()

    const downPaymentConfirmed = saleData?.firstInstallmentPaid ?? saleData?.downPaymentCompleted ?? false
    const weightRegistered = !!saleData?.weightDocumentId
    const isAwaitingFinalPayment = saleData?.status === 'Aguardando pagamento final'
    const readyForFinalPayment = weightRegistered || isAwaitingFinalPayment

    // Sheet de detalhe
    const [detailOpen, setDetailOpen] = useState(false)

    // Contrato
    const [contractOpen, setContractOpen] = useState(false)
    const [contractData, setContractData] = useState<Record<string, unknown> | null>(null)
    const [contractLoading, setContractLoading] = useState(false)
    const [contractError, setContractError] = useState<string | null>(null)

    // Alterar forma de pagamento
    const [changeMethodOpen, setChangeMethodOpen] = useState(false)
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethodsData[]>([])
    const [loadingMethods, setLoadingMethods] = useState(false)
    const [selectedMethodId, setSelectedMethodId] = useState('')
    const [changingMethod, setChangingMethod] = useState(false)
    const [changeMethodError, setChangeMethodError] = useState<string | null>(null)
    const [changeMethodSuccess, setChangeMethodSuccess] = useState(false)

    // Pagar saldo final (70%)
    const [finalBoletoOpen, setFinalBoletoOpen] = useState(false)
    const [finalAmount, setFinalAmount] = useState<number | null>(null)
    const [loadingFinalAmount, setLoadingFinalAmount] = useState(false)
    const [finalBoletoResult, setFinalBoletoResult] = useState<{ invoice_url?: string; digitable_line?: string } | null>(null)
    const [generatingFinalBoleto, setGeneratingFinalBoleto] = useState(false)
    const [finalBoletoError, setFinalBoletoError] = useState<string | null>(null)
    // Dados frescos do pedido para garantir cargoWeightKg atualizado ao abrir o dialog
    const [currentSaleData, setCurrentSaleData] = useState<SaleData | undefined>(saleData)

    const handlePayment = () => {
        if (isValidUUID(order.id)) {
            router.push(`/market/payment/${order.id}`)
        }
    }

    async function handleViewContract() {
        setContractOpen(true)
        if (contractData !== null) return
        try {
            setContractLoading(true)
            setContractError(null)
            const productId = saleData?.boughtProducts?.[0]?.productId
            const { contract, ok, error } = await getContractView(order.id, productId)
            if (!ok) throw new Error(error ?? "Erro ao carregar contrato")
            setContractData(contract)
        } catch (e: unknown) {
            setContractError(e instanceof Error ? e.message : "Erro ao carregar contrato")
        } finally {
            setContractLoading(false)
        }
    }

    async function handleOpenChangeMethod() {
        setChangeMethodOpen(true)
        setChangeMethodError(null)
        setChangeMethodSuccess(false)
        if (paymentMethods.length > 0) {
            setSelectedMethodId(order.paymentMethodId)
            return
        }
        setLoadingMethods(true)
        try {
            const methods = await getAll()
            setPaymentMethods(methods)
            setSelectedMethodId(order.paymentMethodId)
        } finally {
            setLoadingMethods(false)
        }
    }

    async function handleConfirmChangeMethod() {
        if (!selectedMethodId) return
        setChangingMethod(true)
        setChangeMethodError(null)
        try {
            const res = await fetch(`/api/sales/${order.id}/payment-method`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ paymentMethodId: selectedMethodId }),
            })
            const data = await res.json() as { error?: string; code?: string }
            if (!res.ok) {
                if (data.code === 'DOWN_PAYMENT_ALREADY_COMPLETED') {
                    setChangeMethodError('A entrada já foi paga e não pode ser alterada.')
                } else if (data.code === 'PAYMENT_ALREADY_COMPLETED') {
                    setChangeMethodError('O pagamento já foi concluído.')
                } else {
                    setChangeMethodError(data.error || 'Erro ao alterar método de pagamento')
                }
                return
            }
            setChangeMethodSuccess(true)
        } catch {
            setChangeMethodError('Erro interno ao alterar método de pagamento')
        } finally {
            setChangingMethod(false)
        }
    }

    function calcFinalAmount(data?: SaleData): number {
        const sd = data ?? currentSaleData ?? saleData
        const bps = sd?.boughtProducts ?? []
        const transport = Number(sd?.transportValue ?? 0)
        const totalProductValue = bps.reduce((acc, bp) => acc + Number(bp.value), 0)
        const originalTotal = totalProductValue + transport

        const weightKg = parseFloat(sd?.cargoWeightKg ?? '0')
        if (weightKg > 0) {
            const totalQty = bps.reduce((acc, bp) => acc + Number(bp.amount), 0)
            const pricePerUnit = totalQty > 0 ? totalProductValue / totalQty : 0
            const newProductTotal = weightKg * pricePerUnit
            const firstInstallmentPaid = originalTotal * 0.3
            return Math.max(0, newProductTotal + transport - firstInstallmentPaid)
        }

        // Sem peso registrado: fallback para 70% do total original
        return originalTotal * 0.7
    }

    async function handleOpenFinalBoleto() {
        setFinalBoletoOpen(true)
        setFinalBoletoError(null)
        if (finalAmount !== null) return
        setLoadingFinalAmount(true)
        try {
            const res = await fetch(`/api/payment-methods/final-amount/${order.id}`, {
                credentials: 'include',
            })
            const data = await res.json() as { amount?: number; error?: string }
            if (res.ok && data.amount != null) {
                setFinalAmount(data.amount)
            } else {
                // Backend não tem o endpoint ainda — busca dados frescos para ter o peso atualizado
                try {
                    const salesRes = await fetch('/api/sale?mine=1', {
                        credentials: 'include',
                        cache: 'no-store',
                    })
                    if (salesRes.ok) {
                        const sales = await salesRes.json() as SaleData[]
                        const freshSale = sales.find(s => s.id === order.id)
                        if (freshSale) {
                            setCurrentSaleData(freshSale)
                            setFinalAmount(calcFinalAmount(freshSale))
                            return
                        }
                    }
                } catch { /* fall through */ }
                setFinalAmount(calcFinalAmount())
            }
        } catch {
            setFinalAmount(calcFinalAmount())
        } finally {
            setLoadingFinalAmount(false)
        }
    }

    async function handleGenerateFinalBoleto() {
        setGeneratingFinalBoleto(true)
        setFinalBoletoError(null)
        try {
            const sd = currentSaleData ?? saleData
            const bps = sd?.boughtProducts ?? []
            const productId = bps[0]?.productId
            const productName = bps[0]?.product?.name ?? 'Produto'
            const quantity = bps.reduce((acc, bp) => acc + Number(bp.amount), 0) || 1
            const totalProdutos = bps.reduce((acc, bp) => acc + Number(bp.value), 0)
            const unit_price = quantity > 0 ? totalProdutos / quantity : totalProdutos

            const res = await fetch('/api/payment/boleto', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    saleId: order.id,
                    paymentMethodId: order.paymentMethodId,
                    productId,
                    title: `Saldo final - ${productName}`,
                    unit_price,
                    quantity,
                    phase: 'final_payment',
                    ...(finalAmount != null && { amount: finalAmount }),
                }),
            })
            const data = await res.json() as { error?: string; payment?: { invoice_url?: string; digitable_line?: string } }
            if (!res.ok) throw new Error(data.error ?? 'Erro ao gerar boleto')
            setFinalBoletoResult({
                invoice_url: data.payment?.invoice_url,
                digitable_line: data.payment?.digitable_line,
            })
        } catch (e: unknown) {
            setFinalBoletoError(e instanceof Error ? e.message : 'Erro ao gerar boleto final')
        } finally {
            setGeneratingFinalBoleto(false)
        }
    }

    const statusBadgeClass = order.status === 'rejected'
        ? 'bg-red-100 text-red-800 hover:bg-red-100'
        : order.status === 'ready'
            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
            : order.status === 'preparing'
                ? downPaymentConfirmed && !order.paymentCompleted
                    ? 'bg-blue-100 text-blue-800 hover:bg-blue-100'
                    : 'bg-blue-100 text-blue-800 hover:bg-blue-100'
                : order.status === 'waiting'
                    ? 'bg-gray-100 text-gray-800 hover:bg-gray-100'
                    : 'bg-green-100 text-green-800 hover:bg-green-100'

    const paymentSection = (
        <>
            {order.paymentCompleted ? (
                <div className="flex items-center justify-center text-green-600 bg-green-50 px-3 py-2 rounded-md text-sm font-medium w-full">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Pagamento confirmado
                </div>
            ) : isAwaitingFinalPayment && !downPaymentConfirmed ? (
                <div className="space-y-2 w-full">
                    <div className="flex items-center justify-center text-amber-700 bg-amber-50 px-3 py-2 rounded-md text-sm font-medium border border-amber-200">
                        <Receipt className="w-4 h-4 mr-2" />
                        Pesagem registrada — pague o saldo restante
                    </div>
                    <Button
                        onClick={handleOpenFinalBoleto}
                        className="w-full bg-green-600 hover:bg-green-700 text-sm h-9 gap-2"
                        size="sm"
                    >
                        <Receipt className="w-4 h-4" />
                        Pagar saldo restante (70%)
                    </Button>
                </div>
            ) : downPaymentConfirmed ? (
                <div className="space-y-2 w-full">
                    {readyForFinalPayment ? (
                        <div className="flex items-center justify-center text-amber-700 bg-amber-50 px-3 py-2 rounded-md text-sm font-medium border border-amber-200">
                            <Receipt className="w-4 h-4 mr-2" />
                            Pesagem registrada — pague o saldo restante
                        </div>
                    ) : (
                        <div className="flex items-center justify-center text-blue-700 bg-blue-50 px-3 py-2 rounded-md text-sm font-medium border border-blue-200">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Entrada confirmada — aguardando colheita
                        </div>
                    )}
                    {readyForFinalPayment ? (
                        <Button
                            onClick={handleOpenFinalBoleto}
                            className="w-full bg-green-600 hover:bg-green-700 text-sm h-9 gap-2"
                            size="sm"
                        >
                            <Receipt className="w-4 h-4" />
                            Pagar saldo restante (70%)
                        </Button>
                    ) : (
                        <div className="text-center text-xs text-gray-500 bg-gray-50 p-2 rounded border border-dashed border-gray-200">
                            Aguardando registro de pesagem pelo vendedor
                        </div>
                    )}
                </div>
            ) : order.sellerApproved === true ? (
                <div className="space-y-2 w-full">
                    <Button
                        onClick={handlePayment}
                        className="bg-green-600 hover:bg-green-700 w-full text-sm h-9 gap-2"
                        size="sm"
                    >
                        <CreditCard className="w-4 h-4" />
                        Pagar entrada (30%)
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-sm h-9 gap-2 text-gray-500"
                        onClick={handleOpenChangeMethod}
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Alterar Forma de Pagamento
                    </Button>
                </div>
            ) : order.status !== 'rejected' ? (
                <div className="text-center text-xs text-gray-500 bg-gray-50 p-2 rounded border border-dashed border-gray-200 w-full">
                    Aguardando aprovação para liberar pagamento
                </div>
            ) : null}
        </>
    )

    return (
        <div className="bg-white md:rounded-lg md:border border-gray-200 md:shadow-sm">
            {/* Mobile */}
            <div className="md:hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600">
                            {order.orderNumber ? <span className="font-medium text-green-700 mr-1">Pedido #{order.orderNumber}</span> : null}
                            feito em {order.dateLabel}
                        </p>
                        <Button variant="link" size="sm" className="text-blue-600 hover:text-blue-700 p-0 h-auto text-sm">
                            Comprar novamente
                        </Button>
                    </div>
                </div>
                <div className="p-4">
                    <div className="flex gap-3">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden relative">
                            {order.items?.[0]?.imageUrl ? (
                                <Image src={order.items[0].imageUrl} alt={order.items[0].name} fill className="object-cover" />
                            ) : (
                                <div className="text-2xl">{order.items?.[0]?.imageEmoji || '🛒'}</div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <Badge variant="secondary" className={`text-xs mb-2 ${statusBadgeClass}`}>
                                {order.statusLabel}
                            </Badge>
                            {order.deliveryDateLabel && (
                                <p className="font-medium text-gray-900 text-sm mb-1">Entregue no dia {order.deliveryDateLabel}</p>
                            )}
                            {first && <FirstItem name={first.name} quantityLabel={first.quantityLabel} />}
                            <p className="text-sm font-semibold text-gray-900 mb-3">Total {currencyFormatter(order.total)}</p>
                            <div className="flex flex-col gap-2">
                                {paymentSection}
                                <Button
                                    className="bg-green-600 hover:bg-green-700 w-full text-sm h-9"
                                    size="sm"
                                    onClick={() => setDetailOpen(true)}
                                >
                                    <Eye className="w-4 h-4 mr-2" />
                                    Ver compra
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full text-sm h-9 gap-2"
                                    onClick={handleViewContract}
                                >
                                    <FileText className="w-4 h-4" />
                                    Ver contrato
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Desktop */}
            <div className="hidden md:block">
                <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-6">
                        <div className="flex gap-4 flex-1">
                            <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center text-3xl overflow-hidden relative">
                                {order.items?.[0]?.imageUrl ? (
                                    <Image src={order.items[0].imageUrl} alt={order.items[0].name} fill className="object-cover" />
                                ) : (
                                    <div className="text-3xl">{order.items?.[0]?.imageEmoji || '🛒'}</div>
                                )}
                            </div>
                            <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className={statusBadgeClass}>
                                        {order.statusLabel}
                                    </Badge>
                                </div>
                                <div className="space-y-1">
                                    {order.deliveryDateLabel && <p className="font-medium text-gray-900">Chegou no dia {order.deliveryDateLabel}</p>}
                                    <p className="text-sm text-gray-600">{order.items?.[0]?.name}</p>
                                    <p className="text-sm text-gray-500">{order.items?.[0]?.quantityLabel}</p>
                                </div>
                            </div>
                        </div>

                        <div className="text-right space-y-3 min-w-[220px]">
                            <div>
                                <p className="text-sm font-medium text-gray-900">{order.vendorLabel}</p>
                                <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700 p-0 h-auto font-normal">
                                    <MessageSquare className="w-4 h-4 mr-1" />
                                    Enviar mensagem ao vendedor
                                </Button>
                            </div>

                            <div className="flex gap-2 flex-wrap justify-end">
                                {paymentSection}
                                <Button variant="outline" size="sm" className="gap-2" onClick={() => setDetailOpen(true)}>
                                    <Eye className="w-4 h-4" />
                                    Ver compra
                                </Button>
                                <Button className="bg-green-600 hover:bg-green-700 gap-2" size="sm">
                                    <ShoppingCart className="w-4 h-4" />
                                    Comprar novamente
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap justify-between items-center gap-3 mt-4 pt-4 border-t border-gray-100">
                        <p className="text-sm text-gray-600">
                            {order.orderNumber ? <span className="font-medium text-green-700 mr-1">Pedido #{order.orderNumber}</span> : null}
                            feito em {order.dateLabel}
                        </p>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" className="gap-2 text-gray-600" onClick={handleViewContract}>
                                <FileText className="w-4 h-4" />
                                Ver contrato
                            </Button>
                            <p className="font-semibold text-gray-900">Total {currencyFormatter(order.total)}</p>
                        </div>
                    </div>
                </CardContent>
            </div>

            {/* Sheet: resumo do pedido */}
            <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
                <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
                    <SheetHeader className="mb-4">
                        <SheetTitle>Resumo do pedido</SheetTitle>
                    </SheetHeader>
                    <SaleDetailClient saleId={order.id} saleData={saleData} showSeller />
                </SheetContent>
            </Sheet>

            {/* Dialog: visualizar contrato */}
            <Dialog open={contractOpen} onOpenChange={setContractOpen}>
                <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Contrato do pedido #{order.orderNumber ?? order.id.substring(0, 8)}</DialogTitle>
                    </DialogHeader>
                    <div className="py-2">
                        {contractLoading && (
                            <div className="flex items-center gap-2 text-gray-500 py-8 justify-center">
                                <LoaderCircle className="w-5 h-5 animate-spin" />
                                Carregando contrato...
                            </div>
                        )}
                        {contractError && <p className="text-sm text-red-600 py-4">{contractError}</p>}
                        {contractData && !contractLoading && (
                            <ContractTemplate mode="read-only" data={contractData} saleData={saleData} />
                        )}
                    </div>
                    <DialogFooter className="flex-col sm:flex-row gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => window.open(`/contrato/preview?saleId=${order.id}`, "_blank")}
                        >
                            <FileText className="w-4 h-4" />
                            Abrir PDF completo
                        </Button>
                        <Button variant="outline" onClick={() => setContractOpen(false)}>Fechar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog: alterar forma de pagamento */}
            <Dialog open={changeMethodOpen} onOpenChange={setChangeMethodOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Alterar Forma de Pagamento</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        {changeMethodSuccess ? (
                            <div className="flex gap-2 text-green-700 bg-green-50 border border-green-200 rounded-md p-3 text-sm">
                                <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                Forma de pagamento alterada com sucesso!
                            </div>
                        ) : loadingMethods ? (
                            <div className="flex items-center gap-2 text-gray-500 justify-center py-4">
                                <LoaderCircle className="w-4 h-4 animate-spin" />
                                Carregando métodos...
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Selecione o novo método</label>
                                <Select value={selectedMethodId} onValueChange={setSelectedMethodId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Escolha um método" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {paymentMethods.map((m) => (
                                            <SelectItem key={m.id} value={m.id}>{m.method}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        {changeMethodError && (
                            <div className="flex gap-2 text-red-600 text-sm">
                                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                <p>{changeMethodError}</p>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setChangeMethodOpen(false)} disabled={changingMethod}>
                            {changeMethodSuccess ? 'Fechar' : 'Cancelar'}
                        </Button>
                        {!changeMethodSuccess && (
                            <Button
                                onClick={handleConfirmChangeMethod}
                                disabled={changingMethod || !selectedMethodId || loadingMethods}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                {changingMethod ? (
                                    <><LoaderCircle className="w-4 h-4 animate-spin mr-2" />Alterando...</>
                                ) : 'Confirmar'}
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog: pagar saldo final (70%) */}
            <Dialog open={finalBoletoOpen} onOpenChange={setFinalBoletoOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Pagar Saldo Restante (70%)</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        {loadingFinalAmount ? (
                            <div className="flex items-center gap-2 text-gray-500 justify-center py-4">
                                <LoaderCircle className="w-4 h-4 animate-spin" />
                                Calculando valor final...
                            </div>
                        ) : finalBoletoResult ? (
                            <div className="space-y-3">
                                <div className="flex gap-2 text-green-700 bg-green-50 border border-green-200 rounded-md p-3 text-sm">
                                    <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                    Boleto gerado com sucesso!
                                </div>
                                {finalBoletoResult.invoice_url && (
                                    <a
                                        href={finalBoletoResult.invoice_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 justify-center w-full bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-md"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        Acessar boleto
                                    </a>
                                )}
                                {finalBoletoResult.digitable_line && (
                                    <div className="space-y-1">
                                        <p className="text-xs text-gray-500 font-medium">Código de barras:</p>
                                        <code className="block text-xs bg-gray-50 border border-gray-200 rounded p-2 break-all select-all">
                                            {finalBoletoResult.digitable_line}
                                        </code>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <p className="text-sm text-gray-600">
                                    Valor do saldo a pagar:
                                </p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {finalAmount != null ? currencyFormatter(finalAmount) : '—'}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {(currentSaleData ?? saleData)?.cargoWeightKg
                                        ? `Calculado: ${(currentSaleData ?? saleData)!.cargoWeightKg} kg × preço/kg − 1ª parcela paga.`
                                        : 'Saldo restante do pedido após pagamento da entrada (30%).'}
                                </p>
                                {finalBoletoError && (
                                    <div className="flex gap-2 text-red-600 text-sm">
                                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                        <p>{finalBoletoError}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setFinalBoletoOpen(false)} disabled={generatingFinalBoleto}>
                            Fechar
                        </Button>
                        {!finalBoletoResult && !loadingFinalAmount && (
                            <Button
                                onClick={handleGenerateFinalBoleto}
                                disabled={generatingFinalBoleto || finalAmount == null}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                {generatingFinalBoleto ? (
                                    <><LoaderCircle className="w-4 h-4 animate-spin mr-2" />Gerando...</>
                                ) : 'Gerar Boleto Final'}
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
})

'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { currencyFormatter } from '@/utils/functions'
import { CreditCard, Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import type { SaleData, PixPaymentResponse, BoletoPaymentResponse, PaymentMethodsData } from '@/types/types'
import { isValidUUID, sanitizeString, isValidPaymentUrl, validatePaymentData } from '@/lib/validation'
import PixPayment from '@/components/payment/PixPayment'
import BoletoPayment from '@/components/payment/BoletoPayment'
import CardPayment from '@/components/payment/CardPayment'
import { getAll } from '@/actions/paymentMethods'
import { isWip } from '@/utils/mappers/mapPaymentMethodToData'
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

export default function PaymentPage() {
    const params = useParams()
    const saleId = params?.saleId as string | undefined

    const [sale, setSale] = useState<SaleData | null>(null)
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [pixData, setPixData] = useState<PixPaymentResponse | null>(null)
    const [boletoData, setBoletoData] = useState<BoletoPaymentResponse | null>(null)
    const [showCardForm, setShowCardForm] = useState(false)

    // Alterar forma de pagamento
    const [changeMethodOpen, setChangeMethodOpen] = useState(false)
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethodsData[]>([])
    const [loadingMethods, setLoadingMethods] = useState(false)
    const [selectedMethodId, setSelectedMethodId] = useState('')
    const [changingMethod, setChangingMethod] = useState(false)
    const [changeMethodError, setChangeMethodError] = useState<string | null>(null)

    const fetchSale = useCallback(async () => {
        if (!saleId) {
            setError('ID do pedido não encontrado')
            setLoading(false)
            return
        }
        if (!isValidUUID(saleId)) {
            setError('ID do pedido inválido')
            setLoading(false)
            return
        }
        try {
            setLoading(true)
            const res = await fetch('/api/sale?mine=1', {
                credentials: 'include',
                cache: 'no-store',
            })
            if (!res.ok) {
                setError(res.status === 404 ? 'Pedido não encontrado' : 'Erro ao carregar dados do pedido')
                return
            }
            const sales: SaleData[] = await res.json()
            const saleData = sales.find((s) => s.id === saleId)
            if (!saleData) { setError('Pedido não encontrado'); return }
            if (!saleData.paymentMethodId) { setError('Método de pagamento não encontrado no pedido'); return }
            setSale(saleData)
        } catch {
            setError('Erro ao carregar dados do pedido')
        } finally {
            setLoading(false)
        }
    }, [saleId])

    useEffect(() => { fetchSale() }, [fetchSale])

    const handlePayment = async () => {
        if (!sale) return

        if (!sale.boughtProducts || sale.boughtProducts.length === 0) {
            setError('Pedido sem produtos')
            return
        }
        if (!sale.boughtProducts[0]?.productId) {
            setError('Dados do produto inválidos')
            return
        }

        try {
            setProcessing(true)
            setError(null)

            const totalProdutos = sale.boughtProducts.reduce((acc, bp) => acc + Number(bp.value || 0), 0)
            const quantidadeTotal = sale.boughtProducts.reduce((acc, bp) => acc + Number(bp.amount || 0), 0)
            const totalFrete = Number(sale.transportValue || 0)
            const totalGeral = totalProdutos + totalFrete
            const precoMedio = quantidadeTotal > 0 ? totalProdutos / quantidadeTotal : 0

            const vendorName = sanitizeString(
                sale.boughtProducts[0]?.product?.seller?.name || 'Vendedor',
                50
            )

            const paymentMethodId = sale.paymentMethodId
            const methodName = sale.paymentMethod?.method || ''

            const isPix = (String(paymentMethodId).toLowerCase().includes('pix') ||
                methodName.toLowerCase().includes('pix')) &&
                !methodName.toLowerCase().includes('boleto')

            const isBoleto = String(paymentMethodId).toLowerCase().includes('boleto') ||
                methodName.toLowerCase().includes('boleto') ||
                methodName.toLowerCase().includes('ticket')

            const isCard = String(paymentMethodId).toLowerCase().includes('card') ||
                methodName.toLowerCase().includes('cartão') ||
                methodName.toLowerCase().includes('credit')

            if (isCard) {
                setShowCardForm(true)
                setProcessing(false)
                return
            }

            if (!paymentMethodId) {
                setError('Método de pagamento não encontrado no pedido')
                setProcessing(false)
                return
            }

            // amount: totalGeral satisfaz a validação de schema do backend.
            // Para phase down_payment o backend ignora esse valor e calcula os
            // 30% corretos a partir dos boughtProducts + transportValue no banco.
            const paymentData = {
                saleId: sale.id,
                paymentMethodId: String(paymentMethodId).trim(),
                productId: sale.boughtProducts[0].productId,
                title: sanitizeString(`Pedido ${sale.id.substring(0, 8)} - ${vendorName}`, 100),
                unit_price: precoMedio,
                quantity: quantidadeTotal,
                amount: totalGeral * 0.3,
                email: sale.buyer?.email || 'email@nao-informado.com',
                phase: 'down_payment' as const,
                ...(isPix && { expirationMinutes: 1440 }),
                ...(isBoleto && { expirationDays: 3 }),
            }

            const validation = validatePaymentData(paymentData)
            if (!validation.valid) {
                setError(validation.error || 'Dados inválidos')
                setProcessing(false)
                return
            }

            let endpoint = '/api/payment/preference'
            if (isPix) endpoint = '/api/payment/pix'
            if (isBoleto) endpoint = '/api/payment/boleto'

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(paymentData),
            })

            const result = await res.json()

            if (!res.ok) {
                let errorMessage = 'Erro ao criar pagamento'
                if (result.message) {
                    errorMessage = result.message.includes('UNAUTHORIZED')
                        ? 'Erro de autenticação com o gateway de pagamento. Verifique a configuração do token de acesso.'
                        : result.message
                } else if (result.error) {
                    errorMessage = result.error
                }
                setError(errorMessage)
                return
            }

            if (isPix) {
                setPixData(result as PixPaymentResponse)
            } else if (isBoleto) {
                setBoletoData(result as BoletoPaymentResponse)
            } else {
                if (result.init_point) {
                    if (isValidPaymentUrl(result.init_point)) {
                        window.location.href = result.init_point
                    } else {
                        setError('URL de pagamento inválida')
                    }
                } else {
                    setError('URL de pagamento não foi retornada')
                }
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Erro ao processar pagamento')
        } finally {
            setProcessing(false)
        }
    }

    const handleOpenChangeMethod = async () => {
        setChangeMethodOpen(true)
        setChangeMethodError(null)
        if (paymentMethods.length > 0) {
            setSelectedMethodId(sale?.paymentMethodId ?? '')
            return
        }
        setLoadingMethods(true)
        try {
            const methods = await getAll()
            setPaymentMethods(methods.filter((m: PaymentMethodsData) => !isWip(m.method.toLowerCase())))
            setSelectedMethodId(sale?.paymentMethodId ?? '')
        } finally {
            setLoadingMethods(false)
        }
    }

    const handleConfirmChangeMethod = async () => {
        if (!sale || !selectedMethodId) return
        setChangingMethod(true)
        setChangeMethodError(null)
        try {
            const res = await fetch(`/api/sales/${sale.id}/payment-method`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ paymentMethodId: selectedMethodId }),
            })
            const data = await res.json()
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
            setChangeMethodOpen(false)
            setPixData(null)
            setBoletoData(null)
            setShowCardForm(false)
            await fetchSale()
        } catch {
            setChangeMethodError('Erro interno ao alterar método de pagamento')
        } finally {
            setChangingMethod(false)
        }
    }

    if (loading) {
        return (
            <div className="py-8 px-4">
                <div className="max-w-4xl mx-auto space-y-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Checkout de Pagamento</h1>
                    </div>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="md:col-span-2">
                            <Card>
                                <CardHeader><CardTitle>Resumo do Pedido</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-20" />
                                        <Skeleton className="h-5 w-48" />
                                    </div>
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-20" />
                                        <div className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
                                            <div className="flex-1 space-y-2">
                                                <Skeleton className="h-4 w-32" />
                                                <Skeleton className="h-3 w-24" />
                                            </div>
                                            <Skeleton className="h-4 w-16" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                        <div className="md:col-span-1">
                            <Card className="sticky top-6">
                                <CardHeader><CardTitle>Resumo de Pagamento</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-3">
                                        <div className="flex justify-between"><Skeleton className="h-4 w-16" /><Skeleton className="h-4 w-20" /></div>
                                        <div className="flex justify-between"><Skeleton className="h-4 w-12" /><Skeleton className="h-4 w-20" /></div>
                                        <div className="pt-3 border-t"><div className="flex justify-between"><Skeleton className="h-5 w-12" /><Skeleton className="h-6 w-24" /></div></div>
                                    </div>
                                    <div className="pt-4"><Skeleton className="h-12 w-full" /></div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (error && !sale) {
        return (
            <div className="py-8 px-4">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
                        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-800">{error}</p>
                    </div>
                </div>
            </div>
        )
    }

    if (!sale) return null

    const totalProdutos = sale.boughtProducts.reduce((acc, bp) => acc + Number(bp.value), 0)
    const totalFrete = Number(sale.transportValue || 0)
    const totalGeral = totalProdutos + totalFrete
    const entradaValor = totalGeral * 0.3
    const saldoValor = totalGeral * 0.7

    const vendorName = sale.boughtProducts[0]?.product?.seller?.name || 'Vendedor desconhecido'

    if (pixData) {
        return (
            <div className="py-8 px-4">
                <div className="max-w-md mx-auto space-y-6">
                    <PixPayment
                        paymentData={pixData}
                        phase="down_payment"
                        onSuccess={() => setSale(prev => prev ? { ...prev, downPaymentCompleted: true, firstInstallmentPaid: true } : null)}
                    />
                </div>
            </div>
        )
    }

    if (boletoData) {
        return (
            <div className="py-8 px-4">
                <div className="max-w-md mx-auto space-y-6">
                    <BoletoPayment
                        paymentData={boletoData}
                        phase="down_payment"
                        onSuccess={() => setSale(prev => prev ? { ...prev, downPaymentCompleted: true, firstInstallmentPaid: true } : null)}
                    />
                </div>
            </div>
        )
    }

    const isCardMethod = sale.paymentMethod?.method?.toLowerCase().includes('cartão') ||
        sale.paymentMethod?.method?.toLowerCase().includes('credit') ||
        String(sale.paymentMethodId).toLowerCase().includes('card')

    if (isCardMethod && !(sale.finalPaymentPaid ?? sale.paymentCompleted) && showCardForm) {
        return (
            <div className="py-8 px-4">
                <div className="max-w-md mx-auto space-y-6">
                    <Button variant="ghost" onClick={() => setShowCardForm(false)} className="mb-4">
                        ← Voltar para resumo
                    </Button>
                    <CardPayment
                        saleId={sale.id}
                        paymentMethodId={sale.paymentMethodId}
                        amount={totalGeral}
                        email={sale.buyer?.email || ''}
                        onSuccess={() => setSale(prev => prev ? { ...prev, downPaymentCompleted: true, firstInstallmentPaid: true } : null)}
                    />
                </div>
            </div>
        )
    }

    return (
        <div className="py-8 px-4">
            <div className="max-w-4xl mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Checkout de Pagamento</h1>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
                        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-800">{error}</p>
                    </div>
                )}

                <div className="grid md:grid-cols-3 gap-6">
                    {/* Resumo do Pedido */}
                    <div className="md:col-span-2 space-y-6">
                        <Card>
                            <CardHeader><CardTitle>Resumo do Pedido</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-gray-700">Vendedor</p>
                                    <p className="text-sm text-gray-900">{vendorName}</p>
                                </div>

                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-gray-700">Produtos</p>
                                    <div className="space-y-3">
                                        {sale.boughtProducts.map((bp, index) => (
                                            <div key={index} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-gray-900">{bp.product?.name || 'Produto'}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {(() => {
                                                            const unit = bp.sellingUnitProduct?.unit?.unit || bp.sellingUnitProduct?.unit?.title || 'un'
                                                            return `${bp.amount} ${unit}`
                                                        })()}
                                                    </p>
                                                </div>
                                                <p className="text-sm font-semibold text-gray-900">{currencyFormatter(Number(bp.value))}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {sale.shippingAddress && (
                                    <div className="space-y-2 pt-4 border-t">
                                        <p className="text-sm font-medium text-gray-700">Endereço de Entrega</p>
                                        <div className="text-sm text-gray-600">
                                            <p>{sale.shippingAddress.street}, {sale.shippingAddress.number}</p>
                                            {sale.shippingAddress.complement && <p>{sale.shippingAddress.complement}</p>}
                                            <p>{sale.shippingAddress.city} - {sale.shippingAddress.uf}</p>
                                            <p>CEP: {sale.shippingAddress.cep}</p>
                                            <p>Destinatário: {sale.shippingAddress.addressee}</p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Resumo de Pagamento */}
                    <div className="md:col-span-1">
                        <Card className="sticky top-6">
                            <CardHeader><CardTitle>Resumo de Pagamento</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Subtotal</span>
                                        <span className="text-gray-900 font-medium">{currencyFormatter(totalProdutos)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Frete</span>
                                        <span className="text-gray-900 font-medium">{currencyFormatter(totalFrete)}</span>
                                    </div>
                                    <div className="pt-3 border-t">
                                        <div className="flex justify-between">
                                            <span className="text-base font-semibold text-gray-900">Total</span>
                                            <span className="text-lg font-bold text-gray-900">{currencyFormatter(totalGeral)}</span>
                                        </div>
                                    </div>
                                    {/* Breakdown 30/70 */}
                                    {!(sale.finalPaymentPaid ?? sale.paymentCompleted) && (
                                        <div className="pt-2 space-y-1.5 border-t">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-blue-700 font-medium">Entrada (30%)</span>
                                                <span className="text-blue-700 font-semibold">{currencyFormatter(entradaValor)}</span>
                                            </div>
                                            <div className="flex justify-between text-xs text-gray-500">
                                                <span>Saldo restante (70%)</span>
                                                <span>{currencyFormatter(saldoValor)}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-4">
                                    {(sale.finalPaymentPaid ?? sale.paymentCompleted) ? (
                                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                                            <p className="text-green-800 font-medium">Pagamento Concluído</p>
                                            <p className="text-xs text-green-600 mt-1">Seu pedido já foi pago.</p>
                                        </div>
                                    ) : (sale.firstInstallmentPaid ?? sale.downPaymentCompleted) ? (
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                                            <p className="text-blue-800 font-medium">Entrada confirmada</p>
                                            <p className="text-xs text-blue-600 mt-1">Aguardando colheita para pagamento do saldo de {currencyFormatter(saldoValor)}</p>
                                        </div>
                                    ) : (
                                        <Button
                                            onClick={handlePayment}
                                            disabled={processing}
                                            className="w-full bg-green-600 hover:bg-green-700 gap-2"
                                            size="lg"
                                        >
                                            {processing ? (
                                                <><Loader2 className="w-4 h-4 animate-spin" />Processando...</>
                                            ) : (
                                                <><CreditCard className="w-4 h-4" />Pagar entrada (30%)</>
                                            )}
                                        </Button>
                                    )}
                                </div>

                                {!(sale.firstInstallmentPaid ?? sale.downPaymentCompleted) && !(sale.finalPaymentPaid ?? sale.paymentCompleted) && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleOpenChangeMethod}
                                        className="w-full text-gray-500 gap-2"
                                    >
                                        <RefreshCw className="w-3.5 h-3.5" />
                                        Alterar Forma de Pagamento
                                    </Button>
                                )}

                                <div className="pt-4 border-t">
                                    <p className="text-xs text-gray-500 text-center">
                                        Ambiente seguro. Seus dados estão protegidos.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Dialog: Alterar Forma de Pagamento */}
            <Dialog open={changeMethodOpen} onOpenChange={setChangeMethodOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Alterar Forma de Pagamento</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        {loadingMethods ? (
                            <div className="flex items-center gap-2 text-gray-500 justify-center py-4">
                                <Loader2 className="w-4 h-4 animate-spin" />
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
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleConfirmChangeMethod}
                            disabled={changingMethod || !selectedMethodId || loadingMethods}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {changingMethod ? (
                                <><Loader2 className="w-4 h-4 animate-spin mr-2" />Alterando...</>
                            ) : 'Confirmar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

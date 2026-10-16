'use client'
import { notFound, usePathname, useRouter } from 'next/navigation'
import React, { use, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, ShoppingCart } from 'lucide-react'
import OrderCard, { OrderView } from './components/OrderCard'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate, calcAdjustedTotal } from '@/utils/functions'
import type { SaleData, SaleBoughtProduct } from '@/types/types'

function resolveProductName(bp: SaleBoughtProduct): string {
  const n = bp.product?.name
  return n ? String(n) : `Produto #${bp.productId ?? ''}`.trim()
}

export default function OrderHistoryPage({ searchParams }: { searchParams: Promise<{ saleId?: string }> }) {
  const { saleId: focusSaleId } = use(searchParams)
  const router = useRouter()
  const pathname = usePathname()
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'recent' | 'oldest' | 'price-high' | 'price-low'>('recent')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'delivered' | 'rejected'>('all')
  const [periodFilter, setPeriodFilter] = useState<'all' | 'week' | 'fortnight' | 'month' | 'year'>('all')
  const [orders, setOrders] = useState<(OrderView & { createdAtISO: string })[]>([])
  const [rawSales, setRawSales] = useState<SaleData[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
      ; (async () => {
        try {
          setLoading(true)
          setLoadError(false)
          const res = await fetch('/api/sale?mine=1', { cache: 'no-store', credentials: 'include', signal: controller.signal })
          if (res.status === 404) return notFound()
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          const sales: SaleData[] = await res.json()

          const mapped: (OrderView & { createdAtISO: string })[] = sales.map((s) => {
            const items = (s.boughtProducts ?? []).map((bp) => {
              // Obter a unidade de venda do endpoint (unit.unit ou unit.title)
              const unit = bp.sellingUnitProduct?.unit?.unit || bp.sellingUnitProduct?.unit?.title || 'un'
              return {
                productId: Number(bp.productId),
                name: resolveProductName(bp),
                quantityLabel: `${Number(bp.amount)} ${unit}`,
                imageUrl: bp.product?.images_Path?.[0]
              }
            })

            const total = calcAdjustedTotal(s)

            const vendorLabel =
              s.boughtProducts?.[0]?.product?.sellerId != null || s.boughtProducts?.[0]?.product?.seller
                ? s.boughtProducts?.[0]?.product?.seller?.name ?? 'Vendedor desconhecido'
                : 'Vendedor desconhecido'

            let status: 'delivered' | 'pending' | 'rejected' | 'ready' | 'received' | 'completed' | 'waiting' | 'preparing' = 'waiting'
            let statusLabel = 'Aguardando confirmação'

            // Mapping backend status to frontend status and label
            if (s.sellerApproved === false || s.status === 'Recusado pelo vendedor' || s.status === 'Cancelado') {
              status = 'rejected'
              statusLabel = 'Pedido recusado'
            } else if (s.arrivedAt || s.status === 'Concluído') {
              status = 'completed'
              statusLabel = 'Pedido concluído'
            } else if (s.status === 'Disponível para entrega' || s.status === 'Disponível para retirada') {
              status = 'ready'
              statusLabel = 'Disponível para entrega'
            } else if (s.status === 'Aguardando pagamento final') {
              status = 'preparing'
              statusLabel = 'Aguardando pagamento final (70%)'
            } else if (s.status === 'Em pesagem') {
              status = 'preparing'
              statusLabel = 'Em pesagem pelo vendedor'
            } else if (s.status === 'Colheita concluída') {
              status = 'preparing'
              statusLabel = 'Colheita concluída'
            } else if (s.status === 'Colheita autorizada') {
              status = 'preparing'
              statusLabel = 'Colheita autorizada'
            } else if (s.status === 'Entrada confirmada' || s.status === 'Entrada confirmada - aguardando colheita' || (s.sellerApproved === true && (s.firstInstallmentPaid ?? s.downPaymentCompleted) && !(s.finalPaymentPaid ?? s.paymentCompleted))) {
              status = 'preparing'
              statusLabel = 'Entrada confirmada — aguardando colheita'
            } else if (s.sellerApproved === true) {
              status = 'preparing'
              statusLabel = 'Em preparação'
            } else {
              status = 'waiting'
              statusLabel = 'Aguardando confirmação'
            }

            return {
              id: s.id,
              orderNumber: s.orderNumber,
              dateLabel: formatDate(s.createdAt),
              createdAtISO: s.createdAt,
              total,
              deliveryDateLabel: s.arrivedAt ? formatDate(s.arrivedAt) : undefined,
              actualDeliveryDate: s.actualDeliveryDate,
              status,
              statusLabel,
              items,
              vendorLabel,
              paymentCompleted: s.finalPaymentPaid ?? s.paymentCompleted ?? false,
              paymentMethodId: s.paymentMethodId,
              sellerApproved: s.sellerApproved ?? null
            }
          })

          setOrders(mapped)
          setRawSales(sales)
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (e: unknown) {
          if (!controller.signal.aborted) {
            setOrders([])
            setLoadError(true)
          }
        } finally {
          if (!controller.signal.aborted) setLoading(false)
        }
      })()

    return () => controller.abort()
  }, [])

  // Deep link vindo de uma notificação (?saleId=): o OrderCard abre o detalhe;
  // aqui só avisamos se a compra não existe mais e limpamos a URL. Só depois de um
  // carregamento bem-sucedido: numa falha a lista vem vazia e o saleId é mantido.
  useEffect(() => {
    if (!focusSaleId || loading || loadError) return
    if (!orders.some((o) => o.id === focusSaleId)) {
      toast.warning('Este pedido não está mais disponível.')
    }
    router.replace(pathname, { scroll: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusSaleId, loading, loadError])

  const filteredOrders = useMemo(() => {
    const term = searchTerm.toLowerCase()
    const now = new Date()

    const list = orders
      .filter((order) => {
        // Text Search
        const matchVendor = (order.vendorLabel || '').toLowerCase().includes(term)
        const matchItem = order.items.some((item) => (item.name || '').toLowerCase().includes(term) || (item.quantityLabel || '').toLowerCase().includes(term))
        const matchText = matchVendor || matchItem

        // Status Filter
        let matchStatus = true
        if (statusFilter === 'pending') matchStatus = order.status === 'waiting' || order.status === 'preparing' || order.status === 'pending' || order.status === 'received' || order.status === 'ready'
        if (statusFilter === 'delivered') matchStatus = order.status === 'completed' || order.status === 'delivered'
        if (statusFilter === 'rejected') matchStatus = order.status === 'rejected'

        // Period Filter
        let matchPeriod = true
        if (periodFilter !== 'all') {
          const orderDate = new Date(order.createdAtISO)
          const diffTime = Math.abs(now.getTime() - orderDate.getTime())
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

          if (periodFilter === 'week') matchPeriod = diffDays <= 7
          if (periodFilter === 'fortnight') matchPeriod = diffDays <= 15
          if (periodFilter === 'month') matchPeriod = diffDays <= 30
          if (periodFilter === 'year') matchPeriod = diffDays <= 365
        }

        return matchText && matchStatus && matchPeriod
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'oldest':
            return new Date(a.createdAtISO).getTime() - new Date(b.createdAtISO).getTime()
          case 'price-high':
            return b.total - a.total
          case 'price-low':
            return a.total - b.total
          case 'recent':
          default:
            return new Date(b.createdAtISO).getTime() - new Date(a.createdAtISO).getTime()
        }
      })
    return list
  }, [orders, searchTerm, sortBy, statusFilter, periodFilter])

  const SkeletonHeader = (
    <div className="hidden md:block max-w-6xl mx-auto space-y-4 px-4 py-6">
      <Skeleton className="h-7 w-64" />
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-10 w-44" />
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {loading ? (
        <>
          {SkeletonHeader}
          <div className="md:max-w-6xl md:mx-auto md:px-4 space-y-3 md:space-y-4 pb-6 px-4">
            {[1, 2, 3].map(k => (
              <div key={k} className="bg-white md:rounded-lg md:border border-gray-200 md:shadow-sm p-4 md:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-3 flex-1">
                    <Skeleton className="w-16 h-16 md:w-20 md:h-20 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </div>
                  <div className="space-y-2 text-right">
                    <Skeleton className="h-4 w-28 ml-auto" />
                    <Skeleton className="h-9 w-32 ml-auto" />
                  </div>
                </div>
                <Skeleton className="h-4 w-40 mt-4" />
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="hidden md:block max-w-6xl mx-auto space-y-4 px-4 py-6">
            <h1 className="text-2xl font-bold text-gray-900">Histórico de pedidos</h1>
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
              <div className="relative flex-1 w-full md:max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Buscar produtos ou vendedores"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  aria-label="Buscar pedidos"
                />
              </div>

              <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                <Select value={statusFilter} onValueChange={(v: 'all' | 'pending' | 'delivered' | 'rejected') => setStatusFilter(v)}>
                  <SelectTrigger className="w-[140px] bg-white hover:bg-accent hover:text-accent-foreground font-semibold">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Status</SelectItem>
                    <SelectItem value="pending">Pendentes</SelectItem>
                    <SelectItem value="delivered">Entregues</SelectItem>
                    <SelectItem value="rejected">Recusados</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={periodFilter} onValueChange={(v: 'all' | 'week' | 'fortnight' | 'month' | 'year') => setPeriodFilter(v)}>
                  <SelectTrigger className="w-[150px] bg-white hover:bg-accent hover:text-accent-foreground font-semibold">
                    <SelectValue placeholder="Período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Período</SelectItem>
                    <SelectItem value="week">Última semana</SelectItem>
                    <SelectItem value="fortnight">Última quinzena</SelectItem>
                    <SelectItem value="month">Último mês</SelectItem>
                    <SelectItem value="year">Último ano</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={(v: 'recent' | 'oldest' | 'price-high' | 'price-low') => setSortBy(v)}>
                  <SelectTrigger className="w-[140px] bg-white hover:bg-accent hover:text-accent-foreground font-semibold">
                    <SelectValue placeholder="Ordenar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Ordenar</SelectItem>
                    <SelectItem value="price-high">Maior preço</SelectItem>
                    <SelectItem value="price-low">Menor preço</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="md:max-w-6xl md:mx-auto md:px-4 space-y-3 md:space-y-4 pb-6">
            {filteredOrders.map((order) => <OrderCard key={order.id} order={order} saleData={rawSales.find((s) => s.id === order.id)} autoOpenDetails={order.id === focusSaleId} />)}
          </div>

          {filteredOrders.length === 0 && (
            <div className="text-center py-12 px-4">
              <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <ShoppingCart className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum pedido encontrado</h3>
              <p className="text-gray-600 mb-3">Tente ajustar seus filtros ou termos de busca</p>
              <Button variant="outline" onClick={() => setSearchTerm('')}>Limpar filtros</Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
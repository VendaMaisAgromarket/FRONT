"use client";

import { getSalesData, updateSaleStatus, updateSellerDecision } from "@/actions/sales";
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, EyeOff, FileText } from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Order, OrderStatus, SaleData } from "@/types/types";
import { calcAdjustedTotal } from "@/utils/functions";
import ContractTemplate, { ContractContextData } from "@/components/sale/ContractTemplate";
import { getContractView, acceptContract } from "@/actions/contract";
import {
	Calendar,
	ChevronDown,
	Hash,
	LoaderCircle,
	Plus,
	Search,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useNotificationsStore } from "@/store/notificationsStore";
import { useEffect, useMemo, useState } from "react";
import { OrderCard } from "./OrderCard";
import { OrdersPageSkeleton } from "./OrdersPageSkeleton";
import { StatCard } from "./StatCard";

const statusMap: Record<string, OrderStatus> = {
	"Pedido realizado!": "new",
	"Em processamento": "processing",
	"Entrada confirmada": "down_payment_confirmed",
	"Entrada confirmada - aguardando colheita": "down_payment_confirmed",
	"Colheita autorizada": "harvest_authorized",
	"Colheita concluída": "harvest_completed",
	"Em pesagem": "weighing",
	"Aguardando pagamento final": "awaiting_final_payment",
	"Disponível para retirada": "pickup",
	"Disponível para entrega": "pickup",
	Concluído: "completed",
	Cancelado: "cancelled",
};

const reverseStatusMap: Record<OrderStatus, string> = {
	new: "Pedido realizado!",
	processing: "Em processamento",
	down_payment_confirmed: "Entrada confirmada",
	harvest_authorized: "Colheita autorizada",
	harvest_completed: "Colheita concluída",
	weighing: "Em pesagem",
	awaiting_final_payment: "Aguardando pagamento final",
	pickup: "Disponível para entrega",
	completed: "Concluído",
	cancelled: "Cancelado",
};

type StatusOption = { value: OrderStatus; label: string; disabled?: boolean; hint?: string };

function getAvailableNextStatuses(current: OrderStatus, sale?: SaleData): StatusOption[] {
	const downPaid = sale?.firstInstallmentPaid ?? sale?.downPaymentCompleted ?? false;
	const finalPaid = sale?.finalPaymentPaid ?? sale?.paymentCompleted ?? false;

	switch (current) {
		case "new":
		case "processing":
		case "down_payment_confirmed":
			return [{
				value: "harvest_authorized",
				label: "Colheita autorizada",
				disabled: !downPaid,
				hint: !downPaid ? "Aguardando confirmação do pagamento da entrada (30%)" : undefined,
			}];
		case "harvest_authorized":
			return [{ value: "harvest_completed", label: "Colheita concluída" }];
		case "harvest_completed":
			return [{ value: "weighing", label: "Em pesagem" }];
		case "awaiting_final_payment":
			return [{
				value: "pickup",
				label: "Disponível para entrega",
				disabled: !finalPaid,
				hint: !finalPaid ? "Aguardando confirmação do pagamento final (70%)" : undefined,
			}];
		case "pickup":
			return [{ value: "completed", label: "Concluído" }];
		default:
			return [];
	}
}

// Função para transformar dados da API em formato de Order
function transformSaleDataToOrder(sale: SaleData): Order {
	// Criar string de produtos comprados (objetos aninhados podem não vir em produção)
	const productsString = (sale.boughtProducts ?? [])
		.map((bp) => {
			const unit = bp.sellingUnitProduct?.unit?.unit ?? bp.sellingUnitProduct?.unit?.title ?? "";
			const name = bp.product?.name ?? `Produto #${bp.productId}`;
			return unit ? `${bp.amount}${unit} ${name}` : `${bp.amount}x ${name}`;
		})
		.join(", ");

	const totalValue = calcAdjustedTotal(sale);

	return {
		id: sale.id,
		orderNumber: sale.orderNumber,
		buyer: sale.buyer?.name ?? "Comprador",
		product: productsString || "—",
		value: totalValue,
		payment: sale.paymentMethod?.method ?? "",
		paymentCompleted: sale.finalPaymentPaid ?? sale.paymentCompleted,
		status: statusMap[sale.status] || "new",
		action:
			sale.sellerApproved === true
				? "accepted"
				: sale.sellerApproved === false
					? "rejected"
					: null,
		cargoWeightKg: sale.cargoWeightKg || "",
		createdAt: sale.createdAt,
		decisionAt: sale.sellerApproved !== null && sale.sellerApproved !== undefined
			? (sale.sellerApprovedAt ?? sale.updatedAt)
			: undefined,
	};
}

export default function OrdersClient({ focusSaleId }: { focusSaleId?: string }) {
	const router = useRouter();
	const pathname = usePathname();
	const refreshUnreadCount = useNotificationsStore((s) => s.refreshUnreadCount);
	const [query, setQuery] = useState("");
	const [orders, setOrders] = useState<Order[]>([]);
	const [rawSales, setRawSales] = useState<SaleData[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
	const [nextStatus, setNextStatus] = useState<OrderStatus>("processing");
	const [updateError, setUpdateError] = useState<string | null>(null);
	const [isUpdating, setIsUpdating] = useState(false);
	const [isAccepting, setIsAccepting] = useState(false);

	// Modal de termos (aceite antes de aceitar pedido)
	const [termsDialogOpen, setTermsDialogOpen] = useState(false);
	const [termsExpanded, setTermsExpanded] = useState(false);
	const [termsAccepted, setTermsAccepted] = useState(false);
	const [pendingAcceptOrderId, setPendingAcceptOrderId] = useState<string | null>(null);

	// Datas a preencher na aceitação
	const [plannedHarvestDate, setPlannedHarvestDate] = useState("");
	const [plannedPickupDate, setPlannedPickupDate] = useState("");
	const [plannedDeliveryDate, setPlannedDeliveryDate] = useState("");
	const [acceptDateError, setAcceptDateError] = useState<string | null>(null);

	// Dados do contrato carregados via getContractView ao abrir o diálogo de aceite
	const [acceptanceContractData, setAcceptanceContractData] = useState<ContractContextData | null>(null);
	const [acceptanceContractLoading, setAcceptanceContractLoading] = useState(false);

	// Cache local das conditions aceitas pelo vendedor (saleId → conditions)
	// Garante que "Ver contrato" mostre os dados corretos mesmo antes do backend sincronizar
	const [acceptedConditionsMap, setAcceptedConditionsMap] = useState<Record<string, Record<string, unknown>>>({});

	// Carregar dados do backend
	async function loadSalesData(showLoading = true) {
		try {
			if (showLoading) setLoading(true);
			setError(null);
			const salesData = await getSalesData();
			const transformedOrders = salesData.sales.map(transformSaleDataToOrder);
			setOrders(transformedOrders);
			setRawSales(salesData.sales);
		} catch (err) {
			console.error("Erro ao carregar dados de vendas:", err);
			setError("Erro ao carregar dados de vendas");
		} finally {
			if (showLoading) setLoading(false);
		}
	}

	useEffect(() => {
		loadSalesData();
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Deep link vindo de uma notificação (?saleId=): o OrderCard abre o detalhe;
	// aqui só avisamos se a venda não existe mais e limpamos a URL, para que um
	// novo clique na mesma notificação volte a abrir o detalhe.
	useEffect(() => {
		if (!focusSaleId || loading || error) return;
		if (!orders.some((o) => o.id === focusSaleId)) {
			toast.warning("Este pedido não está mais disponível.");
		}
		router.replace(pathname, { scroll: false });
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [focusSaleId, loading, error]);

	const filtered = useMemo(() => {
		const q = query.trim();
		if (!q) return orders;
		return orders.filter((o) => String(o.orderNumber ?? o.id).includes(q));
	}, [orders, query]);

	const counters = useMemo(() => {
		const result = { new: 0, active: 0, awaitingPayment: 0, done: 0 };
		for (const o of orders) {
			if (o.action === "rejected") continue;
			if (o.status === "new") result.new++;
			else if (["processing", "down_payment_confirmed", "harvest_authorized", "harvest_completed", "weighing"].includes(o.status)) result.active++;
			else if (o.status === "awaiting_final_payment") result.awaitingPayment++;
			else if (["pickup", "completed"].includes(o.status)) result.done++;
		}
		return result;
	}, [orders]);

	function openStatusDialog(orderId: string, current: OrderStatus) {
		setSelectedOrderId(orderId);
		const sale = rawSales.find(s => s.id === orderId);
		const available = getAvailableNextStatuses(current, sale);
		const firstEnabled = available.find(s => !s.disabled) ?? available[0];
		setNextStatus(firstEnabled?.value ?? current);
		setUpdateError(null);
		setDialogOpen(true);
	}

	async function confirmStatusChange() {
		if (selectedOrderId == null) return;

		try {
			setIsUpdating(true);
			setUpdateError(null);

			const body: Record<string, unknown> = { status: reverseStatusMap[nextStatus] };

			const response = await fetch(`/api/sales/${selectedOrderId}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});

			if (!response.ok) {
				let errData: { code?: string; message?: string } = {};
				try { errData = await response.json(); } catch { /* ignore */ }

				if (response.status === 409) {
					if (errData.code === "RESCHEDULE_BLOCKED_24H") {
						setUpdateError(
							"Faltam menos de 24h para a operação. Para reagendar, entre em contato com o suporte. Sujeito à multa de 10% conforme Cláusula 7."
						);
					} else if (errData.code === "RESCHEDULE_EXCEEDS_MAX_DAYS") {
						setUpdateError(
							"A nova data excede o limite de 3 dias úteis da data original contratada (Cláusula 9)."
						);
					} else {
						setUpdateError(errData.message ?? "Conflito ao atualizar o pedido. Tente novamente.");
					}
				} else {
					setUpdateError(errData.message ?? "Erro ao atualizar. Tente novamente.");
				}
				return;
			}

			setOrders((prev) =>
				prev.map((o) =>
					o.id === selectedOrderId ? { ...o, status: nextStatus } : o
				)
			);
			setDialogOpen(false);
			refreshUnreadCount();
		} catch (error) {
			console.error("Erro ao atualizar:", error);
			setUpdateError("Erro ao atualizar. Tente novamente.");
		} finally {
			setIsUpdating(false);
		}
	}

	// Converte string ISO ou yyyy-mm-dd para o formato do input date (yyyy-mm-dd)
	function isoToDateInput(iso: string | undefined): string {
		if (!iso) return "";
		return iso.substring(0, 10);
	}

	async function handleAcceptOrder(orderId: string) {
		setPendingAcceptOrderId(orderId);
		setTermsAccepted(false);
		setTermsExpanded(false);
		setPlannedHarvestDate("");
		setPlannedPickupDate("");
		setPlannedDeliveryDate("");
		setAcceptDateError(null);
		setAcceptanceContractData(null);
		setTermsDialogOpen(true);

		// Fetch contract context (same source as "Ver contrato") for data consistency
		try {
			setAcceptanceContractLoading(true);
			const sale = rawSales.find(s => s.id === orderId);
			const productId = sale?.boughtProducts?.[0]?.productId;
			const { contract, ok } = await getContractView(orderId, productId);
			if (ok) {
				const ctx = contract as ContractContextData;
				setAcceptanceContractData(ctx);
				// Pré-preenche as datas a partir do contexto carregado
				// para garantir consistência com o contrato exibido
				const conds = ctx.conditions as Record<string, string | undefined> | undefined;
				if (conds?.plannedHarvestDate)  setPlannedHarvestDate(isoToDateInput(conds.plannedHarvestDate));
				if (conds?.plannedPickupDate)   setPlannedPickupDate(isoToDateInput(conds.plannedPickupDate));
				if (conds?.plannedDeliveryDate) setPlannedDeliveryDate(isoToDateInput(conds.plannedDeliveryDate));
			}
		} catch {
			// non-blocking: contract shows with saleData fallback
		} finally {
			setAcceptanceContractLoading(false);
		}
	}

	async function confirmAcceptWithTerms() {
		if (!termsAccepted || pendingAcceptOrderId == null) return;

		if (!plannedHarvestDate) {
			setAcceptDateError("Informe a data prevista de colheita/disponibilização.");
			return;
		}
		if (!plannedPickupDate) {
			setAcceptDateError("Informe a data prevista de retirada/embarque.");
			return;
		}

		try {
			setIsAccepting(true);
			setAcceptDateError(null);

			const dates = {
				plannedHarvestDate,
				plannedPickupDate,
				...(plannedDeliveryDate ? { plannedDeliveryDate } : {}),
			};

			// 1) Atualiza decisão do vendedor + datas no mesmo payload
			await updateSellerDecision(pendingAcceptOrderId, true, dates);

			// 2) Salva snapshot completo do contrato (item 2b)
			const conditions = {
				...((acceptanceContractData?.conditions as Record<string, unknown>) ?? {}),
				...dates,
			};

			// Guarda as conditions corretas em memória para "Ver contrato" na mesma sessão
			setAcceptedConditionsMap(prev => ({ ...prev, [pendingAcceptOrderId]: conditions }));

			const contractResult = await acceptContract({
				saleId: pendingAcceptOrderId,
				buyer:  acceptanceContractData?.buyer,
				seller: acceptanceContractData?.seller,
				items:  acceptanceContractData?.items as import("@/store/useCheckoutStore").ContractItem[] | undefined,
				conditions: conditions as import("@/store/useCheckoutStore").ContractConditions,
			}).catch((err) => { console.error("[acceptContract]", err); return { success: false, error: String(err) }; });

			if (contractResult && !contractResult.success) {
				console.error("[acceptContract]", contractResult.error);
				if (contractResult.error?.toLowerCase().includes("permiss")) {
					setAcceptDateError("Você não tem permissão para assinar este contrato.");
					return;
				}
			}

			// 3) Atualiza status para "Em processamento"
			await updateSaleStatus(pendingAcceptOrderId, reverseStatusMap["processing"]);

			// 4) Recarrega do backend para refletir datas e snapshot do contrato
			await loadSalesData(false);
		} catch {
			setAcceptDateError("Erro ao confirmar pedido. Tente novamente.");
		} finally {
			setIsAccepting(false);
			setTermsDialogOpen(false);
			setPendingAcceptOrderId(null);
		}
	}

	async function handleRejectOrder(orderId: string) {
		await updateSellerDecision(orderId, false);
		await loadSalesData(false);
	}

	if (loading) {
		return <OrdersPageSkeleton />;
	}

	if (error) {
		return (
			<div className="mx-auto w-full max-w-6xl px-4 py-6 md:py-8">
				<div className="flex items-center justify-center py-12">
					<div className="text-center">
						<p className="text-red-600 mb-4">{error}</p>
						<Button onClick={() => window.location.reload()}>
							Tentar novamente
						</Button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="mx-auto w-full max-w-6xl px-4 py-6 md:py-8">
			<h1 className="mb-6 text-2xl font-semibold text-foreground md:text-3xl">
				Gerenciamento de pedidos
			</h1>

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<StatCard title="Novos" value={counters.new} />
				<StatCard title="Em andamento" value={counters.active} />
				<StatCard title="Aguard. pag. final" value={counters.awaitingPayment} />
				<StatCard title="Concluídos" value={counters.done} />
			</div>

			<div className="mt-6 flex flex-col items-stretch gap-3 md:flex-row md:items-center md:justify-between">
				<div className="flex flex-1 items-center gap-3">
					<div className="relative w-full">
						<Input
							placeholder="Buscar por número de pedido"
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							className="w-full pl-8"
						/>
						<Search className="text-muted-foreground absolute left-2 top-1/2 size-4 -translate-y-1/2" />
					</div>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline" className="gap-2">
								Filtrar por
								<ChevronDown className="size-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="start">
							<DropdownMenuItem className="gap-2">
								<Calendar className="size-4" /> Por data
							</DropdownMenuItem>
							<DropdownMenuItem className="gap-2">
								<Hash className="size-4" /> Por pedido
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>

				<div className="flex space-x-4">
					<Link href="/market/create-product" className="w-full">
						<Button className="gap-2 w-full">
							<Plus className="size-4" />
							Criar novo produto
						</Button>
					</Link>

					<Link href="/market/myproducts" className="w-full">
						<Button className="gap-2 w-full">
							<Eye className="size-4" /> Ver Meus produtos
						</Button>
					</Link>
				</div>
			</div>

			<div className="mt-6 flex flex-col gap-4">
				{filtered.map((order) => (
					<OrderCard
						key={`${order.id}-${order.action ?? "pending"}`}
						order={order}
						saleData={rawSales.find((s) => s.id === order.id)}
						acceptedConditions={acceptedConditionsMap[order.id]}
						onChangeStatus={() => openStatusDialog(order.id, order.status)}
						onAccept={() => handleAcceptOrder(order.id)}
						onReject={() => handleRejectOrder(order.id)}
						onWeightRegistered={() => loadSalesData(false)}
						autoOpenDetails={order.id === focusSaleId}
					/>
				))}
			</div>

			<AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<AlertDialogContent className="max-w-lg">
					<AlertDialogHeader>
						<AlertDialogTitle>Alterar status do pedido</AlertDialogTitle>
					</AlertDialogHeader>

					<div className="space-y-4 py-4">
						{(() => {
							const sale = rawSales.find(s => s.id === selectedOrderId);
							const order = orders.find(o => o.id === selectedOrderId);
							const available = getAvailableNextStatuses(order?.status ?? "new", sale);
							const activeHint = available.find(s => s.value === nextStatus)?.hint;

							if (available.length === 0) {
								return (
									<p className="text-sm text-muted-foreground">
										{order?.status === "weighing"
											? "Registre o peso da carga para avançar automaticamente."
											: "Nenhuma transição de status disponível no momento."}
									</p>
								);
							}

							return (
								<>
									<div className="space-y-2">
										<label className="text-sm font-medium leading-none">
											Novo status <span className="text-red-500">*</span>
										</label>
										<Select
											value={nextStatus}
											onValueChange={(v) => setNextStatus(v as OrderStatus)}
										>
											<SelectTrigger className="w-full">
												<SelectValue placeholder="Selecione o status" />
											</SelectTrigger>
											<SelectContent>
												{available.map(opt => (
													<SelectItem key={opt.value} value={opt.value} disabled={opt.disabled}>
														{opt.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										{activeHint && (
											<p className="text-xs text-amber-600">{activeHint}</p>
										)}
									</div>
									<p className="text-sm text-muted-foreground">
										Tem certeza que deseja alterar o status deste pedido?
									</p>
								</>
							);
						})()}

						{updateError && (
							<p className="text-sm text-red-600">{updateError}</p>
						)}
					</div>

					<AlertDialogFooter>
						<AlertDialogCancel
							onClick={() => setUpdateError(null)}
							disabled={isUpdating}
						>
							Cancelar
						</AlertDialogCancel>
						<Button
							onClick={confirmStatusChange}
							disabled={isUpdating}
						>
							{isUpdating ? (
								<>
									<LoaderCircle size={16} className="animate-spin mr-2" />
									Confirmando...
								</>
							) : (
								'Confirmar'
							)}
						</Button>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Modal de Termos de Venda para aceite de pedido */}
			<Dialog open={termsDialogOpen} onOpenChange={setTermsDialogOpen}>
				<DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Termo de venda</DialogTitle>
					</DialogHeader>

					<Card className="border-2 border-gray-200">
						<CardContent className="p-6">
							<div className="space-y-4">
								<div className="flex items-center justify-between pb-4 border-b">
									<div className="flex items-center gap-3">
										<FileText className="w-5 h-5 text-gray-600" />
										<span className="font-medium">Termo de venda - Venda+ Agromarket</span>
									</div>
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={() => setTermsExpanded(!termsExpanded)}
										className="flex items-center gap-2"
									>
										{termsExpanded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
										{termsExpanded ? "Ocultar" : "Visualizar"}
									</Button>
								</div>

								{termsExpanded && (
									<div className="max-h-96 overflow-y-auto p-4 bg-gray-50 rounded-lg">
										{acceptanceContractLoading ? (
											<div className="flex items-center gap-2 text-gray-500 py-6 justify-center">
												<LoaderCircle className="w-4 h-4 animate-spin" />
												Carregando contrato...
											</div>
										) : (
											<ContractTemplate
												key={`${pendingAcceptOrderId}-${plannedHarvestDate}-${plannedPickupDate}-${plannedDeliveryDate}`}
												mode="read-only"
												saleData={rawSales.find(s => s.id === pendingAcceptOrderId)}
												data={{
													...(acceptanceContractData ?? {}),
													conditions: {
														...((acceptanceContractData?.conditions as Record<string, unknown>) ?? {}),
														...(plannedHarvestDate  ? { plannedHarvestDate }  : {}),
														...(plannedPickupDate   ? { plannedPickupDate }   : {}),
														...(plannedDeliveryDate ? { plannedDeliveryDate } : {}),
													},
												}}
											/>
										)}
									</div>
								)}

								<div className="pt-4">
									<button
										type="button"
										onClick={() => {
											const sale = rawSales.find(s => s.id === pendingAcceptOrderId);
											// Monta previewData com dados completos do contexto + datas do formulário
											// Usa sessionStorage sem ?saleId= para que o PDF reflita as datas
											// preenchidas agora, antes do aceite ser gravado no backend
											const items = acceptanceContractData?.items?.length
												? acceptanceContractData.items.map(i => ({
													name: (i.name ?? i.product) as string,
													variety: i.variety,
													harvestAt: i.harvestAt,
													amount: Number(i.amount ?? i.quantity ?? 0),
													unit: i.unit ?? "un",
													unitPrice: Number(i.unitPrice ?? i.price ?? 0),
												}))
												: (sale?.boughtProducts ?? []).map(bp => ({
													name: bp.product?.name ?? "",
													variety: bp.product?.variety,
													harvestAt: bp.product?.harvestAt ?? undefined,
													amount: Number(bp.amount),
													unit: bp.sellingUnitProduct?.unit?.unit ?? bp.sellingUnitProduct?.unit?.title ?? "un",
													unitPrice: Number(bp.amount) > 0 ? Number(bp.value) / Number(bp.amount) : Number(bp.value),
												}));

											const total = Number(acceptanceContractData?.conditions?.total)
												|| (sale?.boughtProducts ?? []).reduce((s, bp) => s + Number(bp.value), 0) + Number(sale?.transportValue ?? 0);

											sessionStorage.setItem("contractPreviewData", JSON.stringify({
												seller: {
													name:    acceptanceContractData?.seller?.name    ?? sale?.boughtProducts?.[0]?.product?.seller?.name,
													cpf:     acceptanceContractData?.seller?.cpf,
													cnpj:    acceptanceContractData?.seller?.cnpj,
													address: acceptanceContractData?.seller?.address,
													role:    acceptanceContractData?.seller?.role,
												},
												buyer: {
													name: acceptanceContractData?.buyer?.name ?? sale?.buyer?.name,
													cpf:  acceptanceContractData?.buyer?.cpf  ?? sale?.buyer?.cpf,
													cnpj: acceptanceContractData?.buyer?.cnpj,
												},
												products: items,
												paymentMethod:       acceptanceContractData?.conditions?.paymentMethod || sale?.paymentMethod?.method,
												total,
												plannedHarvestDate:  plannedHarvestDate  || undefined,
												plannedPickupDate:   plannedPickupDate   || undefined,
												plannedDeliveryDate: plannedDeliveryDate || undefined,
											}));
											window.open("/contrato/preview", "_blank");
										}}
										className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 underline text-sm"
									>
										<FileText className="w-4 h-4" />
										Abrir documento completo (PDF)
									</button>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Datas obrigatórias de confirmação */}
					<div className="mt-6 space-y-4 p-4 border rounded-lg bg-gray-50">
						<p className="text-sm font-semibold text-gray-800">Datas acordadas <span className="text-red-500">*</span></p>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div className="space-y-1">
								<label className="text-sm font-medium">
									Colheita / Disponibilização <span className="text-red-500">*</span>
								</label>
								<Input
									type="date"
									value={plannedHarvestDate}
									onChange={(e) => { setPlannedHarvestDate(e.target.value); setAcceptDateError(null); }}
								/>
							</div>
							<div className="space-y-1">
								<label className="text-sm font-medium">
									Retirada / Embarque <span className="text-red-500">*</span>
								</label>
								<Input
									type="date"
									value={plannedPickupDate}
									onChange={(e) => { setPlannedPickupDate(e.target.value); setAcceptDateError(null); }}
								/>
							</div>
						</div>

						<div className="space-y-1">
							<label className="text-sm font-medium">
								Entrega no destino
							</label>
							<Input
								type="date"
								value={plannedDeliveryDate}
								onChange={(e) => setPlannedDeliveryDate(e.target.value)}
							/>
							<p className="text-xs text-gray-500">Obrigatório apenas se o transporte não for retirada no local.</p>
						</div>

						{acceptDateError && (
							<p className="text-sm text-red-600">{acceptDateError}</p>
						)}
					</div>

					<div className="flex flex-row items-start space-y-0 space-x-3 p-4 bg-green-50 rounded-lg border mt-6">
						<Checkbox checked={termsAccepted} onCheckedChange={(v) => setTermsAccepted(!!v)} className="mt-1" />
						<div className="space-y-1 leading-none">
							<label className="text-sm font-medium leading-relaxed">
								Li e estou de acordo com o <span className="text-green-600 underline">Termo de Venda</span>.
								<span className="text-red-500 ml-1">*</span>
							</label>
						</div>
					</div>

					<DialogFooter>
						<Button variant="outline" onClick={() => setTermsDialogOpen(false)} disabled={isAccepting}>Cancelar</Button>
						<Button onClick={confirmAcceptWithTerms} disabled={!termsAccepted || isAccepting}>
							{isAccepting ? (
								<>
									<LoaderCircle size={16} className="animate-spin mr-2" />
									Confirmando...
								</>
							) : (
								"Confirmar"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { moneyMask } from "@/utils/functions";
import { Order, SaleData } from "@/types/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useEffect, useState } from "react";
import { useNotificationsStore } from "@/store/notificationsStore";
import SaleDetailClient from "@/components/sale/SaleDetailClient";
import ContractTemplate from "@/components/sale/ContractTemplate";
import { getContractView } from "@/actions/contract";
import {
  Eye,
  RefreshCcw,
  CheckCircle2,
  XCircle,
  Info,
  FileText,
  LoaderCircle,
  BadgeCheck,
  Clock,
  Upload,
  Sprout,
  Scale,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

export function OrderCard({
  order,
  saleData,
  acceptedConditions,
  onChangeStatus,
  onAccept,
  onReject,
  onWeightRegistered,
  autoOpenDetails = false,
}: {
  order: Order;
  saleData?: SaleData;
  acceptedConditions?: Record<string, unknown>;
  onChangeStatus: () => void;
  onAccept: () => void;
  onReject: () => void;
  onWeightRegistered?: () => void;
  autoOpenDetails?: boolean;
}) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const refreshUnreadCount = useNotificationsStore((s) => s.refreshUnreadCount);

  useEffect(() => {
    if (autoOpenDetails) setSheetOpen(true);
  }, [autoOpenDetails]);

  const [contractOpen, setContractOpen] = useState(false);
  const [contractData, setContractData] = useState<Record<string, unknown> | null>(null);
  const [contractLoading, setContractLoading] = useState(false);
  const [contractError, setContractError] = useState<string | null>(null);

  const [canhotoOpen, setCanhotoOpen] = useState(false);
  const [canhotoUrl, setCanhotoUrl] = useState("");
  const [isUploadingCanhoto, setIsUploadingCanhoto] = useState(false);
  const [canhotoError, setCanhotoError] = useState<string | null>(null);
  const [canhotoDone, setCanhotoDone] = useState(false);

  // Autorizar colheita
  const [harvestAuthorizing, setHarvestAuthorizing] = useState(false);
  const [harvestAuthorized, setHarvestAuthorized] = useState(false);
  const [harvestError, setHarvestError] = useState<string | null>(null);

  // Pesagem da balança
  const [weightOpen, setWeightOpen] = useState(false);
  const [weightKg, setWeightKg] = useState("");
  const [weightFile, setWeightFile] = useState<File | null>(null);
  const [weightUploading, setWeightUploading] = useState(false);
  const [weightError, setWeightError] = useState<string | null>(null);
  const [weightDone, setWeightDone] = useState(false);
  const [weightFileUrl, setWeightFileUrl] = useState<string | null>(null);

  const downPaymentConfirmed = saleData?.firstInstallmentPaid ?? saleData?.downPaymentCompleted ?? false;

  // Estados persistentes derivados do status/saleData — resistem a refresh de página
  const harvestAlreadyAuthorized = harvestAuthorized || [
    'harvest_authorized', 'harvest_completed', 'weighing', 'awaiting_final_payment', 'pickup', 'completed',
  ].includes(order.status);

  const weightAlreadyRegistered = weightDone || !!saleData?.weightDocumentId || [
    'weighing', 'awaiting_final_payment', 'pickup', 'completed',
  ].includes(order.status);

  async function handleUploadCanhoto() {
    if (!canhotoUrl.trim()) {
      setCanhotoError("Informe a URL do documento.");
      return;
    }
    try {
      setIsUploadingCanhoto(true);
      setCanhotoError(null);
      const res = await fetch(`/api/sales/${order.id}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ docType: "canhoto_nf", url: canhotoUrl }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(data.error ?? "Erro ao enviar documento");
      }
      setCanhotoDone(true);
      setCanhotoOpen(false);
    } catch (e: unknown) {
      setCanhotoError(e instanceof Error ? e.message : "Erro ao enviar documento");
    } finally {
      setIsUploadingCanhoto(false);
    }
  }

  async function handleAuthorizeHarvest() {
    try {
      setHarvestAuthorizing(true);
      setHarvestError(null);
      const res = await fetch(`/api/sales/${order.id}/authorize-harvest`, {
        method: "PATCH",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(data.error ?? "Erro ao autorizar colheita");
      }
      setHarvestAuthorized(true);
      refreshUnreadCount();
    } catch (e: unknown) {
      setHarvestError(e instanceof Error ? e.message : "Erro ao autorizar colheita");
    } finally {
      setHarvestAuthorizing(false);
    }
  }

  async function handleWeightUpload() {
    if (!weightFile || !weightKg.trim()) {
      setWeightError("Preencha o peso e selecione um arquivo comprovante.");
      return;
    }
    const weightNum = Number(weightKg);
    if (isNaN(weightNum) || weightNum <= 0) {
      setWeightError("Informe um peso válido maior que zero.");
      return;
    }
    try {
      setWeightUploading(true);
      setWeightError(null);
      const fd = new FormData();
      fd.append("file", weightFile);
      fd.append("weightKg", String(weightNum));
      const res = await fetch(`/api/sales/${order.id}/weight`, {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string; code?: string };
        // Corrida com outra ação no pedido: o back desfaz a pesagem; recarregamos
        // os dados para o vendedor ver o estado atual antes de tentar de novo.
        if (data.code === "SALE_STATUS_CONFLICT") {
          onWeightRegistered?.();
          throw new Error("O status do pedido mudou enquanto a pesagem era registrada. Os dados foram atualizados; confira o pedido antes de tentar novamente.");
        }
        if (data.code === "WEIGHT_ALREADY_REGISTERED") {
          onWeightRegistered?.();
          throw new Error("A pesagem deste pedido já foi registrada.");
        }
        throw new Error(data.error ?? "Erro ao registrar pesagem");
      }
      const data = await res.json() as { fileUrl?: string };
      setWeightFileUrl(data.fileUrl ?? null);
      setWeightDone(true);
      setWeightOpen(false);
      // Recarrega os dados do pedido para refletir o novo total no contrato e na compra
      onWeightRegistered?.();
    } catch (e: unknown) {
      setWeightError(e instanceof Error ? e.message : "Erro ao registrar pesagem");
    } finally {
      setWeightUploading(false);
    }
  }

  async function handleViewContract() {
    setContractOpen(true);
    if (contractData !== null) return;
    try {
      setContractLoading(true);
      setContractError(null);
      const productId = saleData?.boughtProducts?.[0]?.productId;
      const { contract, ok, error } = await getContractView(order.id, productId);
      if (!ok) throw new Error(error ?? "Erro ao carregar contrato");
      const merged = acceptedConditions
        ? {
            ...contract,
            conditions: {
              ...((contract.conditions as Record<string, unknown>) ?? {}),
              ...acceptedConditions,
            },
          }
        : contract;
      setContractData(merged);
    } catch (e: unknown) {
      setContractError(e instanceof Error ? e.message : "Erro ao carregar contrato");
    } finally {
      setContractLoading(false);
    }
  }

  return (
    <>
      <Card className="border-muted bg-white">
        <CardContent className="px-4 md:px-6">
          <div className="flex flex-col gap-4">
            <div className="text-green-600 text-lg font-semibold">
              Pedido #{order.orderNumber ?? order.id}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-6 md:items-center">
              <div className="col-span-2">
                <div className="text-sm leading-5">
                  <span className="text-muted-foreground">Comprador:</span>{" "}
                  <span className="font-medium">{order.buyer}</span>
                </div>
              </div>
              <div className="col-span-2">
                <div className="text-sm leading-5">
                  <span className="text-muted-foreground">Produto:</span>{" "}
                  <span className="font-medium">{order.product}</span>
                </div>
              </div>
              <div className="col-span-2 flex items-center justify-between gap-3 md:justify-end">
                <div className="text-sm text-muted-foreground">Alterar Status:</div>
                {order.action === "accepted" ? (
                  <Button variant="outline" className="gap-2" onClick={onChangeStatus}>
                    <RefreshCcw className="size-4" /> Alterar status
                  </Button>
                ) : order.action === "rejected" ? (
                  <span className="text-xs text-muted-foreground">Pedido recusado</span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Info className="size-3.5" /> Disponível após aceitar
                  </span>
                )}
              </div>
              <div className="col-span-2 md:col-start-5 flex items-center justify-end gap-2">
                <span className="text-sm text-muted-foreground">Status atual:</span>
                <span className={`font-medium text-sm ${order.action === 'rejected' ? 'text-red-600' : ''}`}>
                  {order.action === 'rejected' ? 'Recusado' : (
                    <>
                      {order.status === 'new' && 'Novo'}
                      {order.status === 'processing' && 'Em processamento'}
                      {order.status === 'down_payment_confirmed' && 'Entrada confirmada'}
                      {order.status === 'harvest_authorized' && 'Colheita autorizada'}
                      {order.status === 'harvest_completed' && 'Colheita concluída'}
                      {order.status === 'weighing' && 'Em pesagem'}
                      {order.status === 'awaiting_final_payment' && 'Aguard. pag. final'}
                      {order.status === 'pickup' && 'Disponível p/ entrega'}
                      {order.status === 'completed' && 'Concluído'}
                      {order.status === 'cancelled' && 'Cancelado'}
                    </>
                  )}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
              <div className="col-span-2 text-sm">
                <span className="text-muted-foreground">Valor:</span>{" "}
                <span className="font-medium">{moneyMask(order.value)}</span>
              </div>
              <div className="col-span-2 text-sm">
                <span className="text-muted-foreground">Pagamento:</span>{" "}
                <span className="font-medium">{order.payment}</span>
              </div>
              <div className="col-span-2 flex flex-wrap items-center gap-2">
                {order.paymentCompleted ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 border border-green-200 px-3 py-1 text-xs font-semibold text-green-700">
                    <BadgeCheck className="w-3.5 h-3.5" />
                    Pagamento confirmado
                  </span>
                ) : downPaymentConfirmed ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-semibold text-blue-700">
                    <BadgeCheck className="w-3.5 h-3.5" />
                    Entrada confirmada - aguardando colheita
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-50 border border-yellow-200 px-3 py-1 text-xs font-medium text-yellow-700">
                    <Clock className="w-3.5 h-3.5" />
                    Aguardando pagamento
                  </span>
                )}
                {harvestAlreadyAuthorized && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700">
                    <Sprout className="w-3.5 h-3.5" />
                    Colheita autorizada
                  </span>
                )}
              </div>
            </div>

            {harvestError && (
              <div className="flex gap-2 text-sm text-red-600">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>{harvestError}</p>
              </div>
            )}

            {weightAlreadyRegistered && weightFileUrl && (
              <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
                <Scale className="w-4 h-4" />
                <span>Pesagem registrada.</span>
                <a href={weightFileUrl} target="_blank" rel="noopener noreferrer" className="underline flex items-center gap-1">
                  Ver comprovante <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              {order.createdAt && (
                <span>
                  Pedido realizado em:{" "}
                  <span className="font-medium text-gray-700">
                    {new Date(order.createdAt).toLocaleString("pt-BR", {
                      day: "2-digit", month: "2-digit", year: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </span>
                </span>
              )}
              {order.decisionAt && (
                <span>
                  {order.action === "accepted" ? "Aceito em:" : "Cancelado em:"}{" "}
                  <span className="font-medium text-gray-700">
                    {new Date(order.decisionAt).toLocaleString("pt-BR", {
                      day: "2-digit", month: "2-digit", year: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </span>
                </span>
              )}
            </div>

            <div className="flex flex-col gap-3 md:flex-row flex-wrap">
              <Button variant="outline" className="flex-1 gap-2" onClick={() => setSheetOpen(true)}>
                <Eye className="size-4" /> Ver detalhes
              </Button>

              <Button variant="outline" className="flex-1 gap-2" onClick={handleViewContract}>
                <FileText className="size-4" /> Ver contrato
              </Button>

              {/* Autorizar Colheita */}
              {order.action === "accepted" && !harvestAlreadyAuthorized && (
                <Button
                  variant="outline"
                  className={`flex-1 gap-2 ${downPaymentConfirmed
                    ? 'text-emerald-700 border-emerald-300 hover:bg-emerald-50'
                    : 'text-gray-400 border-gray-200 cursor-not-allowed'
                  }`}
                  disabled={!downPaymentConfirmed || harvestAuthorizing}
                  onClick={handleAuthorizeHarvest}
                  title={!downPaymentConfirmed ? 'Aguardando confirmação da entrada (30%) pelo comprador' : undefined}
                >
                  {harvestAuthorizing ? (
                    <><LoaderCircle className="size-4 animate-spin" /> Autorizando...</>
                  ) : (
                    <><Sprout className="size-4" /> Autorizar Colheita</>
                  )}
                </Button>
              )}

              {/* Registrar Pesagem */}
              {order.action === "accepted" && (
                <>
                  {weightAlreadyRegistered ? (
                    <span className="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-green-50 border border-green-200 px-4 py-2 text-green-700 text-sm font-medium h-10">
                      <Scale className="size-4" /> Pesagem registrada
                    </span>
                  ) : (
                    <Button
                      variant="outline"
                      className="flex-1 gap-2 text-blue-700 border-blue-300 hover:bg-blue-50"
                      onClick={() => setWeightOpen(true)}
                    >
                      <Scale className="size-4" /> Registrar Pesagem
                    </Button>
                  )}
                </>
              )}

              {/* Canhoto NF */}
              {order.paymentCompleted && !canhotoDone && (
                <Button
                  variant="outline"
                  className="flex-1 gap-2 text-green-700 border-green-300 hover:bg-green-50"
                  onClick={() => setCanhotoOpen(true)}
                >
                  <Upload className="size-4" /> Canhoto NF
                </Button>
              )}
              {canhotoDone && (
                <span className="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-green-50 border border-green-200 px-4 py-2 text-green-700 text-sm font-medium h-10">
                  <BadgeCheck className="size-4" /> Canhoto enviado
                </span>
              )}

              {!order.action && (
                <>
                  <Button className="flex-1 gap-2" onClick={onAccept}>
                    <CheckCircle2 className="size-4" /> Aceitar
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="flex-1 gap-2">
                        <XCircle className="size-4" /> Recusar
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Recusar Pedido</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja recusar este pedido? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={onReject} className="bg-red-600 hover:bg-red-700">
                          Confirmar Recusa
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}

              {order.action === "accepted" && (
                <div className="flex-1 flex items-center justify-center gap-2 rounded-md bg-green-50 px-4 py-2 text-green-700 border border-green-200 h-10">
                  <CheckCircle2 className="size-4" />
                  <span className="font-medium">Pedido Aceito</span>
                </div>
              )}

              {order.action === "rejected" && (
                <div className="flex-1 flex items-center justify-center gap-2 rounded-md bg-red-50 px-4 py-2 text-red-700 border border-red-200 h-10">
                  <XCircle className="size-4" />
                  <span className="font-medium">Pedido Recusado</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sheet: detalhes */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle>Resumo do pedido</SheetTitle>
          </SheetHeader>
          <SaleDetailClient saleId={order.id} saleData={saleData} />
        </SheetContent>
      </Sheet>

      {/* Dialog: contrato */}
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
              <ContractTemplate
                mode={order.paymentCompleted ? "read-only" : "seller-edit"}
                data={contractData}
                saleData={saleData}
              />
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

      {/* Dialog: canhoto NF */}
      <Dialog open={canhotoOpen} onOpenChange={setCanhotoOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Enviar Canhoto da NF</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-gray-600">
              Insira a URL do canhoto assinado da Nota Fiscal. A data de entrega efetiva será registrada automaticamente pelo sistema.
            </p>
            <div className="space-y-1">
              <label className="text-sm font-medium">
                URL do documento <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="https://..."
                value={canhotoUrl}
                onChange={(e) => { setCanhotoUrl(e.target.value); setCanhotoError(null); }}
              />
            </div>
            {canhotoError && <p className="text-sm text-red-600">{canhotoError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCanhotoOpen(false)} disabled={isUploadingCanhoto}>
              Cancelar
            </Button>
            <Button onClick={handleUploadCanhoto} disabled={isUploadingCanhoto} className="bg-green-600 hover:bg-green-700">
              {isUploadingCanhoto ? (
                <><LoaderCircle className="w-4 h-4 animate-spin mr-2" />Enviando...</>
              ) : (
                <><Upload className="w-4 h-4 mr-2" />Enviar</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: registrar pesagem */}
      <Dialog open={weightOpen} onOpenChange={setWeightOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Pesagem da Balança</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-gray-600">
              Informe o peso medido e anexe a foto ou PDF do ticket da balança como comprovante.
            </p>
            <div className="space-y-1">
              <label className="text-sm font-medium">
                Peso (kg) <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="Ex: 1250.50"
                value={weightKg}
                onChange={(e) => { setWeightKg(e.target.value); setWeightError(null); }}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">
                Comprovante (foto ou PDF) <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => { setWeightFile(e.target.files?.[0] ?? null); setWeightError(null); }}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100 cursor-pointer"
              />
              {weightFile && (
                <p className="text-xs text-gray-500 mt-1">Arquivo selecionado: {weightFile.name}</p>
              )}
            </div>
            {weightError && (
              <div className="flex gap-2 text-sm text-red-600">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>{weightError}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWeightOpen(false)} disabled={weightUploading}>
              Cancelar
            </Button>
            <Button onClick={handleWeightUpload} disabled={weightUploading} className="bg-green-600 hover:bg-green-700">
              {weightUploading ? (
                <><LoaderCircle className="w-4 h-4 animate-spin mr-2" />Registrando...</>
              ) : (
                <><Scale className="w-4 h-4 mr-2" />Registrar</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

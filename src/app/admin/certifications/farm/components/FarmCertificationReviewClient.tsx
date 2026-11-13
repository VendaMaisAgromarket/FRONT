"use client";

import CertificationDocumentList from "@/components/certifications/CertificationDocumentList";
import CertificationInfo, { InfoGrid, InfoSection } from "@/components/certifications/CertificationInfo";
import CertificationStatusBadge from "@/components/certifications/CertificationStatusBadge";
import CertificationTimeline from "@/components/certifications/CertificationTimeline";
import {
	CERTIFICATION_ROUTES,
	DOC_TYPE_LABELS,
	PENDING_CHANGED_EVENT,
	isExpiredDate,
} from "@/components/certifications/certificationUtils";
import { formatNotificationDatetime } from "@/components/notifications/notificationUtils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
	ApiError,
	approveFarmCertification,
	getFarmCertification,
	getFarmCertificationDocumentUrl,
	rejectFarmCertification,
	revokeFarmCertification,
} from "@/services/farmCertifications";
import { FarmCertificationDetail, FarmCertificationDocument } from "@/types/types";
import { formatCpfCnpj, formatPhoneNumber } from "@/utils/functions";
import { ArrowLeft, BadgeCheck, Eye, EyeOff, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type ActionKind = "approve" | "reject" | "revoke";

export default function FarmCertificationReviewClient({ id }: { id: string }) {
	const [detail, setDetail] = useState<FarmCertificationDetail | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [action, setAction] = useState<ActionKind | null>(null);

	// Incrementado para recarregar o detalhe (tentar novamente, 409)
	const [reloadKey, setReloadKey] = useState(0);
	const load = useCallback(() => setReloadKey((k) => k + 1), []);

	useEffect(() => {
		let active = true;
		getFarmCertification(id)
			.then((d) => {
				if (!active) return;
				setDetail(d);
				setError(null);
			})
			.catch((e) => {
				if (active) setError(e instanceof Error ? e.message : "Não foi possível carregar a certificação.");
			});
		return () => {
			active = false;
		};
	}, [id, reloadKey]);

	function handleDone(result: FarmCertificationDetail, message: string) {
		setDetail(result);
		setAction(null);
		toast.success(message);
		window.dispatchEvent(new Event(PENDING_CHANGED_EVENT));
	}

	function handleConflict(e: unknown) {
		// 409: outro admin pode ter agido antes — mostra o erro e recarrega
		toast.error(e instanceof Error ? e.message : "A certificação foi alterada. Recarregando…");
		setAction(null);
		load();
		window.dispatchEvent(new Event(PENDING_CHANGED_EVENT));
	}

	const back = (
		<Link
			href={CERTIFICATION_ROUTES.adminList}
			className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
		>
			<ArrowLeft className="size-4" />
			Certificações de fazenda
		</Link>
	);

	if (error) {
		return (
			<div className="space-y-4">
				{back}
				<div className="space-y-3 rounded-lg border bg-white px-4 py-12 text-center">
					<p className="text-muted-foreground">{error}</p>
					<Button
						variant="outline"
						onClick={() => {
							setError(null);
							load();
						}}
					>
						Tentar novamente
					</Button>
				</div>
			</div>
		);
	}

	if (!detail) {
		return (
			<div className="space-y-4">
				{back}
				<Skeleton className="h-8 w-1/3" />
				<Skeleton className="h-64 w-full" />
			</div>
		);
	}

	const expired = isExpiredDate(detail.validUntil);
	const u = detail.user;

	return (
		<div className="space-y-4">
			{back}

			<div className="flex flex-wrap items-start justify-between gap-3">
				<div className="space-y-1">
					<div className="flex flex-wrap items-center gap-2">
						<h2 className="text-2xl font-semibold">{detail.farmName}</h2>
						<CertificationStatusBadge status={detail.status} />
						{detail.badgeActive && (
							<Badge variant="outline" className="border-green-200 bg-green-50 text-green-800">
								<BadgeCheck />
								Selo ativo
							</Badge>
						)}
					</div>
					<p className="text-sm text-muted-foreground">
						Enviada em {formatNotificationDatetime(detail.createdAt)}
						{detail.reviewedBy && detail.reviewedAt
							? ` · avaliada por ${detail.reviewedBy.name} em ${formatNotificationDatetime(detail.reviewedAt)}`
							: ""}
					</p>
				</div>

				{detail.status === "PENDING" && (
					<div className="flex flex-col items-end gap-1">
						<div className="flex gap-2">
							<Button variant="outline" onClick={() => setAction("reject")}>
								Recusar
							</Button>
							<Button onClick={() => setAction("approve")} disabled={expired}>
								Aprovar
							</Button>
						</div>
						{expired && (
							<p className="text-xs text-red-700">Certificado vencido: recuse.</p>
						)}
					</div>
				)}
				{detail.status === "APPROVED" && (
					<Button variant="destructive" onClick={() => setAction("revoke")}>
						Revogar
					</Button>
				)}
			</div>

			{(detail.status === "REJECTED" || detail.status === "REVOKED") && detail.rejectionReason && (
				<div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
					<p className="font-medium">
						{detail.status === "REJECTED" ? "Motivo da recusa" : "Motivo da revogação"}
					</p>
					<p className="whitespace-pre-line">{detail.rejectionReason}</p>
				</div>
			)}

			<div className="grid gap-4 lg:grid-cols-[1fr_360px]">
				<div className="space-y-4">
					<div className="rounded-lg border bg-white p-4 md:p-6">
						<InfoSection title="Produtor">
							<InfoGrid
								items={[
									["Nome", u?.name],
									["E-mail", u?.email],
									["Telefone", u?.phone_number ? formatPhoneNumber(u.phone_number) : null],
									["CPF/CNPJ", u?.cpf || u?.cnpj ? formatCpfCnpj(u.cpf || u.cnpj || "") : null],
									["CCIR do cadastro", u?.ccir],
								]}
							/>
						</InfoSection>
					</div>
					<div className="rounded-lg border bg-white p-4 md:p-6">
						<CertificationInfo certification={detail} />
					</div>
					<div className="rounded-lg border bg-white p-4 md:p-6">
						<InfoSection title="Documentos">
							<DocumentsWithPreview detail={detail} />
						</InfoSection>
					</div>
				</div>
				<div className="h-fit rounded-lg border bg-white p-4 md:p-6">
					<InfoSection title="Histórico">
						<CertificationTimeline events={detail.events} />
					</InfoSection>
				</div>
			</div>

			<ApproveDialog
				open={action === "approve"}
				detail={detail}
				onClose={() => setAction(null)}
				onDone={(r) => handleDone(r, "Certificação aprovada. O selo já está no ar.")}
				onConflict={handleConflict}
			/>
			<ReasonDialog
				kind="reject"
				open={action === "reject"}
				detail={detail}
				onClose={() => setAction(null)}
				onDone={(r) => handleDone(r, "Certificação recusada.")}
				onConflict={handleConflict}
			/>
			<ReasonDialog
				kind="revoke"
				open={action === "revoke"}
				detail={detail}
				onClose={() => setAction(null)}
				onDone={(r) => handleDone(r, "Certificação revogada. O selo saiu do ar.")}
				onConflict={handleConflict}
			/>
		</div>
	);
}

// ---------- Documentos com pré-visualização embutida ----------
// A URL assinada é buscada ao abrir a pré-visualização e descartada ao fechar.

function DocumentsWithPreview({ detail }: { detail: FarmCertificationDetail }) {
	const [preview, setPreview] = useState<{ docId: string; url: string; mimeType: string } | null>(null);
	const [loadingId, setLoadingId] = useState<string | null>(null);

	async function toggle(doc: FarmCertificationDocument) {
		if (preview?.docId === doc.id) {
			setPreview(null);
			return;
		}
		try {
			setLoadingId(doc.id);
			const { url, mimeType } = await getFarmCertificationDocumentUrl(detail.id, doc.id);
			setPreview({ docId: doc.id, url, mimeType });
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Não foi possível carregar o documento.");
		} finally {
			setLoadingId(null);
		}
	}

	return (
		<div className="space-y-3">
			<CertificationDocumentList
				certificationId={detail.id}
				documents={detail.documents}
				renderExtra={(doc) => (
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={() => toggle(doc)}
						disabled={loadingId === doc.id}
					>
						{loadingId === doc.id ? (
							<LoaderCircle className="size-4 animate-spin" />
						) : preview?.docId === doc.id ? (
							<EyeOff className="size-4" />
						) : (
							<Eye className="size-4" />
						)}
						{preview?.docId === doc.id ? "Fechar" : "Visualizar"}
					</Button>
				)}
			/>
			{preview && (
				<div className="overflow-hidden rounded-md border bg-gray-50">
					{preview.mimeType.startsWith("image/") ? (
						// eslint-disable-next-line @next/next/no-img-element
						<img src={preview.url} alt="Documento da certificação" className="mx-auto max-h-[80vh]" />
					) : (
						<iframe src={preview.url} title="Documento da certificação" className="h-[80vh] w-full" />
					)}
				</div>
			)}
		</div>
	);
}

// ---------- Modais de ação ----------

type DialogProps = {
	open: boolean;
	detail: FarmCertificationDetail;
	onClose: () => void;
	onDone: (result: FarmCertificationDetail) => void;
	onConflict: (e: unknown) => void;
};

function latestCertificateId(docs: FarmCertificationDocument[]): string | undefined {
	const certs = docs.filter((d) => d.docType === "CERTIFICATE");
	const pool = certs.length ? certs : docs;
	return [...pool].sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))[0]?.id;
}

function ApproveDialog({ open, detail, onClose, onDone, onConflict }: DialogProps) {
	const [documentId, setDocumentId] = useState<string | undefined>();
	const [notes, setNotes] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (open) {
			setDocumentId(latestCertificateId(detail.documents));
			setNotes("");
			setError(null);
		}
	}, [open, detail.documents]);

	async function submit() {
		try {
			setSubmitting(true);
			setError(null);
			const result = await approveFarmCertification(detail.id, {
				documentId,
				notes: notes.trim() || undefined,
			});
			onDone(result);
		} catch (e) {
			if (e instanceof ApiError && e.status === 409) onConflict(e);
			else setError(e instanceof Error ? e.message : "Não foi possível aprovar.");
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<Dialog open={open} onOpenChange={(o) => !o && !submitting && onClose()}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Aprovar certificação</DialogTitle>
					<DialogDescription>
						O selo de Fazenda certificada passa a aparecer no perfil e nos anúncios do produtor até{" "}
						a validade do certificado.
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-4">
					<div className="space-y-1.5">
						<Label>Documento que embasa a aprovação</Label>
						<Select value={documentId} onValueChange={setDocumentId} disabled={submitting}>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Selecione o documento" />
							</SelectTrigger>
							<SelectContent>
								{detail.documents.map((d) => (
									<SelectItem key={d.id} value={d.id}>
										{DOC_TYPE_LABELS[d.docType]} — {d.originalName}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="approve-notes">Observações (opcional)</Label>
						<Textarea
							id="approve-notes"
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							placeholder="Ex.: Conferido no site da certificadora."
							maxLength={500}
							disabled={submitting}
						/>
					</div>
					{error && <p className="text-sm text-destructive">{error}</p>}
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={onClose} disabled={submitting}>
						Cancelar
					</Button>
					<Button onClick={submit} disabled={submitting}>
						{submitting && <LoaderCircle className="size-4 animate-spin" />}
						Aprovar
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

function ReasonDialog({ kind, open, detail, onClose, onDone, onConflict }: DialogProps & { kind: "reject" | "revoke" }) {
	const [reason, setReason] = useState("");
	const [notes, setNotes] = useState("");
	const [confirmed, setConfirmed] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const isRevoke = kind === "revoke";
	const trimmed = reason.trim();
	const reasonValid = trimmed.length >= 3 && trimmed.length <= 500;

	useEffect(() => {
		if (open) {
			setReason("");
			setNotes("");
			setConfirmed(false);
			setError(null);
		}
	}, [open]);

	async function submit() {
		if (!reasonValid) {
			setError("Informe o motivo (de 3 a 500 caracteres).");
			return;
		}
		try {
			setSubmitting(true);
			setError(null);
			const body = { reason: trimmed, notes: notes.trim() || undefined };
			const result = isRevoke
				? await revokeFarmCertification(detail.id, body)
				: await rejectFarmCertification(detail.id, body);
			onDone(result);
		} catch (e) {
			if (e instanceof ApiError && e.status === 409) onConflict(e);
			else setError(e instanceof Error ? e.message : "Não foi possível concluir.");
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<Dialog open={open} onOpenChange={(o) => !o && !submitting && onClose()}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{isRevoke ? "Revogar certificação" : "Recusar certificação"}</DialogTitle>
					<DialogDescription>
						{isRevoke
							? "O selo sai do ar imediatamente. O motivo fica visível para o produtor."
							: "O motivo fica visível para o produtor, que poderá corrigir os dados e reenviar."}
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-4">
					<div className="space-y-1.5">
						<Label htmlFor={`${kind}-reason`}>
							Motivo <span className="text-destructive">*</span>
						</Label>
						<Textarea
							id={`${kind}-reason`}
							value={reason}
							onChange={(e) => setReason(e.target.value)}
							placeholder={isRevoke ? "Ex.: Certificado cancelado pela certificadora." : "Ex.: Documento ilegível."}
							maxLength={500}
							disabled={submitting}
						/>
						<p className="text-right text-xs text-muted-foreground">{trimmed.length}/500</p>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor={`${kind}-notes`}>Observações internas (opcional)</Label>
						<Textarea
							id={`${kind}-notes`}
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							maxLength={500}
							disabled={submitting}
						/>
					</div>
					{isRevoke && (
						<label className="flex items-start gap-2 text-sm">
							<input
								type="checkbox"
								className="mt-0.5"
								checked={confirmed}
								onChange={(e) => setConfirmed(e.target.checked)}
								disabled={submitting}
							/>
							Entendo que o selo sai do ar imediatamente.
						</label>
					)}
					{error && <p className="text-sm text-destructive">{error}</p>}
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={onClose} disabled={submitting}>
						Cancelar
					</Button>
					<Button
						variant="destructive"
						onClick={submit}
						disabled={submitting || !reasonValid || (isRevoke && !confirmed)}
					>
						{submitting && <LoaderCircle className="size-4 animate-spin" />}
						{isRevoke ? "Revogar" : "Recusar"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

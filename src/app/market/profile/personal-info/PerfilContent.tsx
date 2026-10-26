"use client";

import { toast } from "sonner";

import { FullUserData, getUserData } from "@/actions/user";
import ChangePhotoModal from "@/components/profile/ChangePhotoModal";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/store/userInfoStore";
import { formatCpfCnpj } from "@/utils/functions";
import { uploadProfilePhoto } from "@/utils/uploadProfilePhoto";
import { Camera, Eye, KeyRound, Pencil } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "../../../../components/ui/avatar";

type Address = {
	id?: number | string;
	userId?: number;
	addressee?: string;
	phone_number_addressee?: string;
	alias?: string | null;
	street?: string;
	number?: string;
	complement?: string | null;
	referencePoint?: string | null;
	cep?: string;
	uf?: string;
	state?: string;
	city?: string;
	district?: string;
	isDefault?: boolean;
	is_default?: boolean;
	default?: boolean;
	// quando vier como string de getUserData (ex.: "Rua X, 123 · Bairro Y · Cidade - UF")
	_asString?: string;
};

interface UserProps {
	user: {
		id?: number;
		name: string;
		email: string;
		phone: string;
		cpf: string | null;
		cnpj: string | null;
		ccir: string | null;
		tipo: string;
		role: "cooperative" | "cooperative-or-partnership" | 'farmer' | string;
	};
	userId?: number;
}

export default function PerfilContent({ user, userId }: UserProps) {
	const { id: userIdFromUser, name, email, phone, cnpj, ccir, tipo } = user;
	const effectiveUserId = userId ?? userIdFromUser;

	const [defaultAddress, setDefaultAddress] = useState<Address | null>(null);
	const [addrLoading, setAddrLoading] = useState<boolean>(true);
	const [addrError, setAddrError] = useState<string | null>(null);
	const [isChangePhotoModalOpen, setIsChangePhotoModalOpen] = useState(false);
	const { user: storeUser, setUser } = useUserStore();
	const [currentPhoto, setCurrentPhoto] = useState<string>(
		storeUser?.img ?? ""
	);
	const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
	const [userLoaded, setUserLoaded] = useState(false);

	useEffect(() => {
		const controller = new AbortController();

		async function load() {
			try {
				setAddrLoading(true);
				setAddrError(null);

				// 1) Buscar via getUserData()
				const me: FullUserData | null = await getUserData().catch(() => null);
				if (me) {
					// Atualizar foto de perfil se disponível
					if (me.img) {
						setCurrentPhoto(me.img);
					}

					// tenta extrair endereço do me.address (pode ser string ou objeto)
					let normalized: Address | null = null;

					if (typeof me.address === "string") {
						normalized = { _asString: me.address };
					} else if (
						me &&
						typeof me.address === "object" &&
						me.address !== null
					) {
						const a = me.address as unknown as Address;
						normalized = {
							...a,
							state: a?.state ?? a?.uf,
						};
					}

					if (normalized) {
						setDefaultAddress(normalized);
						return;
					}
				}

				// 2) Fallback nos endpoints internos já existentes
				let res = await fetch("/api/address?default=true", {
					method: "GET",
					signal: controller.signal,
					credentials: "include",
					headers: { "Content-Type": "application/json" },
				});

				if (!res.ok) {
					res = await fetch("/api/address", {
						method: "GET",
						signal: controller.signal,
						credentials: "include",
						headers: { "Content-Type": "application/json" },
					});
				}

				if (!res.ok) {
					throw new Error("Não foi possível carregar o endereço.");
				}

				const data = await res.json();
				const list: Address[] = Array.isArray(data) ? data : data?.data ?? data;

				if (Array.isArray(list)) {
					const found =
						list.find((a) => a.isDefault || a.is_default || a.default) ??
						list[0] ??
						null;
					setDefaultAddress(found);
				} else if (data && typeof data === "object") {
					setDefaultAddress(data as Address);
				} else {
					setDefaultAddress(null);
				}
			} catch (err: unknown) {
				const e = err as { name?: string } | null;
				if (e?.name !== "AbortError") {
					setAddrError("Não foi possível carregar seu endereço.");
				}
			} finally {
				setAddrLoading(false);
				setUserLoaded(true);
			}
		}

		load();
		return () => controller.abort();
	}, [effectiveUserId]);

	function formatAddress(a: Address | null): string {
		if (!a) return "—";

		// quando veio como string direto do getUserData()
		if (a._asString) return a._asString;

		const state = a.state ?? a.uf;
		const parts = [
			[a.street, a.number].filter(Boolean).join(", "),
			[a.district].filter(Boolean).join(""),
			[a.city, state].filter(Boolean).join(" - "),
		].filter(Boolean);
		return parts.join(" · ");
	}

	const handlePhotoChange = async (file: File) => {
		setIsUploadingPhoto(true);

		try {
			// Primeiro, atualizar a pré-visualização local
			const url = URL.createObjectURL(file);
			setCurrentPhoto(url);

			// Fazer upload para o servidor
			const result = await uploadProfilePhoto(file);

			if (result.success) {
				// Se o upload foi bem-sucedido, atualizar com a URL retornada pelo servidor
				type UploadData =
					| { img?: string; profilePhotoUrl?: string; url?: string }
					| undefined;
				const data = result.data as UploadData;
				const newUrl = data?.img || data?.profilePhotoUrl || data?.url;
				if (newUrl) {
					setCurrentPhoto(newUrl);
					toast.success("Foto de perfil atualizada!");
					// atualizar a navbar em tempo real
					if (storeUser) {
						setUser({ ...storeUser, img: newUrl });
					}
				}
			} else {
				toast.error(result.error || "Erro ao atualizar foto.");
				// Se falhou, reverter para a foto anterior (do store ou initial)
				if (storeUser?.img) {
					setCurrentPhoto(storeUser.img);
				}
			}
		} finally {
			setIsUploadingPhoto(false);
		}
	};

	return (
		<main className="min-h-screen bg-background px-4 md:px-20 py-10 flex flex-col items-center">
			<nav aria-label="breadcrumb" className="w-full max-w-4xl mb-4">
				<ol className="flex flex-wrap items-center text-sm text-muted-foreground space-x-1">
					<li>
						<Link
							href="/market/profile"
							className="text-foreground hover:underline"
						>
							Meu perfil
						</Link>
					</li>
					<li>
						<span className="px-1">/</span>
					</li>
					<li className="text-foreground font-semibold">
						Informações pessoais
					</li>
				</ol>
			</nav>

			<section className="w-full max-w-4xl bg-white rounded-lg border border-border shadow p-6 md:p-10 space-y-6 text-foreground">
				{/* Header com avatar */}
				<div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6 relative">
					<button
						onClick={() => setIsChangePhotoModalOpen(true)}
						className="relative w-20 h-20 group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
						aria-label="Alterar foto de perfil"
						disabled={isUploadingPhoto}
					>
						<Avatar className="h-20 w-20 border border-border">
							{currentPhoto ? (
								<AvatarImage src={currentPhoto} alt="" />
							) : userLoaded ? (
								<AvatarFallback className="bg-muted text-foreground/70 font-semibold text-2xl">
									{(name?.trim?.() || "?")?.charAt(0)?.toUpperCase?.()}
								</AvatarFallback>
							) : null}
						</Avatar>
						{/* Spinner removido conforme solicitado */}
						<div className="absolute bottom-0 right-0 bg-white p-1 rounded-full border border-border shadow-sm group-hover:bg-gray-50 transition-colors">
							<Camera className="w-4 h-4 text-muted-foreground" />
						</div>
					</button>
					<div>
						<h2 className="text-base font-medium">{name}</h2>
						<p className="text-sm text-muted-foreground">{email}</p>
					</div>
				</div>

				<hr className="border-gray-200" />

				{/* Identificação */}
				<div className="space-y-4">
					<h3 className="font-medium">Identificação</h3>
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
						<div>
							<span className="block text-foreground">CNPJ</span>
							<span className="text-sm text-muted-foreground">
								{formatCpfCnpj(cnpj as string)}
							</span>
						</div>
						<div>
							<span className="block text-foreground">CCIR</span>
							<span className="text-sm text-muted-foreground">
								{ccir ?? "—"}
							</span>
						</div>
						<div>
							<span className="block text-foreground">Telefone</span>
							<span className="text-sm text-muted-foreground">{phone}</span>
						</div>
						<div>
							<span className="block text-foreground">Email</span>
							<span className="text-sm text-muted-foreground">{email}</span>
						</div>
					</div>
					<Link href="/market/profile/personal-info/change-user-info">
						<Button className="mt-4 flex items-center gap-2 text-white bg-primary hover:bg-success">
							<Pencil size={16} /> Editar informações
						</Button>
					</Link>
				</div>

				<hr className="border-gray-200" />

				{/* Tipo de usuário */}
				<div className="space-y-2">
					<h3 className="font-medium">Usuário</h3>
					<p className="text-foreground">Tipo de usuário</p>
					<p className="text-sm text-muted-foreground">{tipo}</p>
					{/* <Button className="mt-2 flex items-center gap-2 text-white bg-primary hover:bg-success">
						<UserRoundPen size={16} /> Alterar tipo de usuário
					</Button> */}
				</div>

				<hr className="border-gray-200" />

				{/* Segurança */}
				<div className="space-y-2">
					<h3 className="font-medium">Segurança</h3>
					<p className="text-sm text-muted-foreground">
						Ao alterar a senha, todas as sessões abertas são encerradas.
					</p>
					<Link href="/market/profile/personal-info/change-password">
						<Button className="mt-2 flex items-center gap-2 text-white bg-primary hover:bg-success">
							<KeyRound size={16} /> Alterar senha
						</Button>
					</Link>
				</div>

				<hr className="border-gray-200" />

				{/* Endereço */}
				<div className="space-y-2">
					<h3 className="font-medium">Endereço</h3>

					{addrLoading ? (
						<p className="text-sm text-muted-foreground animate-pulse">
							Carregando endereço…
						</p>
					) : addrError ? (
						<p className="text-sm text-muted-foreground">{addrError}</p>
					) : (
						<p className="text-sm text-muted-foreground">
							{formatAddress(defaultAddress)}
						</p>
					)}

					<Link href="/market/profile/personal-info/addresses">
						<Button className="mt-2 flex items-center gap-2 text-white bg-primary hover:bg-success">
							<Eye size={16} /> Ver todos endereços
						</Button>
					</Link>
				</div>
			</section>

			{/* Modal para alterar foto */}
			<ChangePhotoModal
				isOpen={isChangePhotoModalOpen}
				setIsOpen={setIsChangePhotoModalOpen}
				currentSrc={currentPhoto || null}
				onPhotoChange={handlePhotoChange}
				isUploading={isUploadingPhoto}
				fallbackInitial={(name?.trim?.() || "?")?.charAt(0)?.toUpperCase?.()}
			/>
		</main>
	);
}

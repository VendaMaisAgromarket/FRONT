"use client";

import { createAddress } from "@/actions/address";
import { AddressFormValues } from "@/lib/schemas";
import TanstackProvider from "@/providers/tanstackProvider";
import { useNotificationsStore } from "@/store/notificationsStore";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import AddressForm from "../components/AddressForm";

export default function AddAddressPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const redirect = searchParams.get("redirect");
	const refreshUnreadCount = useNotificationsStore((s) => s.refreshUnreadCount);

	async function onSubmit(data: AddressFormValues) {
		try {
			await createAddress(data);
			refreshUnreadCount({ silent: true });
			toast.success("Endereço cadastrado com sucesso!");
			router.push(redirect ?? "/market/profile/personal-info/addresses");
		} catch (err) {
			console.error(err);
			toast.error("Erro ao cadastrar endereço.");
		}
	}

	return (
		<main className="min-h-screen bg-gray-50">
			<div className="max-w-7xl mx-auto p-6">
				{/* Breadcrumb alinhado ao container de max-w-4xl */}
				<nav aria-label="breadcrumb" className="w-full max-w-4xl mx-auto mb-6">
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
						<li>
							<Link
								href="/market/profile/personal-info"
								className="text-foreground hover:underline"
							>
								Informações pessoais
							</Link>
						</li>
						<li>
							<span className="px-1">/</span>
						</li>
						<li>
							<Link
								href="/market/profile/personal-info/addresses"
								className="text-foreground hover:underline"
							>
								Meus endereços
							</Link>
						</li>
						<li>
							<span className="px-1">/</span>
						</li>
						<li className="text-foreground font-semibold">
							Adicionar endereço
						</li>
					</ol>
				</nav>

				{/* Formulário */}
				<TanstackProvider>
					<AddressForm
						onSubmit={onSubmit}
						onFormDismiss={() => router.back()}
					/>
				</TanstackProvider>
			</div>
		</main>
	);
}

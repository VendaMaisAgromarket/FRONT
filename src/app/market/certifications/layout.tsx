import { getUserData } from "@/actions/user";
import { CERTIFICATION_ROUTES } from "@/components/certifications/certificationUtils";
import Navbar from "@/components/navbar";
import { sessionExpiredUrl } from "@/lib/authRedirect";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

export const metadata: Metadata = {
	title: "Certificações | Venda+",
	description: "Certifique sua fazenda e suas safras e ganhe os selos nos seus anúncios",
};

export const dynamic = "force-dynamic";

// Comprador e produtor (o mesmo usuário pode comprar e vender). Admin avalia pela fila do admin.
// Vale para /market/certifications/farm e /harvest (destinos dos e-mails e notificações do dono).
export default async function CertificationsLayout({ children }: { children: ReactNode }) {
	let role: string | null = null;
	try {
		role = (await getUserData()).role;
	} catch {
		redirect(sessionExpiredUrl((await headers()).get("x-pathname")));
	}
	if (role === "admin") {
		// Admin avalia pela fila do mesmo escopo
		const path = (await headers()).get("x-pathname") ?? "";
		redirect(path.startsWith("/market/certifications/harvest") ? "/admin/certifications/harvest" : CERTIFICATION_ROUTES.adminList);
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<Navbar />
			{children}
		</div>
	);
}

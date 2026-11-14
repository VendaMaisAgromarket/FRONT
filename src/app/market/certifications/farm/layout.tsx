import { getUserData } from "@/actions/user";
import Navbar from "@/components/navbar";
import { sessionExpiredUrl } from "@/lib/authRedirect";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

export const metadata: Metadata = {
	title: "Certificações | Venda+",
	description: "Envie a certificação da sua fazenda e ganhe o selo de Fazenda certificada",
};

export const dynamic = "force-dynamic";

// Só produtores. Destino dos e-mails e notificações enviados ao produtor.
export default async function FarmCertificationsLayout({ children }: { children: ReactNode }) {
	let role: string | null = null;
	try {
		role = (await getUserData()).role;
	} catch {
		redirect(sessionExpiredUrl((await headers()).get("x-pathname")));
	}
	if (role !== "producer") redirect("/market");

	return (
		<div className="min-h-screen bg-gray-50">
			<Navbar />
			{children}
		</div>
	);
}

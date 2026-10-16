import Navbar from "@/components/navbar";
import type { Metadata } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
	title: "Notificações | Venda+",
	description: "Acompanhe as atualizações dos seus pedidos e anúncios",
};

export default function NotificationsLayout({ children }: { children: ReactNode }) {
	return (
		<div className="min-h-screen bg-gray-50">
			<Navbar />
			{children}
		</div>
	);
}

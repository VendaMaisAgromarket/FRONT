"use client";

import HarvestCertificationForm from "@/components/certifications/HarvestCertificationForm";
import { certificationRoutes } from "@/components/certifications/certificationUtils";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const routes = certificationRoutes("harvest");

export default function NewHarvestCertificationClient({ cropSuggestions }: { cropSuggestions: string[] }) {
	const router = useRouter();

	return (
		<main className="mx-auto max-w-3xl space-y-6 px-4 py-6">
			<Link
				href={routes.list}
				className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
			>
				<ArrowLeft className="size-4" />
				Minhas certificações de safra
			</Link>
			<div>
				<h1 className="text-2xl font-bold text-gray-900">Inserir certificação de safra</h1>
				<p className="text-sm text-gray-600">
					Preencha os dados da safra e do certificado e anexe os laudos. Depois do envio, vincule os anúncios
					dessa safra.
				</p>
			</div>
			<div className="rounded-lg border bg-white p-4 shadow-sm md:p-6">
				<HarvestCertificationForm
					cropSuggestions={cropSuggestions}
					onCancel={() => router.push(routes.list)}
					onSuccess={(result) => {
						toast.success("Certificação enviada para análise. Agora vincule os anúncios dessa safra.");
						// Abre o detalhe já na seção "Anúncios vinculados"
						router.push(routes.listWithDetail(result.id));
					}}
				/>
			</div>
		</main>
	);
}

"use client";

import FarmCertificationForm from "@/components/certifications/FarmCertificationForm";
import { CERTIFICATION_ROUTES } from "@/components/certifications/certificationUtils";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function NewFarmCertificationClient({ defaultCcir }: { defaultCcir: string | null }) {
	const router = useRouter();

	return (
		<main className="mx-auto max-w-3xl space-y-6 px-4 py-6">
			<Link
				href={CERTIFICATION_ROUTES.producerList}
				className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
			>
				<ArrowLeft className="size-4" />
				Minhas certificações
			</Link>
			<div>
				<h1 className="text-2xl font-bold text-gray-900">Inserir certificação</h1>
				<p className="text-sm text-gray-600">
					Preencha os dados da fazenda e do certificado e anexe o documento. Nossa equipe vai avaliar.
				</p>
			</div>
			<div className="rounded-lg border bg-white p-4 shadow-sm md:p-6">
				<FarmCertificationForm
					defaultCcir={defaultCcir}
					onCancel={() => router.push(CERTIFICATION_ROUTES.producerList)}
					onSuccess={() => {
						toast.success("Certificação enviada para análise");
						router.push(CERTIFICATION_ROUTES.producerList);
					}}
				/>
			</div>
		</main>
	);
}

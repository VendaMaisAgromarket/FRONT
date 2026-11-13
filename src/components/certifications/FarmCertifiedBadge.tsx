"use client";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { getFarmCertificationBadge } from "@/services/farmCertifications";
import { FarmCertificationType } from "@/types/types";
import { BadgeCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { CERTIFICATION_TYPE_LABELS, formatCalendarDate } from "./certificationUtils";

export type BadgeCertification = {
	type: FarmCertificationType;
	certifierName: string;
	validUntil: string;
};

type Props = {
	certifications?: BadgeCertification[] | null;
	size?: "sm" | "md";
	className?: string;
};

// Selo público "Fazenda certificada". Só mostra tipo, certificadora e validade:
// nada de nome da fazenda, CNPJ, CCIR/CAR, área ou documentos.
export default function FarmCertifiedBadge({ certifications, size = "sm", className }: Props) {
	const [open, setOpen] = useState(false);
	if (!certifications?.length) return null;

	// Dentro de <Link> (card de produto): não deixa o clique navegar.
	const stop = (e: React.SyntheticEvent) => {
		e.preventDefault();
		e.stopPropagation();
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger
				// Controlado à mão: o preventDefault (para o <Link> do card não navegar) também
				// impede o toggle automático do Radix.
				onClick={(e) => {
					stop(e);
					setOpen((o) => !o);
				}}
				className={cn(
					"inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 font-medium text-green-800 cursor-pointer hover:bg-green-100",
					size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm",
					className
				)}
				aria-label="Fazenda certificada — ver detalhes"
			>
				<BadgeCheck className={size === "sm" ? "size-3.5" : "size-4"} />
				Fazenda certificada
			</PopoverTrigger>
			<PopoverContent className="w-72 p-3" onClick={stop} align="start">
				<p className="mb-2 text-sm font-semibold text-gray-900">Fazenda certificada</p>
				<ul className="space-y-2">
					{certifications.map((c, i) => (
						<li key={`${c.type}-${i}`} className="text-sm">
							<p className="font-medium text-gray-900">
								{CERTIFICATION_TYPE_LABELS[c.type] ?? c.type}
							</p>
							<p className="text-xs text-gray-600">{c.certifierName}</p>
							<p className="text-xs text-gray-500">Válido até {formatCalendarDate(c.validUntil)}</p>
						</li>
					))}
				</ul>
			</PopoverContent>
		</Popover>
	);
}

// Variante que busca o selo público do produtor (perfil público, "vendido por").
export function FarmCertifiedBadgeByUser({
	userId,
	...rest
}: Omit<Props, "certifications"> & { userId: string }) {
	const [certs, setCerts] = useState<BadgeCertification[] | null>(null);

	useEffect(() => {
		let active = true;
		getFarmCertificationBadge(userId)
			.then((b) => active && setCerts(b.certified ? b.certifications : []))
			.catch(() => active && setCerts([]));
		return () => {
			active = false;
		};
	}, [userId]);

	return <FarmCertifiedBadge certifications={certs} {...rest} />;
}

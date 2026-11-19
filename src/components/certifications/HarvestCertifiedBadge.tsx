"use client";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { getHarvestProductBadge } from "@/services/harvestCertifications";
import { ProductHarvestCertification } from "@/types/types";
import { Wheat } from "lucide-react";
import { useEffect, useState } from "react";
import { HARVEST_TYPE_LABELS, formatCalendarDate } from "./certificationUtils";

type Props = {
	certification?: ProductHarvestCertification | null;
	size?: "sm" | "md";
	className?: string;
};

// Selo público "Safra certificada" de um anúncio. Mostra só tipo, cultura/variedade, ano agrícola,
// certificadora e validade: nada de talhão, área, produção, CNPJ ou laudos.
// Não renderizar dentro de <a>/<Link>: o gatilho é um botão (controle interativo).
export default function HarvestCertifiedBadge({ certification: c, size = "sm", className }: Props) {
	if (!c) return null;
	const cropLabel = [c.crop, c.variety].filter(Boolean).join(" ");

	return (
		<Popover>
			<PopoverTrigger
				className={cn(
					"inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 font-medium text-amber-800 cursor-pointer hover:bg-amber-100",
					size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm",
					className
				)}
				aria-label="Safra certificada — ver detalhes"
			>
				<Wheat className={size === "sm" ? "size-3.5" : "size-4"} />
				Safra certificada
			</PopoverTrigger>
			<PopoverContent className="w-72 p-3" align="start">
				<p className="mb-2 text-sm font-semibold text-gray-900">Safra certificada</p>
				<div className="space-y-0.5 text-sm">
					<p className="font-medium text-gray-900">{HARVEST_TYPE_LABELS[c.type] ?? c.type}</p>
					<p className="text-xs text-gray-600">
						{cropLabel} · safra {c.harvestSeason}
					</p>
					<p className="text-xs text-gray-600">{c.certifierName}</p>
					<p className="text-xs text-gray-500">Válido até {formatCalendarDate(c.validUntil)}</p>
				</div>
			</PopoverContent>
		</Popover>
	);
}

// Variante para telas que não carregam o produto completo (ex.: carrinho): usa o selo público.
export function HarvestCertifiedBadgeByProduct({
	productId,
	...rest
}: Omit<Props, "certification"> & { productId: string }) {
	const [cert, setCert] = useState<ProductHarvestCertification | null>(null);

	useEffect(() => {
		let active = true;
		getHarvestProductBadge(productId)
			.then((b) => active && setCert(b.certified ? b.certification : null))
			.catch(() => active && setCert(null));
		return () => {
			active = false;
		};
	}, [productId]);

	return <HarvestCertifiedBadge certification={cert} {...rest} />;
}

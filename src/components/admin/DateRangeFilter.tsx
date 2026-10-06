"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { DATE_PRESET_OPTIONS, DatePreset } from "@/lib/dateRangePresets";
import { X } from "lucide-react";

const CUSTOM = "custom";

type DateRangeFilterProps = {
	preset: DatePreset | null;
	customStart: string;
	customEnd: string;
	onPresetSelect: (preset: DatePreset | null) => void;
	onCustomChange: (field: "start" | "end", value: string) => void;
	onClear: () => void;
};

export default function DateRangeFilter({
	preset,
	customStart,
	customEnd,
	onPresetSelect,
	onCustomChange,
	onClear,
}: DateRangeFilterProps) {
	const hasCustomDates = customStart !== "" || customEnd !== "";
	const hasFilter = preset !== null || hasCustomDates;
	// Só mostra "Personalizado" selecionado quando já há data digitada — com preset
	// nulo e nenhuma data preenchida, o filtro não está ativo, então o select deve
	// mostrar o placeholder em vez de sugerir uma seleção que não existe de fato.
	const selectValue = preset ?? (hasCustomDates ? CUSTOM : undefined);

	return (
		<div className="flex flex-wrap items-end gap-2">
			<div className="flex flex-col gap-1">
				<span className="text-xs text-muted-foreground">Período</span>
				<Select
					value={selectValue}
					onValueChange={(v) => onPresetSelect(v === CUSTOM ? null : (v as DatePreset))}
				>
					<SelectTrigger size="sm" className="w-[9.5rem]">
						<SelectValue placeholder="Período" />
					</SelectTrigger>
					<SelectContent>
						{DATE_PRESET_OPTIONS.map((opt) => (
							<SelectItem key={opt.key} value={opt.key}>
								{opt.label}
							</SelectItem>
						))}
						<SelectItem value={CUSTOM}>Personalizado</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<div className="flex flex-col gap-1">
				<span className="text-xs text-muted-foreground">De</span>
				<Input
					type="date"
					value={customStart}
					onChange={(e) => onCustomChange("start", e.target.value)}
					className="h-8 w-[9.5rem] text-xs"
					aria-label="Data inicial"
				/>
			</div>

			<div className="flex flex-col gap-1">
				<span className="text-xs text-muted-foreground">Até</span>
				<Input
					type="date"
					value={customEnd}
					onChange={(e) => onCustomChange("end", e.target.value)}
					className="h-8 w-[9.5rem] text-xs"
					aria-label="Data final"
				/>
			</div>

			{hasFilter && (
				<Button
					type="button"
					size="sm"
					variant="ghost"
					onClick={onClear}
					className="h-8 shrink-0 gap-1 px-2 text-xs"
				>
					<X size={12} />
					Limpar
				</Button>
			)}
		</div>
	);
}

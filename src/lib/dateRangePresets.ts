export type DatePreset = "today" | "7d" | "15d" | "30d";

export const DATE_PRESET_OPTIONS: { key: DatePreset; label: string }[] = [
	{ key: "today", label: "Hoje" },
	{ key: "7d", label: "7 dias" },
	{ key: "15d", label: "15 dias" },
	{ key: "30d", label: "30 dias" },
];

const PRESET_DAYS: Record<DatePreset, number> = {
	today: 0,
	"7d": 7,
	"15d": 15,
	"30d": 30,
};

export function computePresetRange(preset: DatePreset): {
	startDate: string;
	endDate: string;
} {
	const endDate = new Date();
	const startDate = new Date();
	if (preset === "today") {
		startDate.setHours(0, 0, 0, 0);
	} else {
		startDate.setDate(startDate.getDate() - PRESET_DAYS[preset]);
	}
	return { startDate: startDate.toISOString(), endDate: endDate.toISOString() };
}

// dateStr no formato yyyy-mm-dd (valor de <input type="date">)
export function startOfDayISO(dateStr: string): string {
	const date = new Date(`${dateStr}T00:00:00`);
	return date.toISOString();
}

export function endOfDayISO(dateStr: string): string {
	const date = new Date(`${dateStr}T23:59:59.999`);
	return date.toISOString();
}

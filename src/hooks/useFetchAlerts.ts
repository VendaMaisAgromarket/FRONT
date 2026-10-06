import { getAlerts } from "@/actions/dashboard";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

export type AlertsFilters = {
	limit?: number;
	startDate?: string;
	endDate?: string;
	categoria?: string;
	criticidade?: string;
	parceiro?: string;
};

export default function useFetchAlerts(filters: AlertsFilters = {}) {
	const { limit = 50, startDate, endDate, categoria, criticidade, parceiro } = filters;

	const { data: result, isLoading } = useQuery({
		queryKey: ["alerts", limit, startDate, endDate, categoria, criticidade, parceiro],
		queryFn: () => getAlerts({ limit, startDate, endDate, categoria, criticidade, parceiro }),
		placeholderData: keepPreviousData,
	});
	return { result, isLoading };
}

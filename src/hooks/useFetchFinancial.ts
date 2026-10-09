import { getFinancial } from "@/actions/dashboard";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

export type FinancialFilters = {
	limit?: number;
	startDate?: string;
	endDate?: string;
	parceiro?: string;
	produto?: string;
	comprador?: string;
	vendedor?: string;
};

export default function useFetchFinancial(filters: FinancialFilters = {}) {
	const { limit = 5, startDate, endDate, parceiro, produto, comprador, vendedor } = filters;

	const { data: result, isLoading, isFetching, refetch } = useQuery({
		queryKey: ["financial", limit, startDate, endDate, parceiro, produto, comprador, vendedor],
		queryFn: () => getFinancial({ limit, startDate, endDate, parceiro, produto, comprador, vendedor }),
		placeholderData: keepPreviousData,
	});
	return { result, isLoading, isFetching, refetch };
}

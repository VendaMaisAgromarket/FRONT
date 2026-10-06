import { getPipeline } from "@/actions/dashboard";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

export type PipelineFilters = {
	page?: number;
	pageSize?: number;
	startDate?: string;
	endDate?: string;
	stage?: string;
	blocked?: boolean;
	produto?: string;
	comprador?: string;
	vendedor?: string;
};

export default function useFetchPipeline(filters: PipelineFilters = {}) {
	const { page = 1, pageSize = 20, startDate, endDate, stage, blocked, produto, comprador, vendedor } = filters;

	const { data: result, isLoading } = useQuery({
		queryKey: ["pipeline", page, pageSize, startDate, endDate, stage, blocked, produto, comprador, vendedor],
		queryFn: () =>
			getPipeline({ page, pageSize, startDate, endDate, stage, blocked, produto, comprador, vendedor }),
		placeholderData: keepPreviousData,
	});
	return { result, isLoading };
}

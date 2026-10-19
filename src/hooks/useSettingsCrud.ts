import {
	SettingsResource,
	createSetting,
	deleteSetting,
	listSettings,
	updateSetting,
} from "@/actions/adminSettings";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export default function useSettingsCrud<T>(resource: SettingsResource) {
	const queryClient = useQueryClient();
	const queryKey = ["settings", resource];

	const { data: result, isLoading } = useQuery({
		queryKey,
		queryFn: () => listSettings<T>(resource),
	});

	const invalidate = () => queryClient.invalidateQueries({ queryKey });

	const createMutation = useMutation({
		mutationFn: (body: Record<string, unknown>) => createSetting(resource, body),
		onSuccess: invalidate,
	});

	const updateMutation = useMutation({
		mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
			updateSetting(resource, id, body),
		onSuccess: invalidate,
	});

	const deleteMutation = useMutation({
		mutationFn: (id: string) => deleteSetting(resource, id),
		onSuccess: invalidate,
	});

	return { result, isLoading, createMutation, updateMutation, deleteMutation };
}

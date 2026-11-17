"use client";

import { editAddress } from "@/actions/address";
import { AddressFormValues } from "@/lib/schemas";
import { useNotificationsStore } from "@/store/notificationsStore";
import { Address } from "@/types/types";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import AddressForm from "./AddressForm";

export default function EditAddressForm({ data: address }: { data: Address }) {
	const defaultValues: AddressFormValues = {
		...address,
	};
	const router = useRouter();
	const refreshUnreadCount = useNotificationsStore((s) => s.refreshUnreadCount);

	async function onSubmit(data: AddressFormValues) {
		try {
			await editAddress(address.id, data);
			refreshUnreadCount({ silent: true });
			toast.success("Endereço editado com sucesso.");
			router.push("/market/profile/personal-info/addresses");
		} catch (error) {
			console.error("Erro ao editar endereço: ", error);
			toast.error("Erro ao editar endereço, por favor tente novamente.");
		}
	}

	return (
		<AddressForm
			onSubmit={onSubmit}
			defaultValues={defaultValues}
			isEditing
			onFormDismiss={() => router.back()}
		/>
	);
}

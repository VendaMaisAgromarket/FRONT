import { setNewDefaultAddress } from "@/actions/address";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Address } from "@/types/types";
import { useNotificationsStore } from "@/store/notificationsStore";
import { Dispatch, SetStateAction } from "react";
import { toast } from "sonner";

interface NewDefaultAddressModalProps {
	isOpen: boolean;
	setIsOpen: Dispatch<SetStateAction<boolean>>;
	address: Address;
}

export default function NewDefaultAddressModal({
	isOpen,
	setIsOpen,
	address,
}: NewDefaultAddressModalProps) {
	const refreshUnreadCount = useNotificationsStore((s) => s.refreshUnreadCount);
	async function handleSetDefaultAddress() {
		const res = await setNewDefaultAddress(address.id, address.alias);

		if (res.sucess) {
			refreshUnreadCount({ silent: true });
			return toast.success(res.message);
		}

		return toast.error(res.message);
	}

	return (
		<AlertDialog open={isOpen} onOpenChange={setIsOpen}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Confirmar operação</AlertDialogTitle>
					<AlertDialogDescription>
						Tem certeza que deseja utilizar{" "}
						<span className="text-primary font-semibold">{address.alias}</span>{" "}
						como padrão?
					</AlertDialogDescription>
				</AlertDialogHeader>

				<AlertDialogFooter>
					<AlertDialogCancel>Cancelar</AlertDialogCancel>
					<AlertDialogAction
						className="bg-primary"
						onClick={handleSetDefaultAddress}
					>
						Confirmar
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

"use client";

import { changeOwnPassword } from "@/actions/user";
import PasswordField from "@/components/auth/PasswordField";
import PasswordRequirements from "@/components/PasswordRequirements";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { loginUrl } from "@/lib/authRedirect";
import { changePasswordSchema } from "@/lib/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, Loader2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

export default function ChangePasswordForm() {
	const router = useRouter();
	const form = useForm<ChangePasswordValues>({
		resolver: zodResolver(changePasswordSchema),
		defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
		mode: "onTouched",
	});
	const newPassword = useWatch({ control: form.control, name: "newPassword" });
	// Fica true após o 200: a sessão já foi encerrada, o form não pode ser reenviado.
	const [isLeaving, setIsLeaving] = useState(false);
	const isBusy = form.formState.isSubmitting || isLeaving;

	async function onSubmit(values: ChangePasswordValues) {
		try {
			const res = await changeOwnPassword(values);
			if (res.ok) {
				setIsLeaving(true);
				// Navegação completa: limpa stores do cliente e não faz chamadas com o token antigo.
				window.location.assign(loginUrl("password-changed"));
				return;
			}
			if (res.reason === "session-expired") {
				window.location.assign(loginUrl("expired", "/market/profile/personal-info/change-password"));
				return;
			}
			if (res.field) {
				form.setError(res.field, { type: "server", message: res.message });
				return;
			}
			toast.error(res.message);
		} catch {
			toast.error("Erro de rede ao alterar a senha. Tente novamente.");
		}
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-md" noValidate>
				<FormField
					control={form.control}
					name="currentPassword"
					render={({ field }) => (
						<FormItem>
							<FormLabel>
								Senha atual <span className="text-red-500">*</span>
							</FormLabel>
							<FormControl>
								<PasswordField autoComplete="current-password" disabled={isBusy} {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="newPassword"
					render={({ field }) => (
						<FormItem>
							<FormLabel>
								Nova senha <span className="text-red-500">*</span>
							</FormLabel>
							<FormControl>
								<PasswordField autoComplete="new-password" disabled={isBusy} {...field} />
							</FormControl>
							<PasswordRequirements password={newPassword} />
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="confirmPassword"
					render={({ field }) => (
						<FormItem>
							<FormLabel>
								Confirmar nova senha <span className="text-red-500">*</span>
							</FormLabel>
							<FormControl>
								<PasswordField autoComplete="new-password" disabled={isBusy} {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<div className="flex flex-col sm:flex-row gap-4 pt-4">
					<Button
						type="submit"
						disabled={isBusy}
						className="flex-1 flex items-center justify-center gap-2 text-gray-50 bg-primary hover:bg-success transition h-12 disabled:bg-gray-400 disabled:cursor-auto disabled:opacity-50"
					>
						{isBusy ? (
							<>
								<Loader2 size={16} className="animate-spin" />
								Salvando…
							</>
						) : (
							<>
								<KeyRound size={16} />
								Alterar senha
							</>
						)}
					</Button>
					<Button
						type="button"
						disabled={isBusy}
						onClick={() => router.push("/market/profile/personal-info")}
						className="flex-1 flex items-center justify-center gap-2 text-gray-50 bg-red-500 hover:bg-red-600 transition h-12 disabled:bg-gray-400 disabled:cursor-auto disabled:opacity-50"
					>
						<XCircle size={16} />
						<span>Cancelar</span>
					</Button>
				</div>
			</form>
		</Form>
	);
}

"use client";

import { resetPassword } from "@/actions/auth";
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
import { resetPasswordSchema } from "@/lib/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleCheck, Link2Off, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

type ResetPasswordInputs = z.infer<typeof resetPasswordSchema>;

const REDIRECT_SECONDS = 3;

function InvalidLink({ message }: { message: string }) {
	return (
		<div className="flex flex-col items-center text-center space-y-4">
			<Link2Off className="h-12 w-12 text-destructive" aria-hidden="true" />
			<h2 className="text-2xl font-bold">Link inválido</h2>
			<p className="text-sm text-gray-700" role="alert">
				{message}
			</p>
			<Button asChild className="w-full h-12 bg-primary hover:bg-success text-white">
				<Link href="/forgot-password">Solicitar novo link</Link>
			</Button>
			<Link href="/login" className="text-sm text-primary font-bold">
				Voltar para o login
			</Link>
		</div>
	);
}

export default function ResetPasswordForm({ token }: { token: string }) {
	const router = useRouter();
	const form = useForm<ResetPasswordInputs>({
		resolver: zodResolver(resetPasswordSchema),
		defaultValues: { newPassword: "", confirmPassword: "" },
		mode: "onTouched",
	});
	const [invalidLinkMessage, setInvalidLinkMessage] = useState<string | null>(
		token ? null : "O link de redefinição está incompleto. Solicite um novo link."
	);
	const [succeeded, setSucceeded] = useState(false);
	const [countdown, setCountdown] = useState(REDIRECT_SECONDS);
	const newPassword = useWatch({ control: form.control, name: "newPassword" });

	useEffect(() => {
		if (!succeeded) return;
		if (countdown <= 0) {
			router.replace(loginUrl("password-reset"));
			return;
		}
		const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
		return () => clearTimeout(timer);
	}, [succeeded, countdown, router]);

	// O link é de uso único: em caso de erro, nunca reenviar automaticamente.
	async function onSubmit(data: ResetPasswordInputs) {
		try {
			const res = await resetPassword(token, data.newPassword);
			if (res.ok) {
				setSucceeded(true);
				return;
			}
			if (res.reason === "invalid-link") {
				setInvalidLinkMessage(
					"Este link expirou, já foi usado ou foi substituído por um pedido mais novo."
				);
			} else if (res.reason === "weak-password") {
				form.setError("newPassword", { type: "server", message: res.message });
			} else {
				toast.error(res.message);
			}
		} catch {
			toast.error("Erro de rede ao alterar a senha. Tente novamente.");
		}
	}

	if (invalidLinkMessage) {
		return <InvalidLink message={invalidLinkMessage} />;
	}

	if (succeeded) {
		return (
			<div className="flex flex-col items-center text-center space-y-4">
				<CircleCheck className="h-12 w-12 text-primary" aria-hidden="true" />
				<h2 className="text-2xl font-bold">Senha alterada com sucesso!</h2>
				<p className="text-sm text-gray-700" role="status">
					Por segurança, encerramos as sessões abertas. Você será levado ao
					login em {countdown}s.
				</p>
				<Button asChild className="w-full h-12 bg-primary hover:bg-success text-white">
					<Link href={loginUrl("password-reset")} replace>
						Ir para o login
					</Link>
				</Button>
			</div>
		);
	}

	const isSubmitting = form.formState.isSubmitting;

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
				<h2 className="text-2xl font-bold text-center mb-2">Redefinir senha</h2>
				<p className="text-sm text-center mb-6">Crie uma nova senha para sua conta.</p>
				<FormField
					control={form.control}
					name="newPassword"
					render={({ field }) => (
						<FormItem>
							<FormLabel>
								Nova senha <span className="text-red-500">*</span>
							</FormLabel>
							<FormControl>
								<PasswordField
									autoComplete="new-password"
									disabled={isSubmitting}
									{...field}
								/>
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
								<PasswordField
									autoComplete="new-password"
									disabled={isSubmitting}
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<Button
					type="submit"
					className="w-full p-3 mt-4 h-12 text-white rounded font-medium bg-primary hover:bg-success transition"
					disabled={isSubmitting}
				>
					{isSubmitting ? (
						<>
							<Loader2 size={16} className="animate-spin" />
							Salvando…
						</>
					) : (
						"Redefinir senha"
					)}
				</Button>
			</form>
		</Form>
	);
}

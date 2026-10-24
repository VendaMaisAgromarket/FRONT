"use client";

import { requestPasswordReset } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { forgotPasswordSchema } from "@/lib/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, MailCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

type ForgotPasswordInputs = z.infer<typeof forgotPasswordSchema>;

// O back ignora pedidos repetidos para a mesma conta em menos de 1 minuto.
const RESEND_COOLDOWN_SECONDS = 60;

export default function ForgotPasswordForm() {
	const form = useForm<ForgotPasswordInputs>({
		resolver: zodResolver(forgotPasswordSchema),
		defaultValues: { email: "" },
	});
	const [sentTo, setSentTo] = useState<string | null>(null);
	const [isSending, setIsSending] = useState(false);
	const [cooldown, setCooldown] = useState(0);

	useEffect(() => {
		if (cooldown <= 0) return;
		const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
		return () => clearTimeout(timer);
	}, [cooldown]);

	async function send(email: string) {
		setIsSending(true);
		try {
			const res = await requestPasswordReset(email);
			if (!res.ok) {
				toast.error(res.message);
				return;
			}
			setSentTo(email);
			setCooldown(RESEND_COOLDOWN_SECONDS);
		} catch {
			toast.error("Erro de rede ao solicitar redefinição. Tente novamente.");
		} finally {
			setIsSending(false);
		}
	}

	if (sentTo) {
		return (
			<div className="flex flex-col items-center text-center space-y-4">
				<MailCheck className="h-12 w-12 text-primary" aria-hidden="true" />
				<h2 className="text-2xl font-bold">Verifique seu e-mail</h2>
				<p className="text-sm text-gray-700" role="status">
					Se o e-mail estiver cadastrado, você receberá um link em instantes. O
					link vale por 30 minutos. Verifique também a caixa de spam.
				</p>
				<Button
					type="button"
					variant="outline"
					className="w-full h-12"
					disabled={isSending || cooldown > 0}
					onClick={() => send(sentTo)}
				>
					{isSending ? (
						<>
							<Loader2 size={16} className="animate-spin" />
							Reenviando…
						</>
					) : cooldown > 0 ? (
						`Reenviar em ${cooldown}s`
					) : (
						"Reenviar"
					)}
				</Button>
				<Link href="/login" className="text-sm text-primary font-bold">
					Voltar para o login
				</Link>
			</div>
		);
	}

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit((data) => send(data.email))}
				className="space-y-4"
				noValidate
			>
				<h2 className="text-2xl font-bold text-center mb-2">
					Esqueci minha senha
				</h2>
				<p className="text-sm text-center mb-6">
					Informe o e-mail da sua conta e enviaremos um link para redefinir a
					senha.
				</p>
				<FormField
					control={form.control}
					name="email"
					render={({ field }) => (
						<FormItem>
							<FormLabel>
								E-mail <span className="text-red-500">*</span>
							</FormLabel>
							<FormControl>
								<Input
									type="email"
									autoComplete="email"
									placeholder="usuario@email.com"
									disabled={isSending}
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
					disabled={isSending}
				>
					{isSending ? (
						<>
							<Loader2 size={16} className="animate-spin" />
							Enviando…
						</>
					) : (
						"Enviar link"
					)}
				</Button>
				<p className="text-center text-sm">
					Lembrou a senha?{" "}
					<Link href="/login" className="text-primary font-bold">
						Voltar para o login
					</Link>
				</p>
			</form>
		</Form>
	);
}

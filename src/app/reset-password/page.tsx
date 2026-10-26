import AuthPageShell from "@/components/auth/AuthPageShell";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import type { Metadata } from "next";

// O backend monta o link como `${URL_FRONTEND}/reset-password?token=<token>`
// (PASSWORD_RESET_FRONT_PATH em user.service.ts) — não mudar esta rota sem alinhar com o back.
export const metadata: Metadata = {
	title: "Redefinir senha | Venda+",
	// Evita que o token da URL vaze no Referer para recursos externos.
	referrer: "no-referrer",
};

export default async function ResetPasswordPage({
	searchParams,
}: {
	searchParams: Promise<{ token?: string | string[] }>;
}) {
	const { token } = await searchParams;

	return (
		<AuthPageShell>
			<ResetPasswordForm token={typeof token === "string" ? token : ""} />
		</AuthPageShell>
	);
}

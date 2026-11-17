import AuthPageShell from "@/components/auth/AuthPageShell";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Esqueci minha senha | Venda+",
};

export default function ForgotPasswordPage() {
	return (
		<AuthPageShell>
			<ForgotPasswordForm />
		</AuthPageShell>
	);
}

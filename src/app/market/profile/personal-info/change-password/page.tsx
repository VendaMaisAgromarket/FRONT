import type { Metadata } from "next";
import Link from "next/link";
import ChangePasswordForm from "./components/ChangePasswordForm";

export const metadata: Metadata = {
  title: "Alterar senha | Venda+",
};

export default function ChangePasswordPage() {
  return (
    <main className="min-h-screen bg-background px-4 md:px-20 py-10 flex flex-col items-center">
      <nav aria-label="breadcrumb" className="w-full max-w-4xl mb-4">
        <ol className="flex flex-wrap items-center text-sm text-muted-foreground space-x-1">
          <li>
            <Link
              href="/market/profile"
              className="text-foreground hover:underline"
            >
              Meu perfil
            </Link>
          </li>
          <li>
            <span className="px-1">/</span>
          </li>
          <li>
            <Link
              href="/market/profile/personal-info"
              className="text-foreground hover:underline"
            >
              Informações pessoais
            </Link>
          </li>
          <li>
            <span className="px-1">/</span>
          </li>
          <li className="text-foreground font-semibold">Alterar senha</li>
        </ol>
      </nav>

      <section className="w-full max-w-4xl bg-white rounded-lg border border-border shadow p-6 md:p-10 space-y-6 text-foreground">
        <div>
          <h3 className="text-lg font-medium mb-1">Alterar senha</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Ao salvar, todas as sessões abertas serão encerradas, inclusive esta.
            Você precisará entrar novamente com a nova senha.
          </p>
          <ChangePasswordForm />
        </div>
      </section>
    </main>
  );
}

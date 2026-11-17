// src/app/login/page.tsx
import LoginForm from "@/components/login/LoginForm";
import { LOGIN_NOTICES, LoginReason, safeRedirectPath } from "@/lib/authRedirect";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string; redirect?: string }>;
}) {
  const { reason, redirect } = await searchParams;
  const notice =
    reason && reason in LOGIN_NOTICES
      ? LOGIN_NOTICES[reason as LoginReason]
      : undefined;

  return (
    <main className="bg-background flex flex-col min-h-screen md:flex-row items-start">
      {/* Esquerda: Formulário */}
      <Link
        href="/"
        className="absolute top-6 left-6 text-gray-600 hover:text-black"
      >
        <ArrowLeft />
      </Link>
      <section className="w-full md:w-[40%] px-6 md:px-20 py-10 flex flex-col justify-center text-black mt-5">
        <div className="flex md:hidden justify-center items-center mb-10">
          <Image
            src="/logoVenda+AgromarketColor.png"
            alt="Logo da Venda+ Agromarket"
            width={240}
            height={70}
            priority
          />
        </div>
        {/* Componente de formulário (client) */}
        <LoginForm notice={notice} redirectTo={safeRedirectPath(redirect)} />
      </section>

      {/* Direita: Imagem */}
      <section
        className="hidden md:block w-[60%] relative h-screen"
        aria-hidden="true"
      >
        <div className="absolute top-6 left-6 z-10">
          <Image
            src="/logoVenda+Agromarket.png"
            alt="Logo da Venda+ Agromarket"
            width={160}
            height={40}
            priority
          />
        </div>
        <Image
          src="/imagemAgricultor.jpg"
          alt=""
          fill
          className="object-cover"
          priority
          role="presentation"
        />
      </section>
    </main>
  );
}

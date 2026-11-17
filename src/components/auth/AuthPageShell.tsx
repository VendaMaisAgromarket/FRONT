import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ReactNode } from "react";

// Mesmo layout da tela de login: formulário à esquerda, imagem à direita (desktop).
export default function AuthPageShell({ children }: { children: ReactNode }) {
	return (
		<main className="bg-background flex flex-col min-h-screen md:flex-row items-start">
			<Link
				href="/login"
				aria-label="Voltar para o login"
				className="absolute top-6 left-6 text-gray-600 hover:text-black"
			>
				<ArrowLeft />
			</Link>
			<section className="w-full md:w-[40%] px-6 md:px-20 py-10 flex flex-col justify-center text-black mt-5 md:min-h-screen md:mt-0">
				<div className="flex md:hidden justify-center items-center mb-10">
					<Image
						src="/logoVenda+AgromarketColor.png"
						alt="Logo da Venda+ Agromarket"
						width={240}
						height={70}
						priority
					/>
				</div>
				{children}
			</section>

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

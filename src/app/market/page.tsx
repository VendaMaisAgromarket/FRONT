import { getAll } from "@/actions/product";
import LandingHeaderCarousel from "@/components/landingHeaderCarousel";
import Navbar from "@/components/navbar";
import ProductsCarousel from "@/components/productsCarousel";
import { fruitsCategories, headerSections } from "@/utils/data";
import Image from "next/image";
import Link from "next/link";

export default async function Home() {
	const products = await getAll();
	
	return (
		<>
			<Navbar />
			<header className="relative max-w-[1920px] w-dvw m-auto h-[500px] xl:h-auto">
				<LandingHeaderCarousel />
				<ul className="w-5/6 flex flex-col absolute right-1/2 translate-x-1/2 gap-2 bottom-8 xl:-bottom-8 md:w-auto md:flex-row lg:gap-10">
					{headerSections.map((s, _) => {
						return (
							<li
								key={_}
								className="bg-white hover:bg-neutral-100 flex md:flex-col justify-center items-center px-4 py-2 rounded-xl shadow-lg transition-colors duration-200 h-24 w-full md:w-56 md:h-64 lg:w-64"
							>
								<Link
									href={s.href}
									className="flex items-center gap-2 md:block"
								>
									<div className="block md:hidden">{s.icon}</div>
									<div className="text-center md:text-start">
										<h3 className="text-sm font-semibold md:text-xl md:mb-4">
											{s.title}
										</h3>
										<div className="flex flex-col items-center gap-2">
											<div className="hidden md:block">{s.icon}</div>
											<p className="text-center text-xs md:text-sm">
												{s.description}
											</p>
										</div>
									</div>
								</Link>
							</li>
						);
					})}
				</ul>
			</header>
			<section className="bg-white my-12 max-w-max-screen w-10/12 m-auto p-4 rounded-xl shadow-md">
				<h3 className="text-xl mb-4 font-semibold">Recomendados</h3>
				<ProductsCarousel products={products} />
			</section>
			<section
				id="categorias"
				className="bg-white my-12 max-w-max-screen w-10/12 m-auto p-4 rounded-xl shadow-md scroll-mt-24"
			>
				<div className="flex items-baseline gap-2">
					<h3 className="text-xl mb-4 font-semibold">Categorias</h3>
				</div>
				<ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
					{fruitsCategories.map((c, _) => {
						return (
							<li
								key={_}
								className="border border-gray-5 p-2 rounded-xl h-24 hover:text-blue-500"
							>
								<Link
									href={`/market/category/${encodeURIComponent(c.value)}`}
									className="flex items-center gap-2 h-full"
								>
									<Image
										src={c.imageSrc}
										alt={`Imagem de um ${c.imageAlt}`}
										width={300}
										height={300}
										className="w-20"
									/>
									<h4>{c.label}</h4>
								</Link>
							</li>
						);
					})}
				</ul>
			</section>
		</>
	);
}

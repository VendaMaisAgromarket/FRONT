"use client";

import { getAllFromSeller } from "@/actions/product";
import { getProducerById } from "@/actions/user";
import CategoryNavigation from "@/components/seller-profile/CategoryNavigation";
import SellerProfileHeader from "@/components/seller-profile/SellerProfileHeader";
import type {
    MarketProductCardType,
    ProductFromSeller,
    SellerHeaderData,
    SellerProfileClientProps
} from "@/types/types";
import { isHarvestAvailable } from "@/utils/functions";
import { notFound, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import ProductsCarousel from "../productsCarousel";

function isRecord(x: unknown): x is Record<string, unknown> {
    return typeof x === "object" && x !== null;
}

export default function SellerProfileClient({ sellerId }: SellerProfileClientProps) {
    const searchParams = useSearchParams();

    const [seller, setSeller] = useState<SellerHeaderData>({ name: "Vendedor" });
    const [products, setProducts] = useState<ProductFromSeller[]>([]);
    const [loading, setLoading] = useState(true);
    const [uiError, setUiError] = useState<string | null>(null);

    const activeTab = searchParams.get("tab") || "inicio";
    const activeCategory = searchParams.get("category");

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                setUiError(null);

                const userData = await getProducerById(sellerId);
                if (!userData) {
                    notFound();
                }
                setSeller(userData);

                const products = await getAllFromSeller(sellerId);

                setProducts(products);
            } catch (err) {
                const message =
                    (isRecord(err) && typeof err.message === "string" && err.message) ||
                    "Não foi possível carregar os dados no momento.";
                setUiError(message);
                setSeller({ name: "Vendedor" });
                setProducts([]);
            } finally {
                setLoading(false);
            }
        })();
    }, [sellerId]);

    const availableProducts = useMemo(
        () => products.filter((p) => isHarvestAvailable(p.harvestAt)),
        [products]
    );

    const categories = useMemo(
        () => Array.from(new Set(availableProducts.map((p) => p.category || "Outros"))).filter(Boolean),
        [availableProducts]
    );

    const filteredProducts = useMemo(() => {
        const formatted = availableProducts.map((product) => ({
            ...product,
            id: product.id.toString(),
            sellingUnitProduct: (product.sellingUnitProduct || []).map((u) => ({
                minPrice: u.minPrice,
                unit: u.unit
            }))
        }))

        if (activeTab === "categoria" && activeCategory) {
            return formatted.filter((p) => p.category === activeCategory) as MarketProductCardType[];
        }

        return formatted;
    }, [activeTab, activeCategory, availableProducts]);

    if (loading) {
        return (
            <main className="min-h-screen bg-gray-50">
                <div className="container mx-auto px-4 py-8">
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-300 rounded w-1/4 mb-4"></div>
                        <div className="h-32 bg-gray-300 rounded mb-6"></div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {Array.from({ length: 10 }).map((_, i) => (
                                <div key={i} className="h-64 bg-gray-300 rounded"></div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50">
            <SellerProfileHeader
                name={seller.name}
                img={seller.img}
                sellerId={sellerId}
            />

            <CategoryNavigation
                categories={categories}
                activeTab={activeTab}
                activeCategory={activeCategory || undefined}
                sellerId={sellerId}
            />

            <div className="container mx-auto px-4 py-6">
                {uiError && (
                    <div
                        role="alert"
                        className="mb-4 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-red-800"
                    >
                        <p className="font-semibold">Erro ao carregar dados</p>
                        <p className="text-sm">{uiError}</p>
                    </div>
                )}

                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="mb-6">
                        <h2 className="text-2xl font-semibold text-gray-800">
                            {activeTab === "todos" && "Todos os Produtos"}
                            {activeTab === "categoria" && activeCategory && ` ${activeCategory}`}
                        </h2>
                        <p className="text-gray-600 mt-1">
                            {filteredProducts.length} produto
                            {filteredProducts.length !== 1 ? "s" : ""} encontrado
                            {filteredProducts.length !== 1 ? "s" : ""}
                        </p>
                    </div>

                    <ProductsCarousel products={filteredProducts} />

                    {filteredProducts.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-gray-500 text-lg">Nenhum produto encontrado.</p>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}

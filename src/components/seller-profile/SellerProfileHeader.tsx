import { FarmCertifiedBadgeByUser } from "@/components/certifications/FarmCertifiedBadge";
import Image from "next/image";

type SellerProfileHeaderProps = {
    name: string;
    img?: string;
    sellerId?: string;
};

export default function SellerProfileHeader({
    name,
    img,
    sellerId,
}: SellerProfileHeaderProps) {
    return (
        <header className="w-full">
            <div className="relative w-full h-56 md:h-64 lg:h-72">
                <Image
                    src="/banner-seller-profile.png"
                    alt="Banner do vendedor"
                    fill
                    priority
                    sizes="100vw"
                    className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/5 to-black/30" />

                <div className="absolute inset-0 flex items-center">
                    <div className="container mx-auto px-4 w-full">
                        <div className="mx-auto bg-white rounded-2xl shadow-lg border border-gray-100 px-4 py-4 md:px-6 md:py-5 flex items-center justify-between">
                            <div className="flex items-center gap-4 md:gap-5">
                                <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-gray-100 overflow-hidden flex items-center justify-center">
                                    {img ? (
                                        <Image
                                            src={img}
                                            alt={name}
                                            width={64}
                                            height={64}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-2xl md:text-3xl font-bold text-green-700">
                                            {name?.charAt(0)?.toUpperCase() || "?"}
                                        </span>
                                    )}
                                </div>

                                <div className="flex flex-col">
                                    <span className="inline-flex items-center px-2 py-1 rounded-md text-[11px] md:text-xs font-medium text-gray-600 bg-gray-100 w-max">
                                        Loja oficial
                                    </span>
                                    <h1 className="mt-1 text-lg md:text-xl lg:text-2xl font-semibold text-gray-900">
                                        {name}
                                    </h1>
                                    {sellerId && (
                                        <FarmCertifiedBadgeByUser userId={sellerId} className="mt-1" />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
import { getUserCartData } from "@/actions/cart";
import StoreInitializer from "@/components/userStoreInitializer";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

export default async function SessionProvider({
	children,
}: {
	children: ReactNode;
}) {
	let user = null;
	let cartItems = null;

	const cookieStore = await cookies();
	const sessionCookie = cookieStore.get("session")?.value;

	if (sessionCookie) {
		const userRes = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/user`, {
			headers: { Cookie: `session=${sessionCookie}` },
		});
		if (!userRes.ok) {
			redirect("/api/auth/expired");
		}
		user = await userRes.json();
		const res = await getUserCartData();
		cartItems = res.data
			? res.data.items.map(
					(i: { productId: number; sellingUnitProductId: number }) => ({
						productId: i.productId,
						sellingUnitProductId: i.sellingUnitProductId,
					})
			  )
			: [];
		user = {
			id: user.id,
			email: user.email,
			name: user.name,
			img: user.img ?? null,
			role: user.role ?? null,
		};
	} else {
		redirect("/login");
	}

	return (
		<>
			<StoreInitializer user={user} cart={cartItems} />
			{children}
		</>
	);
}

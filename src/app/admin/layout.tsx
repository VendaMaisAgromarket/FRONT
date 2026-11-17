import AdminShell from "@/components/admin/AdminShell";
import { sessionExpiredUrl } from "@/lib/authRedirect";
import { verifySession } from "@/lib/session";
import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

export const metadata: Metadata = {
	title: "Dashboard Executivo | Venda+",
};

export default async function AdminLayout({
	children,
}: {
	children: ReactNode;
}) {
	const cookieStore = await cookies();
	const session = cookieStore.get("session")?.value;
	await verifySession(session);

	const userRes = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/user`, {
		headers: { Cookie: `session=${session}` },
		cache: "no-store",
	});

	if (!userRes.ok) {
		redirect(sessionExpiredUrl((await headers()).get("x-pathname")));
	}

	const user = await userRes.json();

	if (user.role !== "admin") {
		redirect("/market");
	}

	return (
		<AdminShell user={{ name: user.name, img: user.img ?? null }}>
			{children}
		</AdminShell>
	);
}

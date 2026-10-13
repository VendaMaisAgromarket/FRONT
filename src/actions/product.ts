"use server";

import { CreateProductSchemaType } from "@/lib/schemas";
import { verifySession } from "@/lib/session";
import { ProductToApi } from "@/types/types";
import { isHarvestAvailable } from "@/utils/functions";
import { mapProductDataToFormData } from "@/utils/mappers/mapProductDataToFormData";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const apiUrl = process.env.NEXT_PUBLIC_URL;
const api = process.env.API_URL;

export async function createProduct(values: CreateProductSchemaType) {
	const cookieStore = await cookies();
	const token = cookieStore.get("session")?.value;
	const { id } = await verifySession(token);

	const formData = mapProductDataToFormData(values);
	formData.append("sellerId", id.toString());

	try {
		const res = await fetch(`${apiUrl}/api/sellerProducts`, {
			method: "POST",
			headers: { Cookie: `session=${token}` },
			body: formData,
		});

		if (res.ok) {
			return { status: res.status };
		}
		return {
			status: res.status,
		};
	} catch (err) {
		console.error("Erro no fetch", err);
		return {
			error: err,
		};
	}
}

// includeInactive: telas do vendedor (editar/duplicar) precisam ver produtos desativados
export async function readProductById(id: string, includeInactive = false) {
	const cookieStore = await cookies();
	const session = cookieStore.get("session")?.value;
	await verifySession(session);

	const query = includeInactive ? "?status=all" : "";
	const res = await fetch(`${apiUrl}/api/sellerProducts/${id}${query}`, {
		method: "GET",
		headers: {
			Cookie: `session=${session}`,
		},
	});

	if (!res.ok) {
		console.error(`Erro ao buscar produto ${id}: ${res.statusText}`);
		return null;
	}

	return await res.json();
}

export async function suggestPrice(productName: string) {
	if (!productName) {
		return { success: false, message: "O nome do produto é obrigatório" };
	}

	const url = `${api}/price-recommendations/${encodeURIComponent(productName)}`;

	const res = await fetch(url, {
		method: "GET",
		cache: "no-store",
	});

	if (!res.ok) {
		console.error(res);
		return {
			success: false,
			message: "Não foi possível buscar os dados do produto.",
		};
	}

	const { data } = await res.json();
	return {
		success: true,
		message: "Dados recuperados com sucesso.",
		data: data,
	};
}

export async function removeProductAction(id: string): Promise<{ success: boolean; message?: string }> {
	const cookieStore = await cookies();
	const token = cookieStore.get("session")?.value;

	if (!token) {
		redirect("/login");
	}

	const { jwt } = await verifySession(token);

	try {
		const deleteUnitsRes = await fetch(`${api}/selling-units-product/product/${id}`, {
			method: "DELETE",
			headers: {
				Authorization: `Bearer ${jwt}`,
			},
		});

		if (!deleteUnitsRes.ok && deleteUnitsRes.status !== 404) {
			console.error("Erro ao remover unidades de venda:", deleteUnitsRes.statusText);
			const errorText = await deleteUnitsRes.text();
			return { success: false, message: `Erro ao remover unidades: ${deleteUnitsRes.statusText} - ${errorText}` };
		}

		const res = await fetch(`${apiUrl}/api/sellerProducts/${id}`, {
			method: "DELETE",
			headers: {
				Cookie: `session=${token}`,
			},
		});

		if (!res.ok) {
			console.error("Failed to delete product:", res.statusText);
			const errorText = await res.text();
			return { success: false, message: `Erro ao remover produto: ${res.statusText} - ${errorText}` };
		}

		revalidatePath("/market/myproducts");

		return { success: true };
	} catch (error) {
		console.error("Error in removeProductAction:", error);
		return { success: false, message: `Erro interno: ${error}` };
	}
}

// Produtos visíveis no market: exclui os do próprio usuário e os com colheita vencida
async function fetchMarketProducts(query = "") {
	const cookieStorage = await cookies();
	const token = cookieStorage.get("session")?.value;
	const { id } = await verifySession(token);

	const res = await fetch(`${apiUrl}/api/products${query}`, {
		method: "GET",
		headers: {
			Cookie: `session=${token}`,
		},
	});

	if (!res.ok) {
		return [];
	}
	const data = await res.json()
	return data.filter((p: any) => p.sellerId !== id && isHarvestAvailable(p.harvestAt));
}

export async function getAll() {
	return fetchMarketProducts();
}

export async function getByCategory(category: string) {
	const products = await fetchMarketProducts(
		`?category=${encodeURIComponent(category)}`
	);
	return products;
}

// O back já conta só vendas efetivadas e aplica os filtros de vitrine
// (sem produtos do próprio usuário e sem colheita vencida).
export async function getBestSellers(limit = 20) {
	const cookieStorage = await cookies();
	const token = cookieStorage.get("session")?.value;
	const { jwt } = await verifySession(token);

	const res = await fetch(`${api}/products/best-sellers?limit=${limit}`, {
		method: "GET",
		headers: {
			Authorization: `Bearer ${jwt}`,
		},
	});

	if (!res.ok) {
		return [];
	}
	return await res.json();
}

export async function getAllFromSeller(id?: string) {
	const cookieStore = await cookies();
	const token = cookieStore.get("session")?.value;

	const { id: userId, jwt } = await verifySession(token);
	const searchId = id === undefined ? userId : id;
	// O próprio vendedor vê também os produtos desativados; no perfil público, só os ativos
	const query = id === undefined ? "?status=all" : "";

	const res = await fetch(`${process.env.API_URL}/products/user/${searchId}${query}`, {
		method: "GET",
		headers: {
			Authorization: `Bearer ${jwt}`,
		},
	});

	if (!res.ok) return [];
	return await res.json();
}

export async function getProductDetails(productId: string, includeInactive = false) {
	const cookieStore = await cookies();
	const session = cookieStore.get("session")?.value;

	if (!session) {
		console.error("Sessão não encontrada");
		return null;
	}

	const query = includeInactive ? "?status=all" : "";
	const res = await fetch(`${apiUrl}/api/sellerProducts/${productId}${query}`, {
		method: "GET",
		headers: { Cookie: `session=${session}` },
	});

	if (!res.ok) {
		console.error("Erro ao buscar produto:", res.statusText);
		return null;
	}

	return await res.json();
}

export async function updateProduct(
	id: string | number,
	values: ProductToApi | FormData
) {
	const cookieStore = await cookies();
	const token = cookieStore.get("session")?.value;
	await verifySession(token);

	try {
		const isFormData = values instanceof FormData;

		const headers: HeadersInit = {
			Cookie: `session=${token}`,
		};

		if (!isFormData) {
			headers["Content-Type"] = "application/json";
		}

		const res = await fetch(`${apiUrl}/api/sellerProducts/${id}`, {
			method: "PUT",
			headers,
			body: isFormData ? values : JSON.stringify(values),
		});

		if (!res.ok) {
			console.error("Erro ao atualizar produto:", res);
			const body = await res.json().catch(() => null);
			// Mensagens de regra de negócio do back (400/403/404) já vêm em português
			const message =
				[400, 403, 404].includes(res.status) && body?.error
					? body.error
					: "Erro ao editar produto.";
			return { success: false, message };
		}

		return { success: true };
	} catch (err) {
		console.error("Erro no updateProduct:", err);
		return { success: false, message: "Erro interno ao atualizar o produto." };
	}
}

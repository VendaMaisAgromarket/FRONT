"use server";

import { verifySession } from "@/lib/session";
import { cookies } from "next/headers";

const RESOURCE_PATHS = {
  users: "/user",
  "payment-methods": "/payment-methods",
  "selling-units": "/selling-units",
  "transport-types": "/transport-types",
} as const;

export type SettingsResource = keyof typeof RESOURCE_PATHS;

export type SettingsListResult<T> =
  | { ok: true; data: T[]; currentUserId: string }
  | { ok: false; status: number };

export type SettingsMutationResult =
  | { ok: true }
  | { ok: false; status: number; error?: string };

// Checa o cookie antes de chamar verifySession — ele faz redirect() quando a
// sessão é inválida, o que não deve acontecer no meio de uma mutação.
async function getSession() {
  const session = (await cookies()).get("session")?.value;
  if (!session) return null;
  return verifySession(session);
}

async function readError(res: Response): Promise<string | undefined> {
  try {
    const body = await res.json();
    return typeof body?.error === "string" ? body.error : undefined;
  } catch {
    return undefined;
  }
}

function resourceUrl(resource: SettingsResource, suffix = "") {
  if (!(resource in RESOURCE_PATHS)) {
    throw new Error(`Recurso de configuração inválido: ${resource}`);
  }
  return `${process.env.API_URL}${RESOURCE_PATHS[resource]}${suffix}`;
}

export async function listSettings<T>(
  resource: SettingsResource
): Promise<SettingsListResult<T>> {
  const session = await getSession();
  if (!session) return { ok: false, status: 401 };

  const res = await fetch(resourceUrl(resource), {
    headers: { Authorization: `Bearer ${session.jwt}` },
    cache: "no-store",
  });

  if (!res.ok) {
    console.error(`Erro ao listar ${resource}: `, res.status);
    return { ok: false, status: res.status };
  }

  const data = await res.json();
  return { ok: true, data, currentUserId: session.id };
}

export async function createSetting(
  resource: SettingsResource,
  body: Record<string, unknown>
): Promise<SettingsMutationResult> {
  const session = await getSession();
  if (!session) return { ok: false, status: 401 };

  // Usuários: admin tem rota própria; comprador/produtor usam o cadastro público.
  let url = resourceUrl(resource);
  let payload = body;
  if (resource === "users") {
    const { role, ...rest } = body;
    url = role === "admin" ? resourceUrl(resource, "/admin") : resourceUrl(resource, "/register");
    payload = role === "admin" ? rest : body;
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.jwt}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    return { ok: false, status: res.status, error: await readError(res) };
  }
  return { ok: true };
}

export async function updateSetting(
  resource: SettingsResource,
  id: string,
  body: Record<string, unknown>
): Promise<SettingsMutationResult> {
  const session = await getSession();
  if (!session) return { ok: false, status: 401 };

  const res = await fetch(resourceUrl(resource, `/${encodeURIComponent(id)}`), {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${session.jwt}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    return { ok: false, status: res.status, error: await readError(res) };
  }
  return { ok: true };
}

export async function deleteSetting(
  resource: SettingsResource,
  id: string
): Promise<SettingsMutationResult> {
  const session = await getSession();
  if (!session) return { ok: false, status: 401 };

  const res = await fetch(resourceUrl(resource, `/${encodeURIComponent(id)}`), {
    method: "DELETE",
    headers: { Authorization: `Bearer ${session.jwt}` },
  });

  if (!res.ok) {
    return { ok: false, status: res.status, error: await readError(res) };
  }
  return { ok: true };
}

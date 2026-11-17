'use server'

import { cookies } from 'next/headers'
import { changePasswordSchema } from '@/lib/schemas'
import { deleteSession, verifySession } from '@/lib/session'

export interface FullUserData {
    id: number;
    name: string;
    address?: string;
    email: string;
    phone: string;
    cpf: string | null;
    cnpj: string | null;
    ccir: string | null;
    role: 'cooperative' | 'distributor-or-cooperative' | 'farmer' | string;
    tipo: 'Cooperativa' | 'Distribuidor/Associação' | 'Produtor Rural' | string;
    valid: boolean;
    img?: string;
}

export async function getUserData(): Promise<FullUserData> {
  const cookieStore = await cookies()
  const token = cookieStore.get('session')?.value

  const session = await verifySession(token)
  if (!session) {
    throw new Error('Sessão inválida')
  }

  const { jwt, id } = session

  const res = await fetch(`${process.env.API_URL}/user/${id}`, {
    headers: { Authorization: `Bearer ${jwt}` },
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error('Erro ao buscar dados do usuário.')
  }

  const data = await res.json()

  return {
    id: data.id,
    name: data.name,
    email: data.email,
    phone: data.phone_number ?? data.phone ?? '',
    cpf: data.cpf,
    address: data.address,
    cnpj: data.cnpj,
    ccir: data.ccir,
    role: data.role,
    // Map API role to pt-BR label (only these roles now)
    tipo:
      data.role === 'cooperative'
        ? 'Cooperativa' :
        data.role === 'distributor-or-cooperative'
        ? 'Distribuidor/Associação'
        : 'Produtor Rural',
    valid: data.valid,
    img: data.img,
  }
}

export type ChangePasswordResult =
  | { ok: true }
  | {
      ok: false
      reason: 'wrong-current' | 'invalid' | 'session-expired' | 'error'
      field?: 'currentPassword' | 'newPassword'
      message: string
    }

/**
 * Troca a senha pelo perfil (PUT /user/:id com `password`). O back não pede a senha atual,
 * então ela é conferida antes via /auth/login. Após o 200 o back invalida todos os JWTs do
 * usuário — inclusive este —, por isso a sessão local é apagada aqui.
 */
export async function changeOwnPassword(data: {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}): Promise<ChangePasswordResult> {
  const parsed = changePasswordSchema.safeParse(data)
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors
    return {
      ok: false,
      reason: 'invalid',
      field: errors.currentPassword ? 'currentPassword' : 'newPassword',
      message:
        errors.currentPassword?.[0] ?? errors.newPassword?.[0] ?? errors.confirmPassword?.[0] ?? 'Dados inválidos.',
    }
  }
  const { currentPassword, newPassword } = parsed.data

  const token = (await cookies()).get('session')?.value
  if (!token) {
    return { ok: false, reason: 'session-expired', message: 'Sua sessão expirou. Entre novamente.' }
  }
  const { jwt, id } = await verifySession(token)

  try {
    const userRes = await fetch(`${process.env.API_URL}/user/${id}`, {
      headers: { Authorization: `Bearer ${jwt}` },
      cache: 'no-store',
    })
    if (userRes.status === 401) {
      return { ok: false, reason: 'session-expired', message: 'Sua sessão expirou. Entre novamente.' }
    }
    if (!userRes.ok) {
      return { ok: false, reason: 'error', message: 'Erro ao buscar dados do usuário.' }
    }
    const user = await userRes.json()

    // CPF/CNPJ já vêm formatados do back, que é o formato que o login exige.
    const loginRes = await fetch(`${process.env.API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        user.cpf ? { cpf: user.cpf, password: currentPassword } : { cnpj: user.cnpj, password: currentPassword }
      ),
    })
    if (loginRes.status === 401) {
      return { ok: false, reason: 'wrong-current', field: 'currentPassword', message: 'Senha atual incorreta.' }
    }
    if (!loginRes.ok) {
      return { ok: false, reason: 'error', message: 'Erro ao conferir a senha atual. Tente novamente.' }
    }

    const res = await fetch(`${process.env.API_URL}/user/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
      body: JSON.stringify({ password: newPassword }),
    })
    if (res.status === 401) {
      return { ok: false, reason: 'session-expired', message: 'Sua sessão expirou. Entre novamente.' }
    }
    if (!res.ok) {
      return { ok: false, reason: 'error', message: 'Erro ao alterar a senha. Tente novamente.' }
    }

    await deleteSession()
    return { ok: true }
  } catch (err) {
    console.error('Erro ao alterar senha pelo perfil: ', (err as Error)?.message)
    return { ok: false, reason: 'error', message: 'Erro ao alterar a senha. Tente novamente.' }
  }
}

export async function getProducerById(id: string) {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  if (!session) {
    console.error("Cookie de sessão não encontrado");
    return null;
  }

  const res = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/producer/${id}`, {
    method: "GET",
    headers: { Cookie: `session=${session}` },
  });

  if (!res.ok) {
    console.error(
      `Erro ao ler vendedor ${id}: ${res.status} ${res.statusText}`
    );
    return null;
  }
  return await res.json();
}





/*import { cookies } from "next/headers";
>>>>>>> Stashed changes
import { redirect } from "next/navigation";

type Address = {
  id: number;
  city: string;
  district: string;
  street: string;
  number: string;
  state: string;
};

type UserData = {
  id: number;
  name: string;
  phone: string;
  email: string;
  address: Address | null;
};

type ProducerResponse = {
  id: number;
  itr?: string;
  ccir: string;
  userId: number;
  user: UserData;
};

type BuyerResponse = {
  id: number;
  cpf: string | null;
  cnpj: string | null;
  userId: number;
  user: UserData;
};

export type NormalizedUser = {
  name: string;
  email: string;
  phone: string;
  ccir: string;
  cnpj: string;
  cpf: string;
  role: "buyer" | "producer";
  addresses?: Address[];
};

export async function fetchUserDataNormalized(): Promise<NormalizedUser> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  let jwt: string;
  let userId: number;
  try {
    const sessionData = await verifySession(token);
    jwt = sessionData.jwt;
    userId = sessionData.userId;
  } catch {
    redirect("/login");
    return null as never;
  }

  // Tenta buscar como produtor
  try {
    const producerRes = await fetch(
      `${process.env.API_URL}/producer/${userId}`,
      {
        headers: { Authorization: `Bearer ${jwt}` },
        cache: "no-store",
      }
    );
    if (producerRes.ok) {
      const producerData = (await producerRes.json()) as ProducerResponse;
      return {
        name: producerData.user.name,
        email: producerData.user.email,
        phone: producerData.user.phone,
        ccir: producerData.ccir,
        cnpj: "",
        cpf: "",
        role: "producer",
        addresses: producerData.user.address ? [producerData.user.address] : [],
      };
    }

    // Se não for produtor (404), tenta como comprador
    if (producerRes.status === 404) {
      const buyerRes = await fetch(`${process.env.API_URL}/buyers/${userId}`, {
        headers: { Authorization: `Bearer ${jwt}` },
        cache: "no-store",
      });
      if (!buyerRes.ok) {
        throw new Error("Erro ao buscar dados do comprador");
      }
      const buyerData = (await buyerRes.json()) as BuyerResponse;
      return {
        name: buyerData.user.name,
        email: buyerData.user.email,
        phone: buyerData.user.phone,
        ccir: "",
        cnpj: buyerData.cnpj ?? "",
        cpf: buyerData.cpf ?? "",
        role: "buyer",
        addresses: buyerData.user.address ? [buyerData.user.address] : [],
      };
    }

    throw new Error("Erro ao buscar dados do produtor");
  } catch (err) {
    console.error("Erro fetching profile:", err);
    redirect("/login");
    return null as never;
  }
}

export async function getProducerById(id: number) {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  if (!session) {
    console.error("Cookie de sessão não encontrado");
    return null;
  }

  const res = await fetch(`${process.env.URL}/api/producer/${id}`, {
    method: "GET",
    headers: { Cookie: `session=${session}` },
  });

  if (!res.ok) {
    console.error(
      `Erro ao ler vendedor ${id}: ${res.status} ${res.statusText}`
    );
    return null;
  }
  return await res.json();
}
*/

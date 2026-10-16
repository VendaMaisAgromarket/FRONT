"server-only";
import { UserPayload } from "@/types/types";
import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const key = new TextEncoder().encode(process.env.SESSION_SECRET);
const cookie = {
	name: 'session',
	options: {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production' ? true : false,
		sameSite: 'lax' as const,
		path: '/',
	},
};

export async function encrypt(payload: UserPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(payload.exp * 1000)
    .sign(key);
}

export async function decrypt(session: string | undefined) {
  try {
    if (session) {
      const { payload } = await jwtVerify(session, key, {
        algorithms: ["HS256"],
      });
      return payload;
    }
    return null;
  } catch {
    return null;
  }
}

export async function createSession(payload: UserPayload) {
  const expires = new Date(payload.exp * 1000);
  const session = await encrypt(payload);

  (await cookies()).set(cookie.name, session, { ...cookie.options, expires });
}

export async function verifySession(sessionToken: string | undefined) {
  const session = await decrypt(sessionToken);

  if (!session?.id) {
    redirect("/login");
  }
  return {
    id: session.id as string,
    email: session.email,
    jwt: session.jwt as string,
    name: session.name,
  };
}

// Para rotas de API: devolve null em vez de redirecionar, para a rota responder 401.
// (Um redirect para /login seria seguido pelo fetch do navegador e entregaria HTML.)
export async function getApiSessionJwt(): Promise<string | null> {
  const session = await decrypt((await cookies()).get(cookie.name)?.value);
  if (!session?.id || typeof session.jwt !== "string") return null;
  return session.jwt;
}

export async function deleteSession() {
  (await cookies()).delete(cookie.name);
}

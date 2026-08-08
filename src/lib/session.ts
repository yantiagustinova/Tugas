import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import type { SessionUser } from "./types";

const COOKIE_NAME = "envilog_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 hari — supaya staf tidak login ulang terus

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "SESSION_SECRET belum di-set (minimal 16 karakter). Lihat .env.example.",
    );
  }
  return new TextEncoder().encode(secret);
}

export async function issueSession(user: SessionUser): Promise<void> {
  const token = await new SignJWT({ name: user.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(getSecret());

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const id = Number(payload.sub);
    if (!Number.isInteger(id) || typeof payload.name !== "string") return null;
    return { id, name: payload.name };
  } catch {
    return null;
  }
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

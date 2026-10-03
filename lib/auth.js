import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { findUserById } from "./models";
import { isValidId, toUserDTO } from "./serialize";

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not set");
  }
  return new TextEncoder().encode(secret);
}

export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export async function createSession(user) {
  const token = await new SignJWT({
    sub: user.id,
    licenceNumber: user.licenceNumber,
    name: user.name,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set("session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      id: payload.sub,
      licenceNumber: payload.licenceNumber,
      name: payload.name,
      role: payload.role,
    };
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session || !isValidId(session.id)) return null;

  const user = await findUserById(session.id);
  return toUserDTO(user);
}

export async function requireUser(redirectTo = "/login") {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`${redirectTo}?next=/dashboard`);
  }
  return user;
}

export function canSell(user) {
  return user?.role === "SELLER" || user?.role === "BOTH";
}

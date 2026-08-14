/** HMAC-signed member-ID session. Roles are always loaded from the database. */
import "server-only";
import { cookies } from "next/headers";
import crypto from "node:crypto";
import { type RoleId, type SessionUser } from "./domain";
import { prisma } from "./prisma";

const COOKIE_NAME = "sco_session";
const MAX_AGE = 60 * 60 * 24 * 90; // 90 days

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s) {
    throw new Error(
      "AUTH_SECRET is not set. Copy .env.example to .env (local dev) or set it in Vercel's project environment variables.",
    );
  }
  return s;
}

function sign(memberId: string): string {
  const payload = Buffer.from(memberId, "utf8").toString("base64url");
  const sig = crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

function verify(token: string): string | null {
  const dot = token.indexOf(".");
  if (dot < 0) return null;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    return Buffer.from(payload, "base64url").toString("utf8");
  } catch {
    return null;
  }
}

/** Read the current signed-in user in a Server Component or Server Action. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const identifier = verify(token);
  if (!identifier || !prisma) return null;
  const member = await prisma.member.findFirst({
    where: { OR: [{ id: identifier }, { name: identifier }] },
    select: { id: true, name: true, role: true },
  });
  if (!member) return null;
  return { id: member.id, name: member.name, role: member.role as RoleId };
}

/** Set the session cookie. Only callable from a Server Action / Route Handler. */
export async function setSessionCookie(memberId: string) {
  if (!prisma) throw new Error("Database unavailable.");
  const member = await prisma.member.findUnique({ where: { id: memberId }, select: { id: true } });
  if (!member) throw new Error("Unknown user.");
  const store = await cookies();
  store.set(COOKIE_NAME, sign(member.id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

/** Clear the session cookie. Only callable from a Server Action / Route Handler. */
export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

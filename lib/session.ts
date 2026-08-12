/**
 * Sign-in session. Keeps the original app's UX exactly ("pick your name from
 * a fixed roster, your role comes with it, no password") but backs it with a
 * real signed cookie instead of client-only state:
 *
 *  - The cookie only ever stores a NAME, never a role. The role is always
 *    re-derived server-side from ROSTER on every read (roleOf), so there is
 *    no cookie field an attacker could edit to grant themselves Head/PM.
 *  - The cookie is HMAC-signed with AUTH_SECRET. Editing the name client-side
 *    invalidates the signature and the session is treated as signed out.
 *  - A name that no longer exists in the roster (person left the team, or a
 *    forged cookie) is also treated as signed out.
 *
 * This is still the same trust model the original file described: anyone who
 * can reach the app can pick anyone's name and act as them. What's new is
 * that nobody can do that by hand-editing a cookie or calling a Server Action
 * directly with a crafted body — they'd need AUTH_SECRET, which never reaches
 * the client.
 */
import "server-only";
import { cookies } from "next/headers";
import crypto from "node:crypto";
import { isValidRosterName, roleOf, type SessionUser } from "./domain";
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

function sign(name: string): string {
  const payload = Buffer.from(name, "utf8").toString("base64url");
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
  const name = verify(token);
  if (!name) return null;
  if (isValidRosterName(name)) return { name, role: roleOf(name) };
  // check DB members (dynamically added designers)
  const member = await prisma?.member.findUnique({ where: { name }, select: { name: true } });
  if (!member) return null;
  return { name, role: "designer" };
}

/** Set the session cookie. Only callable from a Server Action / Route Handler. */
export async function setSessionCookie(name: string) {
  const inRoster = isValidRosterName(name);
  if (!inRoster) {
    const member = await prisma?.member.findUnique({ where: { name }, select: { name: true } });
    if (!member) throw new Error("Unknown name — not on the roster.");
  }
  const store = await cookies();
  store.set(COOKIE_NAME, sign(name), {
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

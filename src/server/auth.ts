import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "research_admin";

function secret(): string {
  const s = process.env.ADMIN_PASSWORD;
  if (!s) throw new Error("Missing ADMIN_PASSWORD.");
  return s;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

export function createSessionToken(): string {
  const payload = `admin:${Date.now()}`;
  return `${payload}.${sign(payload)}`;
}

export function verifyToken(token: string | undefined): boolean {
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;
  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return verifyToken(store.get(COOKIE_NAME)?.value);
}

export async function requireAdmin(): Promise<boolean> {
  return isAdmin();
}

export function getCookieName(): string {
  return COOKIE_NAME;
}

export { COOKIE_NAME };

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { encodePayload, SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, type Session } from "@/lib/session-core";
export type { Session } from "@/lib/session-core";
function secret() { const value = process.env.SESSION_SECRET; if (!value || value.length < 24) throw new Error("SESSION_SECRET must be configured with at least 24 characters"); return value; }
function sign(payload: string) { return createHmac("sha256", secret()).update(payload).digest("base64url"); }
export function createSession(session: Omit<Session, "exp">) { const payload = encodePayload(session); return `${payload}.${sign(payload)}`; }
export function verifySession(token?: string): Session | null { try { if (!token) return null; const [payload, signature, extra] = token.split("."); if (!payload || !signature || extra) return null; const expected = Buffer.from(sign(payload)); const actual = Buffer.from(signature); if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null; const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")); return decoded && typeof decoded.exp === "number" && decoded.exp > Math.floor(Date.now() / 1000) && typeof decoded.id === "string" && typeof decoded.email === "string" && ["MEMBER", "TRAINER", "ADMIN"].includes(decoded.role) ? decoded : null; } catch { return null; } }
export async function currentSession() { return verifySession((await cookies()).get(SESSION_COOKIE)?.value); }
export function sessionCookie(value: string) { return `${SESSION_COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_MAX_AGE_SECONDS}${process.env.NODE_ENV === "production" ? "; Secure" : ""}`; }

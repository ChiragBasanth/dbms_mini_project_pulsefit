export type SessionRole = "MEMBER" | "TRAINER" | "ADMIN";
export type Session = { id: string; role: SessionRole; email: string; exp: number };
export const SESSION_COOKIE = "pulsefit_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24;
export function isSession(value: unknown): value is Session {
  if (!value || typeof value !== "object") return false;
  const session = value as Record<string, unknown>;
  return typeof session.id === "string" && typeof session.email === "string" && typeof session.exp === "number" && session.exp > Math.floor(Date.now() / 1000) && ["MEMBER", "TRAINER", "ADMIN"].includes(String(session.role));
}
export function decodePayload(value: string): Session | null {
  try {
    const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - value.length % 4) % 4);
    const parsed: unknown = JSON.parse(atob(padded));
    return isSession(parsed) ? parsed : null;
  } catch { return null; }
}
export function encodePayload(session: Omit<Session, "exp">, exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS) {
  return btoa(JSON.stringify({ ...session, exp })).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

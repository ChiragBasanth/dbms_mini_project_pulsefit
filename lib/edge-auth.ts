import { decodePayload, SESSION_COOKIE, type Session } from "./session-core.ts";
function bytes(value: string) { return new TextEncoder().encode(value); }
function fromBase64Url(value: string) { const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - value.length % 4) % 4); return Uint8Array.from(atob(padded), c => c.charCodeAt(0)); }
async function key() { const secret = process.env.SESSION_SECRET; if (!secret || secret.length < 24) throw new Error("SESSION_SECRET must be configured with at least 24 characters"); return crypto.subtle.importKey("raw", bytes(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]); }
export async function verifyEdgeSession(token?: string): Promise<Session | null> { try { if (!token) return null; const [payload, signature, extra] = token.split("."); if (!payload || !signature || extra) return null; const signatureBytes = fromBase64Url(signature); const verified = await crypto.subtle.verify("HMAC", await key(), signatureBytes, bytes(payload)); if (!verified) return null; return decodePayload(payload); } catch { return null; } }
export { SESSION_COOKIE };

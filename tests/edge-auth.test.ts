import test from "node:test";
import assert from "node:assert/strict";
import { canAccessPath } from "../lib/access-policy.ts";
import { verifyEdgeSession } from "../lib/edge-auth.ts";

process.env.SESSION_SECRET = "pulsefit-test-secret-that-is-long-enough";

function payload() {
  return btoa(JSON.stringify({ id: "member-1", email: "member@pulsefit.local", role: "MEMBER", exp: Math.floor(Date.now() / 1000) + 120 })).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
async function signedToken(value: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(process.env.SESSION_SECRET!), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value)));
  return `${value}.${btoa(String.fromCharCode(...signature)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")}`;
}
test("edge verification accepts a valid HMAC session and rejects tampering", async () => {
  const token = await signedToken(payload());
  assert.equal((await verifyEdgeSession(token))?.id, "member-1");
  assert.equal(await verifyEdgeSession(`${token}x`), null);
  assert.equal(await verifyEdgeSession(undefined), null);
});
test("route policy denies trainer pages to a member", () => {
  assert.equal(canAccessPath("/trainer", "MEMBER"), false);
  assert.equal(canAccessPath("/trainer/bookings", "TRAINER"), true);
  assert.equal(canAccessPath("/analytics", "MEMBER"), true);
});

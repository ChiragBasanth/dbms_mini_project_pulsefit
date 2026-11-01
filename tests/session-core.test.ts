import test from "node:test";
import assert from "node:assert/strict";
import { decodePayload, encodePayload, isSession, SESSION_MAX_AGE_SECONDS } from "../lib/session-core.ts";

test("encodes and decodes a valid, expiring session payload", () => {
  const start = Math.floor(Date.now() / 1000);
  const payload = encodePayload({ id: "member-1", email: "member@pulsefit.local", role: "MEMBER" }, start + 120);
  assert.deepEqual(decodePayload(payload), { id: "member-1", email: "member@pulsefit.local", role: "MEMBER", exp: start + 120 });
  assert.equal(SESSION_MAX_AGE_SECONDS, 86400);
});

test("rejects an expired session payload", () => {
  const expired = btoa(JSON.stringify({ id: "member-1", email: "member@pulsefit.local", role: "MEMBER", exp: 1 })).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  assert.equal(decodePayload(expired), null);
});

test("rejects malformed and invalid role payloads", () => {
  assert.equal(decodePayload("not-a-payload"), null);
  assert.equal(isSession({ id: "member-1", email: "member@pulsefit.local", role: "OWNER", exp: Math.floor(Date.now() / 1000) + 120 }), false);
});

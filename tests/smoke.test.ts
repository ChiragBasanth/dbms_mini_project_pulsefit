import { test } from "node:test";
import assert from "node:assert/strict";
test("S01 production page and unauthenticated API smoke checks", async () => {
  const origin = process.env.SMOKE_ORIGIN || "http://localhost:3000";
  for (const path of [
    "/",
    "/login",
    "/register",
    "/dashboard",
    "/trainers",
    "/bookings",
    "/workouts",
    "/analytics",
    "/recommendations",
    "/availability",
    "/appointments",
  ]) {
    const r = await fetch(origin + path);
    assert.equal(r.status, 200, path);
    const html = await r.text();
    assert.ok(html.includes("PulseFit"), path);
    console.log("PAGE", path, r.status);
  }
  for (const [path, status] of [
    ["/does-not-exist", 404],
    ["/api/bookings", 401],
    ["/api/me", 200],
  ] as const) {
    const r = await fetch(origin + path);
    assert.equal(r.status, status);
    console.log("HTTP", path, r.status);
  }
});

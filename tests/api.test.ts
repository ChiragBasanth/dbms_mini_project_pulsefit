import "dotenv/config";
import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
const base = process.env.TEST_APP_ORIGIN;
test(
  "A01 member/trainer auth, ownership, booking, workout and recommendation API flow",
  {
    skip: !base
      ? "BLOCKED: TEST_APP_ORIGIN must point to app configured with disposable test databases"
      : false,
  },
  async () => {
    if (process.env.ALLOW_API_TEST_FIXTURES !== "yes")
      throw new Error(
        "Set ALLOW_API_TEST_FIXTURES=yes; API tests create fixtures, preserved for inspection.",
      );
    type Client = { cookie: string };
    const member: Client = { cookie: "" },
      trainer: Client = { cookie: "" },
      other: Client = { cookie: "" };
    const suffix = randomUUID();
    async function call(
      c: Client,
      path: string,
      method = "GET",
      body?: unknown,
    ) {
      const r = await fetch(base + "/api/" + path, {
        method,
        headers: {
          Origin: base!,
          "Content-Type": "application/json",
          Cookie: c.cookie,
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      const set = r.headers.get("set-cookie");
      if (set) c.cookie = set.split(";")[0];
      return { status: r.status, data: await r.json() };
    }
    const password = "test-fixture-password-123";
    for (const [c, role, label] of [
      [member, "MEMBER", "member"],
      [trainer, "TRAINER", "trainer"],
      [other, "MEMBER", "other"],
    ] as const) {
      const email = label + suffix + "@example.test";
      assert.equal(
        (
          await call(c, "auth/register", "POST", {
            name: "API " + label,
            email,
            password,
            role,
          })
        ).status,
        201,
      );
      c.cookie = "";
      assert.equal(
        (await call(c, "auth/login", "POST", { email, password })).status,
        200,
      );
    }
    assert.equal((await call(member, "availability", "POST", {})).status, 403);
    assert.equal((await call(trainer, "workouts")).status, 403);
    assert.equal((await call({ cookie: "" }, "bookings")).status, 401);
    const start = Date.now() + 2 * 86400000;
    const slot = await call(trainer, "availability", "POST", {
      startsAt: new Date(start).toISOString(),
      endsAt: new Date(start + 3600000).toISOString(),
    });
    assert.equal(slot.status, 201);
    const outcomes = await Promise.all([
      call(member, "bookings", "POST", { slotId: slot.data.id }),
      call(other, "bookings", "POST", { slotId: slot.data.id }),
    ]);
    assert.deepEqual(outcomes.map((x) => x.status).sort(), [201, 409]);
    const winner = outcomes[0].status === 201 ? member : other;
    const loser = winner === member ? other : member;
    const booking = outcomes.find((x) => x.status === 201)!.data.id;
    assert.equal(
      (await call(loser, "bookings/" + booking, "DELETE")).status,
      404,
    );
    assert.equal(
      (await call(winner, "bookings/" + booking, "DELETE")).status,
      200,
    );
    assert.equal(
      (await call(loser, "bookings", "POST", { slotId: slot.data.id })).status,
      201,
    );
    assert.equal(
      (
        await call(trainer, "availability", "POST", {
          startsAt: "2020-01-01T10:00:00Z",
          endsAt: "2020-01-01T11:00:00Z",
        })
      ).status,
      400,
    );
    const log = {
      performedAt: new Date().toISOString(),
      workoutType: "CARDIO",
      exercises: [
        { name: "Cycling", sets: [{ duration: 600, distance: 1000 }] },
      ],
    };
    const w = await call(member, "workouts", "POST", log);
    assert.equal(w.status, 201);
    assert.equal((await call(other, "workouts/" + w.data.id)).data.length, 0);
    assert.equal(
      (await call(other, "workouts/" + w.data.id, "DELETE")).status,
      404,
    );
    assert.equal(
      (
        await call(member, "workouts/" + w.data.id, "PUT", {
          ...log,
          notes: "edited",
        })
      ).status,
      200,
    );
    assert.equal((await call(member, "analytics")).status, 200);
    assert.equal(
      (await call(member, "workouts/" + w.data.id, "DELETE")).status,
      200,
    );
    assert.equal(
      (await call(member, "trainers?q=" + encodeURIComponent("' OR 1=1 --")))
        .data.length,
      0,
    );
    const invalidOrigin = await fetch(base + "/api/auth/login", {
      method: "POST",
      headers: {
        Origin: "https://invalid.example",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });
    assert.equal(invalidOrigin.status, 403);
    assert.equal(
      (
        await call(member, "recommendations", "POST", {
          goals: "Improve stamina and cardiovascular endurance",
        })
      ).status,
      200,
    );
    console.log(
      "API fixtures suffix:",
      suffix,
      "Use disposable DB reset after inspection.",
    );
  },
);

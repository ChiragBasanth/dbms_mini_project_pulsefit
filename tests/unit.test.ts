import { test } from "node:test";
import assert from "node:assert/strict";
import { hash, compare } from "bcryptjs";
import {
  registration,
  slotInput,
  workoutInput,
  goalsInput,
} from "../src/lib/validation";
import { progressPipeline } from "../src/lib/workouts";
test("U01 registration validates roles and normalizes email", () => {
  const u = registration.parse({
    name: "Test Member",
    email: "Person@Example.com",
    password: "long-password-123",
    role: "MEMBER",
  });
  assert.equal(u.email, "person@example.com");
  assert.equal(registration.safeParse({ ...u, role: "ADMIN" }).success, false);
});
test("U02 rejects short passwords and malformed email", () => {
  assert.equal(
    registration.safeParse({
      name: "Name",
      email: "invalid",
      password: "short",
      role: "TRAINER",
    }).success,
    false,
  );
});
test("U03 password hashes verify and never equal plaintext", async () => {
  const p = "example-test-password";
  const h = await hash(p, 12);
  assert.notEqual(h, p);
  assert.equal(await compare(p, h), true);
  assert.equal(await compare("incorrect-password", h), false);
});
test("U04 slot boundaries reject past, inverted, long and distant intervals", () => {
  const a = Date.now() + 86400000;
  const make = (s: number, e: number) => ({
    startsAt: new Date(s).toISOString(),
    endsAt: new Date(e).toISOString(),
  });
  assert.equal(slotInput.safeParse(make(a, a + 3600000)).success, true);
  for (const [s, e] of [
    [a, a - 1],
    [a, a + 5 * 3600000],
    [a - 2 * 86400000, a - 86400000],
    [a + 91 * 86400000, a + 91 * 86400000 + 3600000],
  ])
    assert.equal(slotInput.safeParse(make(s, e)).success, false);
});
test("U05 strength and cardio logs accept different shapes", () => {
  for (const sets of [
    [{ reps: 10, weight: 20 }],
    [{ duration: 600, distance: 1200 }],
  ])
    assert.equal(
      workoutInput.safeParse({
        performedAt: new Date().toISOString(),
        workoutType: "MIXED",
        exercises: [{ name: "Movement", sets }],
      }).success,
      true,
    );
});
test("U06 rejects negative weight, zero reps and empty sets", () => {
  for (const sets of [[{ reps: 0 }], [{ reps: 5, weight: -1 }], [{}]])
    assert.equal(
      workoutInput.safeParse({
        performedAt: new Date().toISOString(),
        workoutType: "STRENGTH",
        exercises: [{ name: "Movement", sets }],
      }).success,
      false,
    );
});
test("U07 analytics starts with user-scoped match and handles optional measures", () => {
  const pipeline = progressPipeline("member-a");
  assert.deepEqual(pipeline[0], { $match: { userId: "member-a" } });
  const text = JSON.stringify(pipeline);
  for (const stage of ["$unwind", "$group", "$sort", "$project", "$ifNull"])
    assert.ok(text.includes(stage));
});
test("U08 goals length and category validation", () => {
  assert.equal(
    goalsInput.safeParse({
      goals: "Improve everyday stamina",
      category: "CARDIO",
    }).success,
    true,
  );
  assert.equal(
    goalsInput.safeParse({ goals: "x", category: "unknown" }).success,
    false,
  );
});

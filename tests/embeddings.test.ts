import test from "node:test";
import assert from "node:assert/strict";
import { embedText, toPgVector } from "../lib/embeddings.ts";

test("embedding is deterministic and normalized to 128 dimensions", () => {
  const first = embedText("Improve cardiovascular endurance and lose weight");
  const second = embedText("Improve cardiovascular endurance and lose weight");
  assert.deepEqual(first, second);
  assert.equal(first.length, 128);
  const norm = Math.sqrt(first.reduce((sum, value) => sum + value * value, 0));
  assert.ok(Math.abs(norm - 1) < 0.000001);
});

test("pgvector serialization rejects wrong dimensions", () => {
  assert.throws(() => toPgVector([0.1]), /128-dimensional/);
  assert.match(toPgVector(Array(128).fill(0)), /^\[0,0,/);
});

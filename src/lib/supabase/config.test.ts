import assert from "node:assert/strict";
import test from "node:test";
import { shouldUseLocalDemoMode } from "./config.ts";

test("local demo mode requires an explicit flag outside production", () => {
  assert.equal(shouldUseLocalDemoMode("development", "true"), true);
  assert.equal(shouldUseLocalDemoMode("development", "false"), false);
  assert.equal(shouldUseLocalDemoMode("production", "true"), false);
  assert.equal(shouldUseLocalDemoMode("production", undefined), false);
});

test("public demo mode can be explicitly enabled in production", () => {
  assert.equal(shouldUseLocalDemoMode("production", undefined, "true"), true);
  assert.equal(shouldUseLocalDemoMode("production", "false", "true"), true);
  assert.equal(shouldUseLocalDemoMode("production", undefined, "false"), false);
});

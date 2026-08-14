import assert from "node:assert/strict";
import test from "node:test";
import { canManageExecutiveTargets, canManageOperations, canViewExecutive } from "./permissions.ts";
import { processImprovements } from "../operations/improvements.ts";

test("Operations management is limited to management roles", () => {
  assert.equal(canManageOperations("platform_owner"), true);
  assert.equal(canManageOperations("tenant_admin"), true);
  assert.equal(canManageOperations("manager"), true);
  assert.equal(canManageOperations("salesperson"), false);
});

test("Executive access separates managers from target administrators", () => {
  assert.equal(canViewExecutive("manager"), true);
  assert.equal(canViewExecutive("salesperson"), false);
  assert.equal(canManageExecutiveTargets("manager"), false);
  assert.equal(canManageExecutiveTargets("tenant_admin"), true);
  assert.equal(canManageExecutiveTargets("platform_owner"), true);
});

test("Process Improvement keeps future DMAIC fields hidden by default", () => {
  assert.ok(processImprovements.length > 0);
  assert.ok(processImprovements.every((item) => item.projectMethod === "Rapid improvement"));
  assert.ok(processImprovements.every((item) => item.dmaicPhase === null));
});

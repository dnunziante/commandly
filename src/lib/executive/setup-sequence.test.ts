import assert from "node:assert/strict";
import test from "node:test";
import { buildExecutiveSetupSequence } from "./setup-sequence.ts";

const check = (id: string, ready: boolean, required = true) => ({ id, ready, required, title: id, explanation: "", action: "", href: "/" });

test("identifies only the first incomplete required setup step as current", () => {
  const steps = buildExecutiveSetupSequence([check("locations", true), check("sales", false), check("targets", false), check("review", false, false)]);
  assert.deepEqual(steps.map((step) => step.state), ["complete", "current", "upcoming"]);
});

test("marks every required step complete when setup is ready", () => {
  assert.deepEqual(buildExecutiveSetupSequence([check("one", true), check("two", true)]).map((step) => step.state), ["complete", "complete"]);
});

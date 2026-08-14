import assert from "node:assert/strict";
import test from "node:test";
import { buildExecutiveNotificationQueue, defaultExecutiveEscalationSettings } from "./escalations.ts";
import type { ExecutivePriorityReview } from "./data.ts";

const review = (overrides: Partial<ExecutivePriorityReview>): ExecutivePriorityReview => ({ id: "1", priorityKey: "sales-pace", reportingPeriod: "2026-08-01", status: "in_progress", ownerName: "Dana", dueDate: "2026-08-11", reviewNote: "", updatedAt: "2026-08-01T12:00:00Z", ...overrides });

test("builds deterministic reminders, assignment notices, and escalations", () => {
  const queue = buildExecutiveNotificationQueue([
    review({ id: "1", dueDate: "2026-08-08" }),
    review({ id: "2", ownerName: "", dueDate: "2026-08-20" }),
    review({ id: "3", dueDate: "2026-08-13" }),
    review({ id: "4", status: "completed", dueDate: "2026-08-01" }),
  ], defaultExecutiveEscalationSettings, new Date("2026-08-11T12:00:00Z"));
  assert.deepEqual(queue.map((item) => item.level), ["escalation", "assignment", "reminder"]);
});

test("disabled escalation settings produce no notifications", () => {
  assert.deepEqual(buildExecutiveNotificationQueue([review({})], { ...defaultExecutiveEscalationSettings, enabled: false }), []);
});

import assert from "node:assert/strict";
import test from "node:test";
import { summarizeExecutiveAccountability } from "./accountability.ts";
import type { ExecutivePriorityReview } from "./data.ts";

const review = (overrides: Partial<ExecutivePriorityReview>): ExecutivePriorityReview => ({ id: "1", priorityKey: "sales-pace", reportingPeriod: "2026-08-01", status: "open", ownerName: "", dueDate: "", reviewNote: "", updatedAt: "2026-08-01T12:00:00Z", ...overrides });

test("summarizes Executive accountability without counting dismissed work as overdue", () => {
  const summary = summarizeExecutiveAccountability([
    review({ id: "1", status: "in_progress", ownerName: "Dana", dueDate: "2026-08-01" }),
    review({ id: "2", status: "completed", ownerName: "Sam", dueDate: "2026-08-02" }),
    review({ id: "3", status: "open" }),
    review({ id: "4", status: "dismissed", dueDate: "2026-08-01" }),
  ], new Date("2026-08-11T12:00:00Z"));
  assert.deepEqual(summary, { total: 4, active: 1, completed: 1, overdue: 1, unassigned: 1, completionRate: 25 });
});

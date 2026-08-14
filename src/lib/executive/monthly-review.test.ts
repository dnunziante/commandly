import assert from "node:assert/strict";
import test from "node:test";
import { buildLeadershipAgenda } from "./monthly-review.ts";

test("leadership agenda orders exceptions before routine priority review", () => {
  const agenda = buildLeadershipAgenda({ priorityCount: 3, escalationCount: 1, overdueCount: 2, unassignedCount: 0, dueDecisionCount: 1, openDecisionCount: 2 });
  assert.deepEqual(agenda.map((item) => item.title), ["Resolve escalated commitments", "Review overdue ownership", "Validate decision outcomes", "Confirm leadership priorities"]);
});

test("leadership agenda does not invent work when there are no records", () => {
  assert.deepEqual(buildLeadershipAgenda({ priorityCount: 0, escalationCount: 0, overdueCount: 0, unassignedCount: 0, dueDecisionCount: 0, openDecisionCount: 0 }), []);
});

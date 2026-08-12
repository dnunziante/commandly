import assert from "node:assert/strict";
import test from "node:test";
import { rankExecutivePriorities } from "./data.ts";

test("Executive priorities remain deterministic and ranked", () => {
  const first = rankExecutivePriorities();
  const second = rankExecutivePriorities();
  assert.deepEqual(first, second);
  assert.deepEqual(first.map((item) => item.rank), [1, 2, 3, 4]);
  assert.equal(first[0]?.urgency, "Act now");
});

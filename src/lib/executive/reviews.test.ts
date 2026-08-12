import assert from "node:assert/strict";
import test from "node:test";
import { executiveReviewRequiresOwner } from "./reviews.ts";

test("active and completed Executive reviews require an owner", () => {
  assert.equal(executiveReviewRequiresOwner("in_progress"), true);
  assert.equal(executiveReviewRequiresOwner("completed"), true);
  assert.equal(executiveReviewRequiresOwner("acknowledged"), false);
  assert.equal(executiveReviewRequiresOwner("dismissed"), false);
});

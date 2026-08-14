import assert from "node:assert/strict";
import test from "node:test";
import { classifySalesDataQuality } from "./quality.ts";

test("sales data quality preserves explicit monthly states", () => {
  assert.equal(classifySalesDataQuality("2026-08-01", "approved", "2026-08-01"), "approved");
  assert.equal(classifySalesDataQuality("2026-08-01", "draft", "2026-08-01"), "draft");
});

test("sales data quality distinguishes missing from outdated", () => {
  assert.equal(classifySalesDataQuality("2026-08-01", null, "2026-07-01"), "outdated");
  assert.equal(classifySalesDataQuality("2026-08-01", null, null), "missing");
  assert.equal(classifySalesDataQuality("2026-08-01", null, "2026-09-01"), "missing");
});

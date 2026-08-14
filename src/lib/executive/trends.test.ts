import assert from "node:assert/strict";
import test from "node:test";
import { buildExecutiveTrends, calculateTrendChange, compareExecutiveTrendPeriods } from "./trends.ts";

test("aggregates only supplied approved rows by reporting month", () => {
  const periods = buildExecutiveTrends([
    { periodStart: "2026-07-01", locationId: "a", revenueTarget: 100, revenueActual: 90, unitsTarget: 10, unitsActual: 9, leads: 20, appointments: 8 },
    { periodStart: "2026-07-01", locationId: "b", revenueTarget: 100, revenueActual: 110, unitsTarget: 10, unitsActual: 11, leads: 22, appointments: 9 },
    { periodStart: "2026-08-01", locationId: "a", revenueTarget: 200, revenueActual: 180, unitsTarget: 20, unitsActual: 18, leads: 30, appointments: 12 },
  ], ["2026-07"]);
  assert.equal(periods[0].salesPace, 100);
  assert.equal(periods[0].approvedLocations, 2);
  assert.equal(periods[0].reviewCompleted, true);
  assert.equal(calculateTrendChange(periods), -10);
});

test("returns no change when fewer than two months have measurable targets", () => {
  assert.equal(calculateTrendChange(buildExecutiveTrends([], [])), null);
});

test("compares manager-selected periods and falls back to the latest two", () => {
  const periods = buildExecutiveTrends([
    { periodStart: "2026-06-01", locationId: "a", revenueTarget: 100, revenueActual: 80, unitsTarget: 10, unitsActual: 8, leads: 20, appointments: 8 },
    { periodStart: "2026-07-01", locationId: "a", revenueTarget: 100, revenueActual: 90, unitsTarget: 10, unitsActual: 9, leads: 24, appointments: 10 },
    { periodStart: "2026-08-01", locationId: "a", revenueTarget: 100, revenueActual: 110, unitsTarget: 10, unitsActual: 11, leads: 30, appointments: 12 },
  ], []);
  assert.equal(compareExecutiveTrendPeriods(periods, "2026-06", "2026-08")?.paceChange, 30);
  assert.equal(compareExecutiveTrendPeriods(periods, "invalid", "invalid")?.revenueChange, 20);
});

import assert from "node:assert/strict";
import test from "node:test";
import { calculatePricing } from "./pricing-calculator.ts";

test("calculates a zero-interest financed estimate", () => {
  const result = calculatePricing({ totalFinanced: 15000, downPayment: 2000, acquisitionCostRate: 5, apr: 0, termMonths: 48 });
  assert.equal(result.acquisitionCost, 750);
  assert.equal(result.amountFinanced, 13750);
  assert.equal(result.monthlyPayment, 13750 / 48);
});

test("calculates amortized payment and never finances below zero", () => {
  const financed = calculatePricing({ totalFinanced: 10000, downPayment: 0, acquisitionCostRate: 0, apr: 6, termMonths: 60 });
  assert.ok(financed.monthlyPayment > 190 && financed.monthlyPayment < 195);
  const paid = calculatePricing({ totalFinanced: 1000, downPayment: 2000, acquisitionCostRate: 0, apr: 6, termMonths: 60 });
  assert.equal(paid.amountFinanced, 0);
  assert.equal(paid.monthlyPayment, 0);
});

import assert from "node:assert/strict";
import test from "node:test";
import { calculateQuote } from "./quote-calculator.ts";

test("calculates subtotal and total delivered", () => {
  const result = calculateQuote({ vehiclePrice: 559800, accessories: 0, docFees: 339, tradeIn: 180000, discount: 60000, salesTax: 0, extendedWarranties: 0, tagTitleDmvFee: 0, destination: 9000, delivery: 225 });
  assert.equal(result.subtotal, 320139);
  assert.equal(result.totalDelivered, 329364);
});

test("never returns a negative subtotal", () => {
  const result = calculateQuote({ vehiclePrice: 1000, accessories: 0, docFees: 0, tradeIn: 2000, discount: 0, salesTax: 50, extendedWarranties: 0, tagTitleDmvFee: 0, destination: 0, delivery: 0 });
  assert.equal(result.subtotal, 0);
  assert.equal(result.totalDelivered, 50);
});

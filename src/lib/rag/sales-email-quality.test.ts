import assert from "node:assert/strict";
import test from "node:test";
import { validateSalesEmailDraft, validateSalesTextDraft } from "./sales-email-quality.ts";

const body = `Hi Taylor, Thanks for sharing how you plan to use the cart around your neighborhood and for weekend trips. The Beyond configuration we discussed aligns with the passenger space you need, and I can have the exact availability confirmed before your visit. Seeing the seating and storage in person should make the comparison easier. Would Tuesday afternoon or Wednesday morning work better for a quick walkthrough? Best, Derrick`;

test("accepts a concise email with one specific next step", () => assert.equal(validateSalesEmailDraft({ subject: "A closer look at the Beyond", body, primaryCallToAction: "Would Tuesday afternoon or Wednesday morning work better for a quick walkthrough?" }), true));
test("rejects generic AI openings", () => assert.equal(validateSalesEmailDraft({ subject: "Following up", body: body.replace("Hi Taylor,", "Hi Taylor, I hope this email finds you well."), primaryCallToAction: "Would Tuesday work?" }), false));
test("accepts a concise personalized sales text", () => assert.equal(validateSalesTextDraft({ message: "Taylor, the Beyond 4 Passenger fits the seating needs we discussed. I can have the exact availability confirmed before you visit. Would Tuesday afternoon or Wednesday morning work better for a walkthrough?", primaryCallToAction: "Would Tuesday afternoon or Wednesday morning work better for a walkthrough?" }), true));
test("rejects an overly generic sales text", () => assert.equal(validateSalesTextDraft({ message: "Hi Taylor, just checking in to see if you are still interested in a golf cart. Let me know.", primaryCallToAction: "Let me know." }), false));

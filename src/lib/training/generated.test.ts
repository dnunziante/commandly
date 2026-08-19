import assert from "node:assert/strict";
import test from "node:test";
import { parseGeneratedTrainingContent, validateGeneratedTrainingContent, validateQuestionEvidence } from "./generated.ts";

const source = "The Pulse includes a rear camera. Use the camera to support awareness while reversing.";
const valid = parseGeneratedTrainingContent({
  learningObjectives: ["Identify the feature", "Explain its purpose", "Apply the guidance"],
  sections: [{ title: "Rear camera", content: "The Pulse includes a rear camera." }],
  keyTakeaways: ["A camera is included", "It supports awareness", "Use it while reversing"],
  practicalApplication: "Explain the supported purpose without adding specifications.",
  scenario: null,
  knowledgeCheck: [{ id: "q1", type: "multiple_choice", question: "What is included?", options: ["Rear camera", "Warranty"], correctAnswer: "Rear camera", explanation: "The source identifies the feature.", sourceEvidence: "The Pulse includes a rear camera." }, { id: "q2", type: "true_false", question: "The camera supports awareness.", options: ["True", "False"], correctAnswer: "True", explanation: "That purpose is stated.", sourceEvidence: "support awareness while reversing" }, { id: "q3", type: "scenario", question: "When is the camera useful?", options: ["While reversing", "For financing"], correctAnswer: "While reversing", explanation: "The source gives this context.", sourceEvidence: "while reversing" }, { id: "q4", type: "multiple_choice", question: "Which model is named?", options: ["Pulse", "Other"], correctAnswer: "Pulse", explanation: "Pulse is named.", sourceEvidence: "The Pulse includes" }],
});

test("parses and validates a grounded generated lesson", () => {
  assert.equal(validateGeneratedTrainingContent(valid, true), "");
  assert.equal(validateQuestionEvidence(valid, source), true);
});

test("rejects quiz evidence that is absent from the source", () => {
  const unsupported = { ...valid, knowledgeCheck: valid.knowledgeCheck.map((question, index) => index === 0 ? { ...question, sourceEvidence: "Includes a ten-year warranty" } : question) };
  assert.equal(validateQuestionEvidence(unsupported, source), false);
});

test("requires no quiz when the knowledge check is disabled", () => {
  assert.match(validateGeneratedTrainingContent(valid, false), /Remove the knowledge check/);
});

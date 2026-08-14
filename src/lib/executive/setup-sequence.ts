import type { ExecutiveReadinessCheck } from "@/lib/executive/readiness";

export type ExecutiveSetupStep = ExecutiveReadinessCheck & { number: number; state: "complete" | "current" | "upcoming" };

export function buildExecutiveSetupSequence(checks: ExecutiveReadinessCheck[]): ExecutiveSetupStep[] {
  const required = checks.filter((check) => check.required);
  const firstIncomplete = required.findIndex((check) => !check.ready);
  return required.map((check, index) => ({ ...check, number: index + 1, state: check.ready ? "complete" : index === firstIncomplete ? "current" : "upcoming" }));
}

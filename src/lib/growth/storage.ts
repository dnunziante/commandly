import type { GrowthPlan } from "@/lib/growth/data";

export const growthPlansStorageKey = "commandly-demo-growth-plans";

export function readGrowthPlans(): GrowthPlan[] {
  const saved = window.localStorage.getItem(growthPlansStorageKey);
  if (!saved) return [];
  const parsed: unknown = JSON.parse(saved);
  return Array.isArray(parsed) ? (parsed as GrowthPlan[]).map((plan) => ({ ...plan, locationId: plan.locationId ?? null, locationName: plan.locationName ?? "All locations", outcomes: Array.isArray(plan.outcomes) ? plan.outcomes : [] })) : [];
}

export function writeGrowthPlans(plans: GrowthPlan[]) {
  window.localStorage.setItem(growthPlansStorageKey, JSON.stringify(plans));
}

export function formatGrowthDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return "Not set";
  return new Date(year, month - 1, day).toLocaleDateString();
}

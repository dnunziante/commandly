export const TRAINING_CATEGORIES = [
  "General",
  "Sales Process",
  "Product Knowledge",
  "Policies",
  "Operations",
] as const;

export type TrainingCategory = (typeof TRAINING_CATEGORIES)[number];

export function isTrainingCategory(value: string): value is TrainingCategory {
  return TRAINING_CATEGORIES.some((category) => category === value);
}

export function toStoredTrainingCategory(category: TrainingCategory) {
  return category === "Policies" ? "Compliance" : category;
}

export function toDisplayTrainingCategory(value: string): TrainingCategory {
  const normalized = value.trim().toLowerCase();
  if (normalized.includes("sales")) return "Sales Process";
  if (normalized.includes("product")) return "Product Knowledge";
  if (normalized.includes("policy") || normalized.includes("policies") || normalized.includes("compliance")) return "Policies";
  if (normalized.includes("operation")) return "Operations";
  return "General";
}

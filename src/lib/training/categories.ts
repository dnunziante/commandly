export const TRAINING_CATEGORIES = [
  "General",
  "Onboarding",
  "Product Knowledge",
  "Sales Process",
  "Customer Experience",
  "Compliance",
  "Leadership",
  "Operations",
] as const;

export type TrainingCategory = (typeof TRAINING_CATEGORIES)[number];

export function isTrainingCategory(value: string): value is TrainingCategory {
  return TRAINING_CATEGORIES.some((category) => category === value);
}

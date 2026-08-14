import type { ExecutivePriorityReview, ExecutivePriorityReviewStatus } from "@/lib/executive/data";

export type ExecutiveAccountabilitySummary = {
  total: number;
  active: number;
  completed: number;
  overdue: number;
  unassigned: number;
  completionRate: number;
};

export function summarizeExecutiveAccountability(reviews: ExecutivePriorityReview[], today = new Date()): ExecutiveAccountabilitySummary {
  const todayKey = today.toISOString().slice(0, 10);
  const completed = reviews.filter((review) => review.status === "completed").length;
  const active = reviews.filter((review) => review.status === "acknowledged" || review.status === "in_progress").length;
  const overdue = reviews.filter((review) => Boolean(review.dueDate) && review.dueDate < todayKey && review.status !== "completed" && review.status !== "dismissed").length;
  const unassigned = reviews.filter((review) => !review.ownerName.trim() && review.status !== "completed" && review.status !== "dismissed").length;
  return { total: reviews.length, active, completed, overdue, unassigned, completionRate: reviews.length ? Math.round(completed / reviews.length * 100) : 0 };
}

export const executiveReviewStatusLabel: Record<ExecutivePriorityReviewStatus, string> = {
  open: "Open",
  acknowledged: "Acknowledged",
  in_progress: "In progress",
  completed: "Completed",
  dismissed: "Dismissed",
};

import type { ExecutivePriorityReviewStatus } from "@/lib/executive/data";

export function executiveReviewRequiresOwner(status: ExecutivePriorityReviewStatus) {
  return status === "in_progress" || status === "completed";
}

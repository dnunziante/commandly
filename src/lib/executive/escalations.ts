import type { ExecutivePriorityReview } from "@/lib/executive/data";

export type ExecutiveEscalationSettings = { enabled: boolean; remindBeforeDays: number; escalateAfterDays: number; escalationRecipient: string };
export type ExecutiveNotification = { priorityKey: string; level: "reminder" | "escalation" | "assignment"; title: string; explanation: string; ownerName: string; dueDate: string };

export const defaultExecutiveEscalationSettings: ExecutiveEscalationSettings = { enabled: true, remindBeforeDays: 3, escalateAfterDays: 2, escalationRecipient: "Tenant administrator" };

const dayNumber = (value: string) => Math.floor(new Date(`${value}T12:00:00Z`).getTime() / 86_400_000);

export function buildExecutiveNotificationQueue(reviews: ExecutivePriorityReview[], settings: ExecutiveEscalationSettings, today = new Date()): ExecutiveNotification[] {
  if (!settings.enabled) return [];
  const todayKey = today.toISOString().slice(0, 10);
  const todayNumber = dayNumber(todayKey);
  const queue = reviews.flatMap((review): ExecutiveNotification[] => {
    if (review.status === "completed" || review.status === "dismissed") return [];
    if (!review.ownerName.trim()) return [{ priorityKey: review.priorityKey, level: "assignment", title: "Owner required", explanation: "This active priority has no named owner.", ownerName: "Unassigned", dueDate: review.dueDate }];
    if (!review.dueDate) return [];
    const daysUntilDue = dayNumber(review.dueDate) - todayNumber;
    if (daysUntilDue < 0 && Math.abs(daysUntilDue) >= settings.escalateAfterDays) return [{ priorityKey: review.priorityKey, level: "escalation", title: "Escalation required", explanation: `${Math.abs(daysUntilDue)} day${Math.abs(daysUntilDue) === 1 ? "" : "s"} overdue · route to ${settings.escalationRecipient}.`, ownerName: review.ownerName, dueDate: review.dueDate }];
    if (daysUntilDue < 0) return [{ priorityKey: review.priorityKey, level: "reminder", title: "Overdue reminder", explanation: `${Math.abs(daysUntilDue)} day${Math.abs(daysUntilDue) === 1 ? "" : "s"} overdue; escalation begins after ${settings.escalateAfterDays} day${settings.escalateAfterDays === 1 ? "" : "s"}.`, ownerName: review.ownerName, dueDate: review.dueDate }];
    if (daysUntilDue <= settings.remindBeforeDays) return [{ priorityKey: review.priorityKey, level: "reminder", title: "Due soon", explanation: daysUntilDue === 0 ? "Due today." : `Due in ${daysUntilDue} day${daysUntilDue === 1 ? "" : "s"}.`, ownerName: review.ownerName, dueDate: review.dueDate }];
    return [];
  });
  const levelOrder = { escalation: 0, assignment: 1, reminder: 2 } as const;
  return queue.sort((a, b) => levelOrder[a.level] - levelOrder[b.level]);
}

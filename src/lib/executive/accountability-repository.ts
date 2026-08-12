import "server-only";

import { canViewExecutive } from "@/lib/auth/permissions";
import { getViewer } from "@/lib/auth/viewer";
import { summarizeExecutiveAccountability } from "@/lib/executive/accountability";
import { buildExecutiveNotificationQueue, defaultExecutiveEscalationSettings, type ExecutiveEscalationSettings } from "@/lib/executive/escalations";
import type { ExecutivePriorityReview, ExecutivePriorityReviewStatus } from "@/lib/executive/data";
import { rankExecutivePriorities } from "@/lib/executive/data";
import { createClient } from "@/lib/supabase/server";

export type ExecutiveReviewHistoryItem = ExecutivePriorityReview & { previousStatus: ExecutivePriorityReviewStatus | null; changedAt: string };
const validMonth = (value?: string) => /^\d{4}-\d{2}$/.test(value ?? "") ? value! : new Date().toISOString().slice(0, 7);

export async function getExecutiveEscalationSettings(): Promise<{ settings: ExecutiveEscalationSettings; error: string }> {
  const viewer = await getViewer();
  if (!viewer || viewer.demo) return { settings: defaultExecutiveEscalationSettings, error: "" };
  const supabase = await createClient();
  const { data, error } = await supabase.from("executive_escalation_settings").select("enabled,remind_before_days,escalate_after_days,escalation_recipient").eq("organization_id", viewer.organizationId).maybeSingle();
  return { settings: data ? { enabled: data.enabled, remindBeforeDays: data.remind_before_days, escalateAfterDays: data.escalate_after_days, escalationRecipient: data.escalation_recipient } : defaultExecutiveEscalationSettings, error: error?.message ?? "" };
}

export async function getExecutiveAccountability(period?: string) {
  const viewer = await getViewer();
  const reportingPeriod = validMonth(period);
  const samplePriorities = rankExecutivePriorities();
  const names = Object.fromEntries(samplePriorities.map((priority) => [priority.id, priority.title]));
  if (!viewer || !canViewExecutive(viewer.role)) return { canView: false, persistence: "supabase" as const, reportingPeriod, availablePeriods: [reportingPeriod], reviews: [], history: [], summary: summarizeExecutiveAccountability([]), notifications: [], settings: defaultExecutiveEscalationSettings, names, error: "" };
  if (viewer.demo) {
    const reviews: ExecutivePriorityReview[] = [
      { id: "demo-1", priorityKey: "delivery-readiness", reportingPeriod: `${reportingPeriod}-01`, status: "in_progress", ownerName: "Operations Manager", dueDate: `${reportingPeriod}-08`, reviewNote: "Confirm the final delivery handoff.", updatedAt: `${reportingPeriod}-11T15:00:00Z` },
      { id: "demo-2", priorityKey: "coaching-completion", reportingPeriod: `${reportingPeriod}-01`, status: "acknowledged", ownerName: "Sales Manager", dueDate: `${reportingPeriod}-22`, reviewNote: "Schedule focused practice.", updatedAt: `${reportingPeriod}-10T15:00:00Z` },
      { id: "demo-3", priorityKey: "growth-plan", reportingPeriod: `${reportingPeriod}-01`, status: "completed", ownerName: "Growth Lead", dueDate: `${reportingPeriod}-09`, reviewNote: "Owner and next measure confirmed.", updatedAt: `${reportingPeriod}-09T15:00:00Z` },
    ];
    const history: ExecutiveReviewHistoryItem[] = reviews.map((item, index) => ({ ...item, previousStatus: index === 2 ? "in_progress" : "open", changedAt: item.updatedAt }));
    const settings = defaultExecutiveEscalationSettings;
    return { canView: true, persistence: "demo" as const, reportingPeriod, availablePeriods: [reportingPeriod], reviews, history, summary: summarizeExecutiveAccountability(reviews), notifications: buildExecutiveNotificationQueue(reviews, settings), settings, names, error: "" };
  }
  const supabase = await createClient();
  const periodDate = `${reportingPeriod}-01`;
  const [reviewsResult, historyResult, periodsResult, settingsResult] = await Promise.all([
    supabase.from("executive_priority_reviews").select("id,priority_key,reporting_period,status,owner_name,due_date,review_note,updated_at").eq("organization_id", viewer.organizationId).eq("reporting_period", periodDate).order("updated_at", { ascending: false }),
    supabase.from("executive_priority_review_history").select("id,review_id,priority_key,reporting_period,previous_status,status,owner_name,due_date,review_note,changed_at").eq("organization_id", viewer.organizationId).eq("reporting_period", periodDate).order("changed_at", { ascending: false }).limit(100),
    supabase.from("executive_priority_reviews").select("reporting_period").eq("organization_id", viewer.organizationId).order("reporting_period", { ascending: false }),
    supabase.from("executive_escalation_settings").select("enabled,remind_before_days,escalate_after_days,escalation_recipient").eq("organization_id", viewer.organizationId).maybeSingle(),
  ]);
  const reviews = (reviewsResult.data ?? []).map((row) => ({ id: row.id, priorityKey: row.priority_key, reportingPeriod: row.reporting_period, status: row.status as ExecutivePriorityReviewStatus, ownerName: row.owner_name, dueDate: row.due_date ?? "", reviewNote: row.review_note, updatedAt: row.updated_at }));
  const history = (historyResult.data ?? []).map((row) => ({ id: row.review_id, priorityKey: row.priority_key, reportingPeriod: row.reporting_period, status: row.status as ExecutivePriorityReviewStatus, previousStatus: row.previous_status as ExecutivePriorityReviewStatus | null, ownerName: row.owner_name, dueDate: row.due_date ?? "", reviewNote: row.review_note, updatedAt: row.changed_at, changedAt: row.changed_at }));
  const availablePeriods = [...new Set([reportingPeriod, ...(periodsResult.data ?? []).map((row) => row.reporting_period.slice(0, 7))])];
  const settings = settingsResult.data ? { enabled: settingsResult.data.enabled, remindBeforeDays: settingsResult.data.remind_before_days, escalateAfterDays: settingsResult.data.escalate_after_days, escalationRecipient: settingsResult.data.escalation_recipient } : defaultExecutiveEscalationSettings;
  const error = reviewsResult.error?.message ?? historyResult.error?.message ?? periodsResult.error?.message ?? settingsResult.error?.message ?? "";
  return { canView: true, persistence: "supabase" as const, reportingPeriod, availablePeriods, reviews, history, summary: summarizeExecutiveAccountability(reviews), notifications: buildExecutiveNotificationQueue(reviews, settings), settings, names, error };
}

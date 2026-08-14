import "server-only";

import { getExecutiveAccountability } from "@/lib/executive/accountability-repository";
import { getExecutiveDecisions } from "@/lib/executive/decision-repository";
import { buildLeadershipAgenda } from "@/lib/executive/monthly-review";
import { getExecutiveWorkspace } from "@/lib/executive/repository";
import { getViewer } from "@/lib/auth/viewer";
import { createClient } from "@/lib/supabase/server";

export async function getMonthlyLeadershipReview(period?: string) {
  const [workspace, accountability, decisionLog, viewer] = await Promise.all([
    getExecutiveWorkspace(period),
    getExecutiveAccountability(period),
    getExecutiveDecisions(period),
    getViewer(),
  ]);
  const availablePeriods = [...new Set([...workspace.availablePeriods, ...accountability.availablePeriods, ...decisionLog.availablePeriods])].sort().reverse();
  const agenda = buildLeadershipAgenda({
    priorityCount: workspace.priorities.length,
    escalationCount: accountability.notifications.filter((item) => item.level === "escalation").length,
    overdueCount: accountability.summary.overdue,
    unassignedCount: accountability.summary.unassigned,
    dueDecisionCount: decisionLog.summary.dueForReview,
    openDecisionCount: decisionLog.summary.open,
  });
  let completion = { error: "", completedAt: "", completedBy: "", notes: "" };
  if (viewer && !viewer.demo && workspace.canView) {
    const supabase = await createClient();
    const result = await supabase.from("executive_monthly_review_completions").select("notes,completed_at,profiles!executive_monthly_review_completions_completed_by_fkey(full_name)").eq("organization_id", viewer.organizationId).eq("reporting_period", `${workspace.reportingPeriod}-01`).maybeSingle();
    const profile = result.data?.profiles as unknown as { full_name: string } | null;
    completion = { error: result.error?.message ?? "", completedAt: result.data?.completed_at ?? "", completedBy: profile?.full_name ?? "Manager", notes: result.data?.notes ?? "" };
  }
  const errors = [...new Set([workspace.error, accountability.error, decisionLog.error, completion.error].filter(Boolean))];
  return { canView: workspace.canView && accountability.canView && decisionLog.canView, persistence: workspace.persistence, reportingPeriod: workspace.reportingPeriod, availablePeriods, workspace, accountability, decisionLog, agenda, completion, error: errors.join(" ") };
}

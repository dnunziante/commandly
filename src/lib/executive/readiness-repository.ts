import "server-only";

import { canManageExecutiveTargets, canViewExecutive } from "@/lib/auth/permissions";
import { getViewer } from "@/lib/auth/viewer";
import { buildExecutiveReadiness } from "@/lib/executive/readiness";
import { createClient } from "@/lib/supabase/server";

const validMonth = (value?: string) => /^\d{4}-\d{2}$/.test(value ?? "") ? value! : new Date().toISOString().slice(0, 7);
const recentMonths = () => Array.from({ length: 6 }, (_, index) => { const date = new Date(); date.setUTCDate(1); date.setUTCMonth(date.getUTCMonth() - index); return date.toISOString().slice(0, 7); });

export async function getExecutiveReadiness(period?: string) {
  const reportingPeriod = validMonth(period);
  const viewer = await getViewer();
  if (!viewer || !canViewExecutive(viewer.role)) return { canView: false, canManageSetup: false, persistence: "supabase" as const, reportingPeriod, availablePeriods: [reportingPeriod], ...buildExecutiveReadiness({ locationIds: [], locationNames: [], approvedLocationIds: [], approvedPeriods: [], targetsConfigured: false, coachingTotal: 0, coachingUnassigned: 0, growthTotal: 0, growthUnassigned: 0, operationsLocationNames: [], reviewCompleted: false }), error: "" };
  if (viewer.demo) return { canView: true, canManageSetup: true, persistence: "demo" as const, reportingPeriod, availablePeriods: recentMonths(), ...buildExecutiveReadiness({ locationIds: ["charleston", "summerville"], locationNames: ["Charleston", "Summerville"], approvedLocationIds: ["charleston", "summerville"], approvedPeriods: recentMonths(), targetsConfigured: true, coachingTotal: 6, coachingUnassigned: 1, growthTotal: 3, growthUnassigned: 0, operationsLocationNames: ["Charleston", "Summerville"], reviewCompleted: reportingPeriod === new Date().toISOString().slice(0, 7) }), error: "" };
  const supabase = await createClient();
  const periodDate = `${reportingPeriod}-01`;
  const [locations, sales, targets, coaching, growth, operations, completion] = await Promise.all([
    supabase.from("locations").select("id,name").eq("organization_id", viewer.organizationId).eq("is_active", true).order("name"),
    supabase.from("sales_results").select("location_id,period_start,status").eq("organization_id", viewer.organizationId).order("period_start", { ascending: false }),
    supabase.from("executive_targets").select("organization_id").eq("organization_id", viewer.organizationId).maybeSingle(),
    supabase.from("coach_sessions").select("location_id").eq("organization_id", viewer.organizationId),
    supabase.from("growth_action_plans").select("location_id").eq("organization_id", viewer.organizationId),
    supabase.from("operations_checklists").select("location_name").eq("organization_id", viewer.organizationId),
    supabase.from("executive_monthly_review_completions").select("id").eq("organization_id", viewer.organizationId).eq("reporting_period", periodDate).maybeSingle(),
  ]);
  const salesRows = sales.data ?? [];
  const approvedPeriods = [...new Set(salesRows.filter((row) => row.status === "approved").map((row) => row.period_start.slice(0, 7)))].sort().reverse();
  const availablePeriods = [...new Set([reportingPeriod, ...salesRows.map((row) => row.period_start.slice(0, 7))])].sort().reverse();
  const readiness = buildExecutiveReadiness({
    locationIds: (locations.data ?? []).map((row) => row.id),
    locationNames: (locations.data ?? []).map((row) => row.name),
    approvedLocationIds: salesRows.filter((row) => row.status === "approved" && row.period_start === periodDate).map((row) => row.location_id),
    approvedPeriods,
    targetsConfigured: Boolean(targets.data),
    coachingTotal: coaching.data?.length ?? 0,
    coachingUnassigned: (coaching.data ?? []).filter((row) => !row.location_id).length,
    growthTotal: growth.data?.length ?? 0,
    growthUnassigned: (growth.data ?? []).filter((row) => !row.location_id).length,
    operationsLocationNames: (operations.data ?? []).map((row) => row.location_name),
    reviewCompleted: Boolean(completion.data),
  });
  const error = [locations, sales, targets, coaching, growth, operations, completion].find((result) => result.error)?.error?.message ?? "";
  return { canView: true, canManageSetup: canManageExecutiveTargets(viewer.role), persistence: "supabase" as const, reportingPeriod, availablePeriods, ...readiness, error };
}

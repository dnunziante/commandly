import "server-only";

import { canManageExecutiveTargets } from "@/lib/auth/permissions";
import { getViewer } from "@/lib/auth/viewer";
import { getOrganizationLocations, type OrganizationLocation } from "@/lib/locations";
import { createClient } from "@/lib/supabase/server";
import { classifySalesDataQuality } from "@/lib/sales/quality";

export type SalesResult = {
  id: string; locationId: string; locationName: string; periodStart: string;
  revenueTarget: number; revenueActual: number; unitsTarget: number; unitsActual: number;
  leads: number; appointments: number; status: "draft" | "approved"; notes: string; approvedAt: string | null;
};

export type SalesResultsWorkspace = { persistence: "demo" | "supabase"; canManage: boolean; locations: OrganizationLocation[]; results: SalesResult[]; error: string };

export type SalesDataQualityStatus = "missing" | "draft" | "approved" | "outdated";
export type SalesDataQualityRow = { locationId: string; locationName: string; status: SalesDataQualityStatus; periodStart: string; latestPeriod: string | null; result: SalesResult | null };
export type SalesDataQualityWorkspace = SalesResultsWorkspace & { reportingPeriod: string; availablePeriods: string[]; quality: SalesDataQualityRow[]; counts: Record<SalesDataQualityStatus, number> };

type Row = { id: string; location_id: string; period_start: string; revenue_target: number | string; revenue_actual: number | string; units_target: number; units_actual: number; leads: number; appointments: number; status: "draft" | "approved"; notes: string; approved_at: string | null; locations: { name: string } | { name: string }[] | null };

function locationName(value: Row["locations"]) { return Array.isArray(value) ? value[0]?.name ?? "Unknown location" : value?.name ?? "Unknown location"; }
function mapResult(row: Row): SalesResult { return { id: row.id, locationId: row.location_id, locationName: locationName(row.locations), periodStart: row.period_start, revenueTarget: Number(row.revenue_target), revenueActual: Number(row.revenue_actual), unitsTarget: row.units_target, unitsActual: row.units_actual, leads: row.leads, appointments: row.appointments, status: row.status, notes: row.notes, approvedAt: row.approved_at }; }

export async function getSalesResultsWorkspace(): Promise<SalesResultsWorkspace> {
  const viewer = await getViewer();
  const locationResult = await getOrganizationLocations();
  if (viewer?.demo) return { persistence: "demo", canManage: true, locations: locationResult.locations, results: [], error: locationResult.error };
  if (!viewer) return { persistence: "supabase", canManage: false, locations: [], results: [], error: "Sign in to view sales results." };
  const canManage = canManageExecutiveTargets(viewer.role);
  if (!canManage) return { persistence: "supabase", canManage: false, locations: locationResult.locations, results: [], error: "" };
  const supabase = await createClient();
  const { data, error } = await supabase.from("sales_results").select("id, location_id, period_start, revenue_target, revenue_actual, units_target, units_actual, leads, appointments, status, notes, approved_at, locations(name)").eq("organization_id", viewer.organizationId).order("period_start", { ascending: false });
  return { persistence: "supabase", canManage, locations: locationResult.locations, results: error ? [] : ((data ?? []) as Row[]).map(mapResult), error: error?.message ?? locationResult.error };
}

function validMonth(value?: string) { return /^\d{4}-\d{2}$/.test(value ?? "") ? value! : new Date().toISOString().slice(0, 7); }

export async function getSalesDataQualityWorkspace(month?: string): Promise<SalesDataQualityWorkspace> {
  const workspace = await getSalesResultsWorkspace();
  const reportingPeriod = validMonth(month);
  const periodStart = `${reportingPeriod}-01`;
  const availablePeriods = [...new Set([reportingPeriod, ...workspace.results.map((result) => result.periodStart.slice(0, 7))])].sort().reverse();
  const quality = workspace.locations.map((location): SalesDataQualityRow => {
    const locationResults = workspace.results.filter((result) => result.locationId === location.id).sort((a, b) => b.periodStart.localeCompare(a.periodStart));
    const result = locationResults.find((item) => item.periodStart === periodStart) ?? null;
    const latestPeriod = locationResults[0]?.periodStart ?? null;
    const status: SalesDataQualityStatus = classifySalesDataQuality(periodStart, result?.status ?? null, latestPeriod);
    return { locationId: location.id, locationName: location.name, status, periodStart, latestPeriod, result };
  });
  const counts = quality.reduce<Record<SalesDataQualityStatus, number>>((total, item) => ({ ...total, [item.status]: total[item.status] + 1 }), { missing: 0, draft: 0, approved: 0, outdated: 0 });
  return { ...workspace, reportingPeriod, availablePeriods, quality, counts };
}

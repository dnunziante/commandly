"use server";

import { revalidatePath } from "next/cache";
import { canManageExecutiveTargets } from "@/lib/auth/permissions";
import { getViewer } from "@/lib/auth/viewer";
import type { ExecutiveTargets } from "@/lib/executive/data";
import type { ExecutiveEscalationSettings } from "@/lib/executive/escalations";
import { createClient } from "@/lib/supabase/server";

export async function saveExecutiveTargets(targets: ExecutiveTargets) {
  const viewer = await getViewer();
  if (!viewer || viewer.demo) return { error: "" };
  if (!canManageExecutiveTargets(viewer.role)) return { error: "Only tenant administrators can change executive targets." };
  const percentageTargets = [targets.coachingCompletion, targets.growthCompletion, targets.operationsCompletion];
  if (!Number.isInteger(targets.salesPace) || targets.salesPace < 1 || targets.salesPace > 200 || percentageTargets.some((value) => !Number.isInteger(value) || value < 1 || value > 100) || !Number.isInteger(targets.highRiskLimit) || targets.highRiskLimit < 0 || targets.highRiskLimit > 100) return { error: "Enter whole-number targets within the allowed ranges." };
  const supabase = await createClient();
  const { error } = await supabase.from("executive_targets").upsert({ organization_id: viewer.organizationId, sales_pace_target: targets.salesPace, coaching_completion_target: targets.coachingCompletion, growth_completion_target: targets.growthCompletion, operations_completion_target: targets.operationsCompletion, high_risk_limit: targets.highRiskLimit, updated_by: viewer.id, updated_at: new Date().toISOString() });
  if (!error) { revalidatePath("/executive"); revalidatePath("/admin/executive"); }
  return { error: error?.message ?? "" };
}

export async function saveExecutiveEscalationSettings(settings: ExecutiveEscalationSettings) {
  const viewer = await getViewer();
  if (!viewer || viewer.demo) return { error: "" };
  if (!canManageExecutiveTargets(viewer.role)) return { error: "Only tenant administrators can change escalation rules." };
  if (!Number.isInteger(settings.remindBeforeDays) || settings.remindBeforeDays < 0 || settings.remindBeforeDays > 30 || !Number.isInteger(settings.escalateAfterDays) || settings.escalateAfterDays < 0 || settings.escalateAfterDays > 30 || settings.escalationRecipient.trim().length < 2 || settings.escalationRecipient.trim().length > 100) return { error: "Enter valid notice rules within the allowed ranges." };
  const supabase = await createClient();
  const { error } = await supabase.from("executive_escalation_settings").upsert({ organization_id: viewer.organizationId, enabled: settings.enabled, remind_before_days: settings.remindBeforeDays, escalate_after_days: settings.escalateAfterDays, escalation_recipient: settings.escalationRecipient.trim(), updated_by: viewer.id, updated_at: new Date().toISOString() });
  if (!error) { revalidatePath("/executive/accountability"); revalidatePath("/admin/executive"); }
  return { error: error?.message ?? "" };
}

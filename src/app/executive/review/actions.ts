"use server";

import { revalidatePath } from "next/cache";
import { canViewExecutive } from "@/lib/auth/permissions";
import { getViewer } from "@/lib/auth/viewer";
import { createClient } from "@/lib/supabase/server";

export type ReviewCompletionState = { error: string; completedAt: string; completedBy: string; notes: string };

export async function completeMonthlyLeadershipReview(_state: ReviewCompletionState, formData: FormData): Promise<ReviewCompletionState> {
  const viewer = await getViewer();
  if (!viewer) return { error: "Sign in to complete this review.", completedAt: "", completedBy: "", notes: "" };
  if (!canViewExecutive(viewer.role)) return { error: "Only managers and administrators can complete leadership reviews.", completedAt: "", completedBy: "", notes: "" };
  const period = String(formData.get("period") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();
  if (!/^\d{4}-\d{2}$/.test(period) || notes.length > 2000) return { error: "Choose a valid reporting period and keep notes under 2,000 characters.", completedAt: "", completedBy: "", notes };
  const completedAt = new Date().toISOString();
  if (viewer.demo) return { error: "", completedAt, completedBy: viewer.fullName, notes };
  const supabase = await createClient();
  const { error } = await supabase.from("executive_monthly_review_completions").upsert({ organization_id: viewer.organizationId, reporting_period: `${period}-01`, notes, completed_by: viewer.id, completed_at: completedAt, updated_at: completedAt }, { onConflict: "organization_id,reporting_period" });
  if (error) return { error: error.message, completedAt: "", completedBy: "", notes };
  revalidatePath("/executive/review");
  return { error: "", completedAt, completedBy: viewer.fullName, notes };
}

"use server";

import { revalidatePath } from "next/cache";
import { canViewExecutive } from "@/lib/auth/permissions";
import { getViewer } from "@/lib/auth/viewer";
import type { ExecutivePriorityReview, ExecutivePriorityReviewStatus } from "@/lib/executive/data";
import { getExecutiveWorkspace } from "@/lib/executive/repository";
import { executiveReviewRequiresOwner } from "@/lib/executive/reviews";
import { createClient } from "@/lib/supabase/server";

type ReviewInput = { priorityKey: string; reportingPeriod: string; status: ExecutivePriorityReviewStatus; ownerName: string; dueDate: string; reviewNote: string };
const statuses: ExecutivePriorityReviewStatus[] = ["open", "acknowledged", "in_progress", "completed", "dismissed"];

export async function saveExecutivePriorityReview(input: ReviewInput): Promise<{ review?: ExecutivePriorityReview; error?: string }> {
  const viewer = await getViewer();
  if (!viewer) return { error: "Sign in to review this priority." };
  if (!canViewExecutive(viewer.role)) return { error: "Only managers and administrators can review Executive priorities." };
  if (!/^[a-z0-9-]{2,80}$/.test(input.priorityKey) || !/^\d{4}-\d{2}$/.test(input.reportingPeriod) || !statuses.includes(input.status) || input.ownerName.trim().length > 160 || input.reviewNote.trim().length > 2000 || (input.dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(input.dueDate))) return { error: "Review details are invalid or exceed the allowed length." };
  if (executiveReviewRequiresOwner(input.status) && input.ownerName.trim().length < 2) return { error: "Assign an owner before marking this priority in progress or completed." };
  const workspace = await getExecutiveWorkspace(input.reportingPeriod);
  if (!workspace.priorities.some((priority) => priority.id === input.priorityKey)) return { error: "That priority is no longer active for this reporting period." };
  const review: ExecutivePriorityReview = { id: "demo-review", priorityKey: input.priorityKey, reportingPeriod: `${input.reportingPeriod}-01`, status: input.status, ownerName: input.ownerName.trim(), dueDate: input.dueDate, reviewNote: input.reviewNote.trim(), updatedAt: new Date().toISOString() };
  if (viewer.demo) return { review };
  const supabase = await createClient();
  const { data: existing, error: lookupError } = await supabase.from("executive_priority_reviews").select("id").eq("organization_id", viewer.organizationId).eq("priority_key", input.priorityKey).eq("reporting_period", `${input.reportingPeriod}-01`).maybeSingle();
  if (lookupError) return { error: lookupError.message };
  const values = { status: input.status, owner_name: review.ownerName, due_date: input.dueDate || null, review_note: review.reviewNote, updated_by: viewer.id, updated_at: review.updatedAt };
  const result = existing ? await supabase.from("executive_priority_reviews").update(values).eq("id", existing.id).eq("organization_id", viewer.organizationId).select("id,priority_key,reporting_period,status,owner_name,due_date,review_note,updated_at").single() : await supabase.from("executive_priority_reviews").insert({ ...values, organization_id: viewer.organizationId, priority_key: input.priorityKey, reporting_period: `${input.reportingPeriod}-01`, created_by: viewer.id }).select("id,priority_key,reporting_period,status,owner_name,due_date,review_note,updated_at").single();
  if (result.error || !result.data) return { error: result.error?.message ?? "The review could not be saved." };
  revalidatePath("/executive");
  revalidatePath("/executive/accountability");
  const row = result.data;
  return { review: { id: row.id, priorityKey: row.priority_key, reportingPeriod: row.reporting_period, status: row.status as ExecutivePriorityReviewStatus, ownerName: row.owner_name, dueDate: row.due_date ?? "", reviewNote: row.review_note, updatedAt: row.updated_at } };
}

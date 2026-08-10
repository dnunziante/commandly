"use server";
import { revalidatePath } from "next/cache";
import { getViewer } from "@/lib/auth/viewer";
import type { GrowthScore, GrowthScoreWeights } from "@/lib/growth/data";
import { createClient } from "@/lib/supabase/server";

export async function saveGrowthScoring(weights: GrowthScoreWeights, scores: Record<string, GrowthScore>) {
  const viewer = await getViewer();
  if (!viewer || viewer.demo) return { error: "" };
  if (viewer.role !== "tenant_admin" && viewer.role !== "platform_owner") return { error: "Only tenant administrators can change scoring." };
  const values = Object.values(weights); if (values.some((value) => !Number.isInteger(value) || value < 0 || value > 100) || values.reduce((sum, value) => sum + value, 0) !== 100) return { error: "Weights must be whole numbers totaling 100." };
  if (Object.values(scores).some((score) => Object.values(score).some((value) => !Number.isInteger(value) || value < 1 || value > 5))) return { error: "Every rating must be a whole number from 1 to 5." };
  const supabase = await createClient(); const { error } = await supabase.from("growth_scoring_configs").upsert({ organization_id: viewer.organizationId, weights, opportunity_scores: scores, updated_by: viewer.id, updated_at: new Date().toISOString() });
  if (!error) { revalidatePath("/growth"); revalidatePath("/growth/priorities"); revalidatePath("/admin/growth"); }
  return { error: error?.message ?? "" };
}

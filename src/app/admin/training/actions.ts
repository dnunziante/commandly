"use server";

import { revalidatePath } from "next/cache";
import { getViewer } from "@/lib/auth/viewer";
import { isLocalDemoMode } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type TrainingModuleActionState = { error: string; success: string };

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function requireTenantAdmin() {
  const viewer = await getViewer();
  if (!viewer?.organizationId || !["tenant_admin", "platform_owner"].includes(viewer.role)) throw new Error("Unauthorized");
  return viewer;
}

export async function saveTrainingModule(_previousState: TrainingModuleActionState, formData: FormData): Promise<TrainingModuleActionState> {
  if (isLocalDemoMode()) return { error: "Module editing is disabled in local demo mode.", success: "" };
  const viewer = await requireTenantAdmin();
  const moduleId = String(formData.get("moduleId") || "");
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const isPublished = formData.get("isPublished") === "on";
  const requestedLessonIds = [...new Set(formData.getAll("lessonId").map(String).filter((id) => uuidPattern.test(id)))];

  if (title.length < 2 || title.length > 140) return { error: "Enter a module title between 2 and 140 characters.", success: "" };
  if (requestedLessonIds.length < 1) return { error: "Choose at least one lesson for this module.", success: "" };

  const supabase = await createClient();
  const { data: validLessons, error: lessonError } = await supabase
    .from("training_lessons")
    .select("id")
    .eq("organization_id", viewer.organizationId)
    .in("id", requestedLessonIds);
  if (lessonError || !validLessons || validLessons.length !== requestedLessonIds.length) return { error: "One or more selected lessons are unavailable.", success: "" };

  const validIds = new Set(validLessons.map((lesson) => lesson.id));
  const orderedLessonIds = requestedLessonIds
    .filter((id) => validIds.has(id))
    .map((id, index) => ({ id, order: Number(formData.get(`order-${id}`)) || index + 1 }))
    .sort((a, b) => a.order - b.order)
    .map((item) => item.id);

  let savedModuleId = moduleId;
  if (moduleId) {
    if (!uuidPattern.test(moduleId)) return { error: "The selected module is invalid.", success: "" };
    const { data, error } = await supabase.from("training_modules").update({
      title,
      description,
      is_published: isPublished,
      updated_at: new Date().toISOString(),
    }).eq("id", moduleId).eq("organization_id", viewer.organizationId).select("id").maybeSingle();
    if (error || !data) return { error: "The module could not be updated.", success: "" };
  } else {
    const { data, error } = await supabase.from("training_modules").insert({
      organization_id: viewer.organizationId,
      created_by: viewer.id,
      title,
      description,
      is_published: isPublished,
    }).select("id").single();
    if (error || !data) return { error: "The module could not be created.", success: "" };
    savedModuleId = data.id;
  }

  const { data: currentAssignments } = await supabase
    .from("training_module_lessons")
    .select("lesson_id")
    .eq("module_id", savedModuleId)
    .eq("organization_id", viewer.organizationId);

  const { error: upsertError } = await supabase.from("training_module_lessons").upsert(
    orderedLessonIds.map((lessonId, index) => ({
      module_id: savedModuleId,
      lesson_id: lessonId,
      organization_id: viewer.organizationId,
      sort_order: index + 1,
    })),
    { onConflict: "module_id,lesson_id" },
  );
  if (upsertError) return { error: "The module was saved, but its lesson order could not be updated.", success: "" };

  const removedIds = (currentAssignments || []).map((row) => row.lesson_id).filter((id) => !orderedLessonIds.includes(id));
  if (removedIds.length) {
    const { error: removeError } = await supabase.from("training_module_lessons").delete()
      .eq("module_id", savedModuleId).eq("organization_id", viewer.organizationId).in("lesson_id", removedIds);
    if (removeError) return { error: "The module was saved, but removed lessons could not be cleared.", success: "" };
  }

  revalidatePath("/training");
  revalidatePath("/admin/training");
  return { error: "", success: `${title} was saved${isPublished ? " and published" : " as a draft"}.` };
}

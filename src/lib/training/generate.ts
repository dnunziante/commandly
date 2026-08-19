import "server-only";

import { createGroundedTrainingLesson } from "@/lib/rag/openai";
import { createAdminClient } from "@/lib/supabase/admin";
import { isTrainingType, type TrainingType } from "./generated";

const MAX_TRAINING_SOURCE_CHARACTERS = 100_000;

export type TrainingGenerationOptions = {
  estimatedMinutes: 5 | 10 | 15;
  trainingType: TrainingType;
  includeKnowledgeCheck: boolean;
};

export type TrainingGenerationResult =
  | { ok: true; lessonId: string; reused: boolean }
  | { ok: false; lessonId?: string; step: "indexing" | "generation" | "storage"; error: string };

export function parseTrainingGenerationOptions(input: {
  estimatedMinutes?: unknown;
  trainingType?: unknown;
  includeKnowledgeCheck?: unknown;
}): TrainingGenerationOptions {
  const minutes = Number(input.estimatedMinutes);
  const estimatedMinutes = ([5, 10, 15] as const).includes(minutes as 5 | 10 | 15) ? minutes as 5 | 10 | 15 : 10;
  const requestedType = String(input.trainingType || "auto_detect");
  const requestedKnowledgeCheck = input.includeKnowledgeCheck;
  return {
    estimatedMinutes,
    trainingType: isTrainingType(requestedType) ? requestedType : "auto_detect",
    includeKnowledgeCheck: requestedKnowledgeCheck === undefined
      ? true
      : requestedKnowledgeCheck === true || ["true", "on", "yes", "1"].includes(String(requestedKnowledgeCheck).toLowerCase()),
  };
}

function publicGenerationError(error: unknown) {
  const message = error instanceof Error ? error.message : "The training lesson could not be generated.";
  return message.replace(/sk-[A-Za-z0-9_-]+/g, "[redacted]").slice(0, 500);
}

export async function generateTrainingLessonForDocument(input: {
  documentId: string;
  organizationId: string;
  createdBy: string;
  options: TrainingGenerationOptions;
}): Promise<TrainingGenerationResult> {
  const admin = createAdminClient();
  const { data: document, error: documentError } = await admin
    .from("knowledge_documents")
    .select("id, organization_id, title, original_filename, status, location_id, processed_at, updated_at, created_at")
    .eq("id", input.documentId)
    .eq("organization_id", input.organizationId)
    .maybeSingle();

  if (documentError || !document) return { ok: false, step: "storage", error: "The source document was not found in this workspace." };
  if (document.status !== "ready") return { ok: false, step: "indexing", error: "The source document must finish indexing before training can be generated." };

  const { data: existingLesson, error: lessonLookupError } = await admin
    .from("training_lessons")
    .select("id, is_published, generation_status, source_review_required")
    .eq("organization_id", input.organizationId)
    .eq("knowledge_document_id", input.documentId)
    .maybeSingle();
  if (lessonLookupError) return { ok: false, step: "storage", error: "The existing training relationship could not be checked." };
  if (existingLesson?.is_published) {
    return { ok: false, lessonId: existingLesson.id, step: "generation", error: "The published lesson was preserved. Open it for review instead of overwriting it." };
  }
  if (existingLesson?.generation_status === "ready" && !existingLesson.source_review_required) {
    return { ok: true, lessonId: existingLesson.id, reused: true };
  }

  let lessonId = existingLesson?.id as string | undefined;
  if (lessonId) {
    const { error } = await admin.from("training_lessons").update({
      generation_status: "generating",
      generation_error: null,
      estimated_minutes: input.options.estimatedMinutes,
      training_type: input.options.trainingType,
      include_knowledge_check: input.options.includeKnowledgeCheck,
      location_id: document.location_id,
      updated_at: new Date().toISOString(),
    }).eq("id", lessonId).eq("organization_id", input.organizationId).eq("is_published", false);
    if (error) return { ok: false, lessonId, step: "storage", error: "The draft lesson could not be prepared for generation." };
  } else {
    const { data: inserted, error } = await admin.from("training_lessons").insert({
      organization_id: input.organizationId,
      knowledge_document_id: input.documentId,
      created_by: input.createdBy,
      title: document.title,
      description: `Draft training based on ${document.original_filename}`,
      estimated_minutes: input.options.estimatedMinutes,
      training_type: input.options.trainingType,
      include_knowledge_check: input.options.includeKnowledgeCheck,
      generation_status: "generating",
      generation_error: null,
      generated_content: {},
      location_id: document.location_id,
      is_published: false,
      source_document_updated_at: document.processed_at || document.updated_at || document.created_at,
    }).select("id").single();
    if (error || !inserted) return { ok: false, step: "storage", error: "The draft training record could not be created." };
    lessonId = inserted.id;
  }

  if (!lessonId) return { ok: false, step: "storage", error: "The draft training record could not be prepared." };

  let failedStep: "generation" | "storage" = "generation";
  try {
    const { data: chunkRows, error: chunkError } = await admin
      .from("knowledge_document_chunks")
      .select("chunk_index, content")
      .eq("organization_id", input.organizationId)
      .eq("document_id", input.documentId)
      .order("chunk_index", { ascending: true });
    if (chunkError || !chunkRows?.length) throw new Error("No indexed source text was available for training generation.");

    const sourceText = chunkRows.map((row) => String(row.content || "").trim()).filter(Boolean).join("\n\n");
    if (sourceText.length > MAX_TRAINING_SOURCE_CHARACTERS) {
      throw new Error("This document is too large for one grounded training lesson. Split it into smaller approved documents and retry.");
    }

    const draft = await createGroundedTrainingLesson({
      sourceName: document.original_filename,
      sourceText,
      ...input.options,
    });
    const now = new Date().toISOString();
    failedStep = "storage";
    const { error: saveError } = await admin.from("training_lessons").update({
      title: draft.title,
      description: draft.description,
      estimated_minutes: input.options.estimatedMinutes,
      training_type: input.options.trainingType,
      include_knowledge_check: input.options.includeKnowledgeCheck,
      generated_content: draft.content,
      generation_status: "ready",
      generation_error: null,
      generated_at: now,
      source_document_updated_at: document.processed_at || document.updated_at || document.created_at,
      source_review_required: false,
      is_published: false,
      location_id: document.location_id,
      updated_at: now,
    }).eq("id", lessonId).eq("organization_id", input.organizationId).eq("knowledge_document_id", input.documentId);
    if (saveError) throw new Error("The generated lesson could not be saved.");
    return { ok: true, lessonId, reused: false };
  } catch (error) {
    const message = publicGenerationError(error);
    await admin.from("training_lessons").update({
      generation_status: "failed",
      generation_error: message,
      is_published: false,
      updated_at: new Date().toISOString(),
    }).eq("id", lessonId).eq("organization_id", input.organizationId);
    return { ok: false, lessonId, step: failedStep, error: message };
  }
}

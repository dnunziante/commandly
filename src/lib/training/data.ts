import "server-only";

import { getViewer } from "@/lib/auth/viewer";
import { demoTrainingLessons, demoTrainingModules } from "@/lib/demo/training";
import { isLocalDemoMode } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { toDisplayTrainingCategory } from "./categories";
import { parseGeneratedTrainingContent, type TrainingType } from "./generated";
import type { TrainingLessonDTO, TrainingModuleDTO, TrainingModulesResult, TrainingResult } from "./types";

type TrainingRow = {
  id: string;
  knowledge_document_id: string;
  title: string;
  description: string;
  estimated_minutes: number;
  created_at: string;
  generated_content?: unknown;
  is_published?: boolean;
  generation_status?: "pending" | "generating" | "ready" | "failed";
  generation_error?: string | null;
  training_type?: TrainingType;
  include_knowledge_check?: boolean;
  source_review_required?: boolean;
  location_id?: string | null;
  generated_at?: string | null;
  published_at?: string | null;
  knowledge_documents: { original_filename: string; collection: string; mime_type?: string } | null;
  locations?: { name: string } | null;
};

const lessonSelect = "id, knowledge_document_id, title, description, estimated_minutes, created_at, generated_content, is_published, generation_status, generation_error, training_type, include_knowledge_check, source_review_required, location_id, generated_at, published_at, knowledge_documents(original_filename, collection, mime_type), locations(name)";

function mapLesson(row: TrainingRow): TrainingLessonDTO {
  return {
    id: row.id,
    knowledgeDocumentId: row.knowledge_document_id,
    title: row.title,
    description: row.description,
    estimatedMinutes: row.estimated_minutes,
    sourceFilename: row.knowledge_documents?.original_filename ?? "Knowledge document",
    mimeType: row.knowledge_documents?.mime_type,
    collection: row.knowledge_documents?.collection ?? "General",
    createdAt: row.created_at,
    content: parseGeneratedTrainingContent(row.generated_content),
    isPublished: Boolean(row.is_published),
    generationStatus: row.generation_status ?? "ready",
    generationError: row.generation_error ?? undefined,
    trainingType: row.training_type ?? "auto_detect",
    includeKnowledgeCheck: row.include_knowledge_check ?? true,
    sourceReviewRequired: Boolean(row.source_review_required),
    locationId: row.location_id ?? undefined,
    locationName: row.locations?.name,
    generatedAt: row.generated_at ?? undefined,
    publishedAt: row.published_at ?? undefined,
  };
}

export async function getTrainingLessons(): Promise<TrainingResult> {
  const viewer = await getViewer();
  if (viewer?.demo || isLocalDemoMode()) return { lessons: demoTrainingLessons };
  if (!viewer?.organizationId) return { lessons: [], error: "Your account is not assigned to an organization." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("training_lessons")
    .select(lessonSelect)
    .eq("organization_id", viewer.organizationId)
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (error) return { lessons: [], error: "Training lessons could not be loaded." };

  return {
    lessons: (data as unknown as TrainingRow[]).map(mapLesson),
  };
}

export async function getTrainingLesson(lessonId: string): Promise<TrainingLessonDTO | null> {
  const viewer = await getViewer();
  if (!/^[0-9a-f-]{36}$/i.test(lessonId)) return null;
  if (viewer?.demo || isLocalDemoMode()) return demoTrainingLessons.find((lesson)=>lesson.id===lessonId)??null;
  if (!viewer?.organizationId) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("training_lessons")
    .select(lessonSelect)
    .eq("id", lessonId)
    .eq("organization_id", viewer.organizationId)
    .eq("is_published", true)
    .maybeSingle();

  if (error || !data) return null;
  return mapLesson(data as unknown as TrainingRow);
}

export async function getTrainingLessonForReview(lessonId: string): Promise<TrainingLessonDTO | null> {
  const viewer = await getViewer();
  if (viewer?.demo || isLocalDemoMode()) return demoTrainingLessons.find((lesson) => lesson.id === lessonId) ?? null;
  if (!/^[0-9a-f-]{36}$/i.test(lessonId) || !viewer?.organizationId || !["manager", "tenant_admin", "platform_owner"].includes(viewer.role)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.from("training_lessons").select(lessonSelect).eq("id", lessonId).eq("organization_id", viewer.organizationId).maybeSingle();
  return error || !data ? null : mapLesson(data as unknown as TrainingRow);
}

export async function getTrainingLessonsForReview(): Promise<TrainingResult> {
  const viewer = await getViewer();
  if (viewer?.demo || isLocalDemoMode()) return { lessons: demoTrainingLessons };
  if (!viewer?.organizationId || !["manager", "tenant_admin", "platform_owner"].includes(viewer.role)) return { lessons: [], error: "Manager access is required." };
  const supabase = await createClient();
  const { data, error } = await supabase.from("training_lessons").select(lessonSelect).eq("organization_id", viewer.organizationId).order("updated_at", { ascending: false });
  return error ? { lessons: [], error: "Training drafts could not be loaded." } : { lessons: (data as unknown as TrainingRow[]).map(mapLesson) };
}

type TrainingModuleRow = {
  id: string;
  title: string;
  description: string;
  category: string;
  is_published: boolean;
  created_at: string;
};

type TrainingModuleLessonRow = { module_id: string; lesson_id: string; sort_order: number };

export async function getTrainingModules(options: { includeDrafts?: boolean } = {}): Promise<TrainingModulesResult> {
  const viewer = await getViewer();
  if (viewer?.demo || isLocalDemoMode()) return { modules: demoTrainingModules, lessons: demoTrainingLessons };
  if (!viewer?.organizationId) return { modules: [], lessons: [], error: "Your account is not assigned to an organization." };

  const supabase = await createClient();
  let moduleQuery = supabase
    .from("training_modules")
    .select("id, title, description, category, is_published, created_at")
    .eq("organization_id", viewer.organizationId)
    .order("created_at", { ascending: false });
  if (!options.includeDrafts) moduleQuery = moduleQuery.eq("is_published", true);

  const [{ data: modules, error: modulesError }, lessonResult, { data: assignments, error: assignmentsError }] = await Promise.all([
    moduleQuery,
    getTrainingLessons(),
    supabase
      .from("training_module_lessons")
      .select("module_id, lesson_id, sort_order")
      .eq("organization_id", viewer.organizationId)
      .order("sort_order", { ascending: true }),
  ]);

  if (modulesError || assignmentsError || lessonResult.error) {
    return { modules: [], lessons: lessonResult.lessons, error: "Training modules could not be loaded." };
  }

  const lessonsById = new Map(lessonResult.lessons.map((lesson) => [lesson.id, lesson]));
  const assignmentRows = assignments as TrainingModuleLessonRow[];
  return {
    lessons: lessonResult.lessons,
    modules: (modules as TrainingModuleRow[]).map((module): TrainingModuleDTO => ({
      id: module.id,
      title: module.title,
      description: module.description,
      category: toDisplayTrainingCategory(module.category),
      isPublished: module.is_published,
      createdAt: module.created_at,
      lessons: assignmentRows
        .filter((assignment) => assignment.module_id === module.id)
        .map((assignment) => lessonsById.get(assignment.lesson_id))
        .filter((lesson): lesson is TrainingLessonDTO => Boolean(lesson)),
    })),
  };
}

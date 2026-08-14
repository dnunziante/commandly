import "server-only";

import { getViewer } from "@/lib/auth/viewer";
import { isLocalDemoMode } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { toDisplayTrainingCategory } from "./categories";
import type { TrainingLessonDTO, TrainingModuleDTO, TrainingModulesResult, TrainingResult } from "./types";

type TrainingRow = {
  id: string;
  knowledge_document_id: string;
  title: string;
  description: string;
  estimated_minutes: number;
  created_at: string;
  knowledge_documents: { original_filename: string; collection: string; mime_type?: string } | null;
};

export async function getTrainingLessons(): Promise<TrainingResult> {
  if (isLocalDemoMode()) return { lessons: [] };

  const viewer = await getViewer();
  if (!viewer?.organizationId) return { lessons: [], error: "Your account is not assigned to an organization." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("training_lessons")
    .select("id, knowledge_document_id, title, description, estimated_minutes, created_at, knowledge_documents(original_filename, collection)")
    .eq("organization_id", viewer.organizationId)
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (error) return { lessons: [], error: "Training lessons could not be loaded." };

  return {
    lessons: (data as unknown as TrainingRow[]).map((row): TrainingLessonDTO => ({
      id: row.id,
      knowledgeDocumentId: row.knowledge_document_id,
      title: row.title,
      description: row.description,
      estimatedMinutes: row.estimated_minutes,
      sourceFilename: row.knowledge_documents?.original_filename ?? "Knowledge document",
      collection: row.knowledge_documents?.collection ?? "General",
      createdAt: row.created_at,
    })),
  };
}

export async function getTrainingLesson(lessonId: string): Promise<TrainingLessonDTO | null> {
  if (!/^[0-9a-f-]{36}$/i.test(lessonId) || isLocalDemoMode()) return null;

  const viewer = await getViewer();
  if (!viewer?.organizationId) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("training_lessons")
    .select("id, knowledge_document_id, title, description, estimated_minutes, created_at, knowledge_documents(original_filename, collection, mime_type)")
    .eq("id", lessonId)
    .eq("organization_id", viewer.organizationId)
    .eq("is_published", true)
    .maybeSingle();

  if (error || !data) return null;
  const row = data as unknown as TrainingRow;
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
  };
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
  if (isLocalDemoMode()) return { modules: [], lessons: [] };

  const viewer = await getViewer();
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

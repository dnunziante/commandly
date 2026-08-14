import "server-only";

import { getViewer } from "@/lib/auth/viewer";
import { isLocalDemoMode } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { TrainingLessonDTO, TrainingResult } from "./types";

type TrainingRow = {
  id: string;
  knowledge_document_id: string;
  title: string;
  description: string;
  estimated_minutes: number;
  created_at: string;
  knowledge_documents: { original_filename: string; collection: string } | null;
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

import "server-only";

import { getViewer } from "@/lib/auth/viewer";
import { isLocalDemoMode } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { KnowledgeDocumentDTO, KnowledgeResult } from "./types";

type KnowledgeRow = {
  id: string;
  title: string;
  original_filename: string;
  collection: string;
  mime_type: string;
  size_bytes: number;
  status: "uploaded" | "processing" | "ready" | "error";
  created_at: string;
};

const statusLabels = {
  uploaded: "Uploaded",
  processing: "Processing",
  ready: "Ready",
  error: "Error",
} as const;

export async function getKnowledgeDocuments(): Promise<KnowledgeResult> {
  if (isLocalDemoMode()) return { documents: [] };

  const viewer = await getViewer();
  if (!viewer?.organizationId) return { documents: [], error: "Your account is not assigned to an organization." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("knowledge_documents")
    .select("id, title, original_filename, collection, mime_type, size_bytes, status, created_at")
    .eq("organization_id", viewer.organizationId)
    .order("created_at", { ascending: false });

  if (error) return { documents: [], error: "Knowledge documents could not be loaded." };

  return {
    documents: (data as KnowledgeRow[]).map((row): KnowledgeDocumentDTO => ({
      id: row.id,
      title: row.title,
      filename: row.original_filename,
      collection: row.collection,
      mimeType: row.mime_type,
      sizeBytes: row.size_bytes,
      status: statusLabels[row.status],
      createdAt: row.created_at,
    })),
  };
}

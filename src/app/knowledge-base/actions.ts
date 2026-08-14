"use server";

import { revalidatePath } from "next/cache";
import { getViewer } from "@/lib/auth/viewer";
import { createClient } from "@/lib/supabase/server";

export async function createTrainingLesson(formData: FormData) {
  const viewer = await getViewer();
  if (!viewer?.organizationId || !["tenant_admin", "platform_owner"].includes(viewer.role)) throw new Error("Unauthorized");

  const documentId = String(formData.get("documentId") || "");
  if (!/^[0-9a-f-]{36}$/i.test(documentId)) throw new Error("Invalid document ID");

  const supabase = await createClient();
  const { data: document, error: lookupError } = await supabase
    .from("knowledge_documents")
    .select("id, title, collection, original_filename")
    .eq("id", documentId)
    .eq("organization_id", viewer.organizationId)
    .maybeSingle();

  if (lookupError || !document) throw new Error("Document not found");

  const { error } = await supabase.from("training_lessons").insert({
    organization_id: viewer.organizationId,
    knowledge_document_id: document.id,
    created_by: viewer.id,
    title: document.title,
    description: `${document.collection} training based on ${document.original_filename}`,
    estimated_minutes: 10,
    is_published: true,
  });

  if (error && error.code !== "23505") throw new Error("The training lesson could not be created.");
  revalidatePath("/knowledge-base");
  revalidatePath("/training");
}

export async function deleteKnowledgeDocument(formData: FormData) {
  const viewer = await getViewer();
  if (!viewer?.organizationId || !["tenant_admin", "platform_owner"].includes(viewer.role)) throw new Error("Unauthorized");

  const documentId = String(formData.get("documentId") || "");
  if (!/^[0-9a-f-]{36}$/i.test(documentId)) throw new Error("Invalid document ID");

  const supabase = await createClient();
  const { data: document, error: lookupError } = await supabase
    .from("knowledge_documents")
    .select("storage_path")
    .eq("id", documentId)
    .eq("organization_id", viewer.organizationId)
    .maybeSingle();

  if (lookupError || !document) throw new Error("Document not found");

  const { error: storageError } = await supabase.storage.from("knowledge-documents").remove([document.storage_path]);
  if (storageError) throw new Error("The stored file could not be removed.");

  const { error: metadataError } = await supabase
    .from("knowledge_documents")
    .delete()
    .eq("id", documentId)
    .eq("organization_id", viewer.organizationId);

  if (metadataError) throw new Error("The document record could not be removed.");
  revalidatePath("/knowledge-base");
  revalidatePath("/training");
}

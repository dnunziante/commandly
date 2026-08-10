import { NextResponse } from "next/server";
import { getViewer } from "@/lib/auth/viewer";
import { createClient } from "@/lib/supabase/server";

const MAX_FILE_SIZE = 4 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "application/pdf",
  "text/plain",
  "text/markdown",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
const ALLOWED_COLLECTIONS = new Set(["General", "Product knowledge", "Policies", "Sales process", "Operations"]);

function safeFilename(filename: string) {
  const extension = filename.includes(".") ? `.${filename.split(".").pop()?.toLowerCase()}` : "";
  const base = filename.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "document";
  return `${base}${extension}`;
}

export async function POST(request: Request) {
  const viewer = await getViewer();
  if (!viewer || !viewer.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (viewer.demo) return NextResponse.json({ error: "Uploads are disabled in local demo mode." }, { status: 403 });
  if (!["tenant_admin", "platform_owner"].includes(viewer.role)) return NextResponse.json({ error: "Tenant administrator access is required." }, { status: 403 });

  const formData = await request.formData();
  const file = formData.get("file");
  const title = String(formData.get("title") || "").trim();
  const requestedCollection = String(formData.get("collection") || "General");
  const collection = ALLOWED_COLLECTIONS.has(requestedCollection) ? requestedCollection : "General";

  if (!(file instanceof File) || file.size === 0) return NextResponse.json({ error: "Choose a document to upload." }, { status: 400 });
  if (!ALLOWED_TYPES.has(file.type)) return NextResponse.json({ error: "Upload a PDF, Word document, Markdown file, or plain-text file." }, { status: 400 });
  if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: "The document must be 4 MB or smaller." }, { status: 400 });
  if (title.length < 2 || title.length > 140) return NextResponse.json({ error: "Enter a title between 2 and 140 characters." }, { status: 400 });

  const supabase = await createClient();
  const storagePath = `${viewer.organizationId}/${crypto.randomUUID()}-${safeFilename(file.name)}`;
  const { error: uploadError } = await supabase.storage.from("knowledge-documents").upload(storagePath, file, { contentType: file.type, upsert: false });
  if (uploadError) return NextResponse.json({ error: "The file could not be uploaded." }, { status: 500 });

  const { error: metadataError } = await supabase.from("knowledge_documents").insert({
    organization_id: viewer.organizationId,
    uploaded_by: viewer.id,
    title,
    original_filename: file.name,
    storage_path: storagePath,
    mime_type: file.type,
    size_bytes: file.size,
    collection,
    status: "uploaded",
  });

  if (metadataError) {
    await supabase.storage.from("knowledge-documents").remove([storagePath]);
    return NextResponse.json({ error: "The document record could not be saved." }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}

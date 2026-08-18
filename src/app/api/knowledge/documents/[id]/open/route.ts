import { NextResponse } from "next/server";
import { getViewer } from "@/lib/auth/viewer";
import { createClient } from "@/lib/supabase/server";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Invalid document ID" }, { status: 400 });

  const viewer = await getViewer();
  if (!viewer?.organizationId || viewer.demo) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createClient();
  const { data: document, error } = await supabase
    .from("knowledge_documents")
    .select("storage_path")
    .eq("id", id)
    .eq("organization_id", viewer.organizationId)
    .maybeSingle();

  if (error || !document) return NextResponse.json({ error: "Document not found" }, { status: 404 });

  const { data, error: signedUrlError } = await supabase.storage
    .from("knowledge-documents")
    .createSignedUrl(document.storage_path, 60);

  if (signedUrlError || !data.signedUrl) return NextResponse.json({ error: "The document could not be opened" }, { status: 500 });
  return NextResponse.redirect(data.signedUrl);
}

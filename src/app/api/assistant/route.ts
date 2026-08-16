import { NextResponse } from "next/server";
import { getViewer } from "@/lib/auth/viewer";
import { createClient } from "@/lib/supabase/server";
import { createEmbeddings, createGroundedAnswer } from "@/lib/rag/openai";

type SearchChunk = { document_name: string; content: string; section: string | null; page_number: number | null; similarity: number };

export async function POST(request: Request) {
  const viewer = await getViewer();
  if (!viewer || !viewer.organizationId) return NextResponse.json({ error: "Sign in to use the Sales Assistant." }, { status: 401 });
  if (viewer.demo) return NextResponse.json({ error: "The Sales Assistant needs a signed-in Refyntra workspace to search approved knowledge." }, { status: 403 });

  const body = await request.json().catch(() => null);
  const question = typeof body?.question === "string" ? body.question.trim() : "";
  if (question.length < 2 || question.length > 2000) return NextResponse.json({ error: "Enter a question between 2 and 2,000 characters." }, { status: 400 });

  try {
    const supabase = await createClient();
    const { data: membership } = await supabase.from("organization_memberships").select("location_id").eq("organization_id", viewer.organizationId).eq("user_id", viewer.id).eq("status", "active").maybeSingle();
    const [embedding] = await createEmbeddings([question]);
    const { data: chunks, error } = await supabase.rpc("match_knowledge_chunks", {
      query_embedding: `[${embedding.join(",")}]`, match_tenant_id: viewer.organizationId,
      match_location_id: membership?.location_id || null, match_product_id: null, match_count: 8,
    });
    if (error) throw error;
    const results = (chunks || []) as SearchChunk[];
    if (!results.length) return NextResponse.json({ answer: "I could not find approved Refyntra knowledge that verifies an answer to that question yet.", sources: [] });

    const sourceContext = results.map((chunk, index) => `[${index + 1}] ${chunk.document_name}${chunk.section ? ` — ${chunk.section}` : ""}${chunk.page_number ? `, page ${chunk.page_number}` : ""}\n${chunk.content}`).join("\n\n");
    const { data: settings } = await supabase.from("organization_settings").select("assistant_instructions").eq("organization_id", viewer.organizationId).maybeSingle();
    const answer = await createGroundedAnswer(question, sourceContext, settings?.assistant_instructions);
    const sourceKeys = new Set<string>();
    const sources = results.filter((chunk) => {
      const key = `${chunk.document_name}|${chunk.section || ""}|${chunk.page_number || ""}`;
      if (sourceKeys.has(key)) return false;
      sourceKeys.add(key);
      return true;
    }).slice(0, 5).map((chunk) => ({ documentName: chunk.document_name, section: chunk.section, pageNumber: chunk.page_number }));
    return NextResponse.json({ answer, sources });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The Sales Assistant could not complete the request.";
    return NextResponse.json({ error: message.includes("OPENAI_API_KEY") ? "The secure OpenAI connection has not been configured yet." : "The Sales Assistant could not complete the request." }, { status: 503 });
  }
}

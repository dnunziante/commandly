import { NextResponse } from "next/server";
import { getViewer } from "@/lib/auth/viewer";
import { createClient } from "@/lib/supabase/server";
import { createEmbeddings, createGroundedAnswer } from "@/lib/rag/openai";
import { formatProductContext, selectRelevantProducts, type ApprovedProduct } from "@/lib/rag/product-context";
import { formatCommunicationContext, getCommunicationContext } from "@/lib/rag/communication-context";

type SearchChunk = { document_name: string; content: string; section: string | null; page_number: number | null; similarity: number };
const MINIMUM_SIMILARITY = 0.35;

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
    const [{ data: chunks, error }, { data: productRows, error: productError }, communication] = await Promise.all([
      supabase.rpc("match_knowledge_chunks", {
        query_embedding: `[${embedding.join(",")}]`, match_tenant_id: viewer.organizationId,
        match_location_id: membership?.location_id || null, match_product_id: null, match_count: 8,
      }),
      supabase.from("products")
        .select("id, name, model, description, base_price_cents, range_text, seats_text, powertrain_text, dimensions, running_distance, turning_radius, max_load_capacity, highlights, sales_guide")
        .eq("organization_id", viewer.organizationId).eq("status", "published")
        .order("sort_order", { ascending: true }).limit(250),
      getCommunicationContext(supabase, viewer.organizationId, embedding),
    ]);
    if (error) throw error;
    if (productError) throw productError;

    const results = ((chunks || []) as SearchChunk[]).filter((chunk) => chunk.similarity >= MINIMUM_SIMILARITY);
    const products = selectRelevantProducts(question, (productRows || []) as ApprovedProduct[]);
    if (!results.length && !products.length) return NextResponse.json({ answer: "I do not have approved information in the Refyntra knowledge base to answer that question.", sources: [] });

    const productContext = products.map((product, index) => `[P${index + 1}] ${formatProductContext(product)}`);
    const documentContext = results.map((chunk, index) => `[${index + 1}] ${chunk.document_name}${chunk.section ? ` — ${chunk.section}` : ""}${chunk.page_number ? `, page ${chunk.page_number}` : ""}\n${chunk.content}`);
    const sourceContext = [...productContext, ...documentContext].join("\n\n");
    const answer = await createGroundedAnswer(question, sourceContext, communication.standards, formatCommunicationContext(communication));
    await supabase.from("performance_events").insert({ organization_id: viewer.organizationId, user_id: viewer.id, location_id: membership?.location_id || null, event_type: "assistant_question_answered" });

    const sourceKeys = new Set<string>();
    const documentSources = results.filter((chunk) => {
      const key = `${chunk.document_name}|${chunk.section || ""}|${chunk.page_number || ""}`;
      if (sourceKeys.has(key)) return false;
      sourceKeys.add(key);
      return true;
    }).map((chunk) => ({ documentName: chunk.document_name, section: chunk.section, pageNumber: chunk.page_number }));
    const productSources = products.map((product) => ({ documentName: `Product catalog — ${product.name}${product.model ? ` — ${product.model}` : ""}`, section: null, pageNumber: null }));
    const sources = answer.startsWith("I do not have approved information in the Refyntra knowledge base") ? [] : [...productSources, ...documentSources].slice(0, 5);
    return NextResponse.json({ answer, sources });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The Sales Assistant could not complete the request.";
    console.error("Sales Assistant request failed", { name: error instanceof Error ? error.name : "UnknownError", message });
    return NextResponse.json({ error: message.includes("OPENAI_API_KEY") ? "The secure OpenAI connection has not been configured yet." : "The Sales Assistant could not complete the request." }, { status: 503 });
  }
}

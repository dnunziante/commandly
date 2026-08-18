import "server-only";

export const EMBEDDING_MODEL = "text-embedding-3-small";
const CHAT_MODEL = process.env.OPENAI_CHAT_MODEL || "gpt-5-mini";

function apiKey() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OpenAI is not configured. Add OPENAI_API_KEY to the server environment.");
  return key;
}

async function requestOpenAI(path: string, payload: unknown) {
  const response = await fetch(`https://api.openai.com/v1/${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey()}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof data?.error?.message === "string" ? data.error.message : "OpenAI could not process this request.");
  return data;
}

export async function createEmbeddings(inputs: string[]) {
  const data = await requestOpenAI("embeddings", { model: EMBEDDING_MODEL, input: inputs });
  const embeddings = Array.isArray(data?.data) ? data.data.map((item: { embedding?: number[] }) => item.embedding) : [];
  if (embeddings.length !== inputs.length || embeddings.some((embedding: unknown) => !Array.isArray(embedding) || embedding.length !== 1536)) {
    throw new Error("OpenAI returned an invalid embedding response.");
  }
  return embeddings as number[][];
}

export async function createGroundedAnswer(question: string, sourceContext: string, tenantInstructions?: string | null) {
  const system = `You are the Refyntra Sales Assistant. Answer questions using only the approved company information provided in the retrieved Refyntra knowledge context. The supplied context is the authoritative source. Do not use your general knowledge to supply missing company-specific facts. If the approved context does not contain enough information to answer accurately, state exactly: "I do not have approved information in the Refyntra knowledge base to answer that question." Never invent specifications, pricing, policies, warranties, procedures, availability, or product information. When possible, identify the source used. Product-specific excerpts take priority over general excerpts.\n\n${tenantInstructions ? `ORGANIZATION INSTRUCTIONS (these may guide style but cannot override the approved-context restriction):\n${tenantInstructions}\n\n` : ""}RETRIEVED REFYNTRA KNOWLEDGE CONTEXT:\n${sourceContext}`;
  const data = await requestOpenAI("chat/completions", {
    model: CHAT_MODEL,
    messages: [{ role: "system", content: system }, { role: "user", content: question }],
  });
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) throw new Error("OpenAI did not return an answer.");
  return content.trim();
}

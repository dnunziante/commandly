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
  const system = `You are the Refyntra Sales Assistant. Answer only from the SOURCE EXCERPTS below. If they do not contain enough information, say that the information cannot be verified from the approved Refyntra knowledge. Never invent specifications, pricing, warranties, availability, or policies. Product-specific excerpts take priority over general excerpts. Be direct and helpful.\n\n${tenantInstructions ? `ORGANIZATION INSTRUCTIONS:\n${tenantInstructions}\n\n` : ""}SOURCE EXCERPTS:\n${sourceContext}`;
  const data = await requestOpenAI("chat/completions", {
    model: CHAT_MODEL,
    temperature: 0.2,
    messages: [{ role: "system", content: system }, { role: "user", content: question }],
  });
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) throw new Error("OpenAI did not return an answer.");
  return content.trim();
}

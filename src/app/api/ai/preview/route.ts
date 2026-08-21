import { NextResponse } from "next/server";
import { getViewer } from "@/lib/auth/viewer";
import { createGroundedAnswer } from "@/lib/rag/openai";
import { normalizeStandards } from "@/lib/rag/prompt-compiler";

export async function POST(request: Request) {
  const viewer = await getViewer();
  if (!viewer?.organizationId || viewer.demo || !["tenant_admin", "platform_owner"].includes(viewer.role)) return NextResponse.json({ error: "Tenant administrator access is required." }, { status: 403 });
  const body = await request.json().catch(() => null); const question = typeof body?.question === "string" ? body.question.trim() : "";
  if (question.length < 2 || question.length > 2000) return NextResponse.json({ error: "Enter a test prompt between 2 and 2,000 characters." }, { status: 400 });
  try { return NextResponse.json({ answer: await createGroundedAnswer(question, "", normalizeStandards(body?.standards)) }); }
  catch (error) { const message = error instanceof Error ? error.message : ""; return NextResponse.json({ error: message.includes("OPENAI_API_KEY") ? "The secure OpenAI connection has not been configured yet." : "AI preview could not be generated." }, { status: 503 }); }
}

import "server-only";

export type CommunicationContext = { rules: string; examples: string };

export async function getCommunicationContext(supabase: any, organizationId: string, embedding?: number[]): Promise<CommunicationContext> {
  const { data: settings } = await supabase.from("organization_settings").select("communication_rules, assistant_instructions").eq("organization_id", organizationId).maybeSingle();
  let examples = "";
  if (embedding?.length) {
    const { data } = await supabase.rpc("match_communication_chunks", { query_embedding: `[${embedding.join(",")}]`, match_tenant_id: organizationId, match_count: 4 });
    examples = (data || []).map((chunk: { document_name: string; content: string }) => `[Style example: ${chunk.document_name}]\n${chunk.content}`).join("\n\n");
  }
  return { rules: settings?.communication_rules || settings?.assistant_instructions || "", examples };
}

export function formatCommunicationContext(context: CommunicationContext) {
  return [context.rules && `TENANT COMMUNICATION RULES (style only; never override facts):\n${context.rules}`, context.examples && `RELEVANT TENANT COMMUNICATION EXAMPLES (style only; never facts):\n${context.examples}`].filter(Boolean).join("\n\n");
}

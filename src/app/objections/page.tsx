import { AppShell } from "@/components/app-shell";
import { ObjectionHandling, type ObjectionResponse } from "@/components/objection-handling";
import { PageHeader } from "@/components/page-header";
import { getViewer } from "@/lib/auth/viewer";
import { objections as demoObjections } from "@/lib/data";
import { isLocalDemoMode, isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

function splitResponse(body: string) {
  const [response, followUp] = body.split(/\n(?:follow[- ]?up|question)\s*:/i, 2);
  return { response: response.trim(), followUp: followUp?.trim() || "What would make the decision easier?" };
}

export default async function ObjectionsPage() {
  let objections: ObjectionResponse[] = demoObjections.map((item, index) => ({ id: `demo-${index}`, ...item }));
  if (!isLocalDemoMode() && isSupabaseConfigured()) {
    const viewer = await getViewer();
    if (viewer?.organizationId) {
      const supabase = await createClient();
      const { data } = await supabase.from("sales_content_items").select("id,title,body").eq("organization_id", viewer.organizationId).eq("content_type", "objection_response").eq("status", "published").order("updated_at", { ascending: false });
      objections = (data || []).map((item) => ({ id: item.id, title: item.title, type: "Approved response", ...splitResponse(item.body) }));
    }
  }
  return <AppShell title="Objection Handling"><PageHeader eyebrow="Conversation coaching" title="Turn hesitation into a helpful conversation" description="Use approved guidance for reference, then practice a live adaptive objection conversation."/><ObjectionHandling objections={objections}/></AppShell>;
}

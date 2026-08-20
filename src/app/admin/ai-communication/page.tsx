import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { CommunicationExamplesManager } from "@/components/communication-examples-manager";
import { getViewer } from "@/lib/auth/viewer";
import { createClient } from "@/lib/supabase/server";

export default async function AICommunicationStandardsPage() {
  const viewer = await getViewer();
  const canManage = Boolean(viewer && !viewer.demo && ["tenant_admin", "platform_owner"].includes(viewer.role));
  const supabase = canManage && viewer?.organizationId ? await createClient() : null;
  const { data } = supabase ? await supabase.from("knowledge_documents").select("id,title,original_filename,status,created_at").eq("organization_id", viewer!.organizationId).eq("context_type", "communication_example").order("created_at", { ascending: false }) : { data: [] };
  return <AppShell title="Admin · AI Communication Standards"><PageHeader eyebrow="AI settings" title="AI Communication Standards" description="Communication rules teach Refyntra how your company communicates; the Knowledge Base remains the source of facts."/><section className="card"><h2>Communication Rules</h2><p>Set tone, response length, preferred phrasing, required disclaimers, and sales methodology on Company branding and settings.</p><a className="btn btn-secondary" href="/admin/settings">Open communication rules</a></section><div style={{ marginTop: 18 }}><CommunicationExamplesManager canManage={canManage} examples={data || []}/></div></AppShell>;
}

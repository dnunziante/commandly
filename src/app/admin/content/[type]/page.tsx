import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { SalesContentManager, type SalesContentItem } from "@/components/sales-content-manager";
import { getViewer } from "@/lib/auth/viewer";
import { createClient } from "@/lib/supabase/server";

const types: Record<string, { label: string; description: string }> = {
  sales_script: { label: "Sales scripts", description: "Add approved talk tracks and discovery prompts for the sales team." },
  objection_response: { label: "Objection responses", description: "Add approved answers to the questions and concerns representatives hear." },
  email_template: { label: "Email templates", description: "Add reusable approved emails for follow-up and customer communication." },
  text_template: { label: "Text templates", description: "Add reusable approved text messages for customer communication." },
};

export default async function SalesContentTypePage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  const config = types[type];
  if (!config) notFound();
  const viewer = await getViewer();
  const canManage = Boolean(viewer?.organizationId && !viewer.demo && ["tenant_admin", "platform_owner"].includes(viewer.role));
  let items: SalesContentItem[] = [];
  if (viewer?.organizationId && !viewer.demo) {
    const supabase = await createClient();
    const { data } = await supabase.from("sales_content_items").select("id, title, body, status, updated_at").eq("organization_id", viewer.organizationId).eq("content_type", type).order("updated_at", { ascending: false });
    items = (data || []).map((item) => ({ id: item.id, title: item.title, body: item.body, status: item.status as SalesContentItem["status"], updatedAt: item.updated_at }));
  }
  return <AppShell title={`Admin · ${config.label}`}><PageHeader eyebrow="Sales content" title={config.label} description={config.description}/><SalesContentManager contentType={type} label={config.label} items={items} canManage={canManage}/></AppShell>;
}

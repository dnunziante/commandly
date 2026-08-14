import Link from "next/link";
import { ArrowLeft, Info } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { OperationsChecklistManager } from "@/components/operations-checklist-manager";
import { PageHeader } from "@/components/page-header";
import { getOperationsWorkspace } from "@/lib/operations/repository";

export default async function OperationsChecklistsPage() {
  const data = await getOperationsWorkspace(); const shared = data.persistence === "supabase";
  return <AppShell title="Operations Checklists"><PageHeader eyebrow="Assign and complete the work" title="Turn repeatable operations into visible progress" description="Create location-based checklists, assign owners and due dates, and mark each operational step complete." action={<Link className="btn btn-ghost" href="/operations"><ArrowLeft size={16}/> Operations dashboard</Link>}/><div className="callout operations-disclaimer"><Info size={20}/><div><strong>{shared ? "Protected organization workspace" : "Saved only in this browser"}</strong><p>{shared ? "Checklists are stored in Supabase and shared only with authorized members of this organization." : "This prototype is not shared with other users. Clearing browser data will remove checklist changes."}</p></div></div><OperationsChecklistManager initialChecklists={data.checklists} persistence={data.persistence} initialError={data.error}/></AppShell>;
}

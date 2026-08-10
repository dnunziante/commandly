import Link from "next/link";
import { ArrowLeft, Info } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { OperationsChecklistManager } from "@/components/operations-checklist-manager";
import { PageHeader } from "@/components/page-header";

export default function OperationsChecklistsPage() {
  return <AppShell title="Operations Checklists"><PageHeader eyebrow="Assign and complete the work" title="Turn repeatable operations into visible progress" description="Create location-based checklists, assign owners and due dates, and mark each operational step complete." action={<Link className="btn btn-ghost" href="/operations"><ArrowLeft size={16}/> Operations dashboard</Link>}/><div className="callout operations-disclaimer"><Info size={20}/><div><strong>Saved only in this browser</strong><p>This prototype is not shared with other users. Clearing browser data will remove checklist changes.</p></div></div><OperationsChecklistManager/></AppShell>;
}

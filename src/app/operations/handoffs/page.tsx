import Link from "next/link";
import { ArrowLeft, Info } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { OperationsHandoffManager } from "@/components/operations-handoff-manager";
import { PageHeader } from "@/components/page-header";
import { getOperationsWorkspace } from "@/lib/operations/repository";

export default async function OperationsHandoffsPage() { const data = await getOperationsWorkspace(); const shared = data.persistence === "supabase"; return <AppShell title="Operations Handoffs"><PageHeader eyebrow="Carry context forward" title="Make every shift change clear and accountable" description="Record what happened, what remains unresolved, what was decided, and who owns the next action." action={<Link className="btn btn-ghost" href="/operations"><ArrowLeft size={16}/> Operations dashboard</Link>}/><div className="callout operations-disclaimer"><Info size={20}/><div><strong>{shared ? "Protected handoff history" : "Browser-local handoffs"}</strong><p>{shared ? "Handoffs are shared only with authorized members of this organization." : "These prototype handoff logs are saved only in this browser and are not sent to employees or other locations."}</p></div></div><OperationsHandoffManager initialHandoffs={data.handoffs} persistence={data.persistence} initialError={data.error}/></AppShell>; }

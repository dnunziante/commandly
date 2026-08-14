import Link from "next/link";
import { ArrowLeft, Info } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { OperationsIncidentManager } from "@/components/operations-incident-manager";
import { PageHeader } from "@/components/page-header";
import { getOperationsWorkspace } from "@/lib/operations/repository";

export default async function OperationsIncidentsPage() { const data = await getOperationsWorkspace(); const shared = data.persistence === "supabase"; return <AppShell title="Incident Reports"><PageHeader eyebrow="Document and correct" title="Turn operational incidents into verified corrective action" description="Capture what happened, contain the risk, identify the cause, assign corrective work, and verify closure." action={<Link className="btn btn-ghost" href="/operations"><ArrowLeft size={16}/> Operations dashboard</Link>}/><div className="callout operations-disclaimer"><Info size={20}/><div><strong>{shared ? "Protected incident register" : "Browser-local incident records"}</strong><p>{shared ? "Incident records are tenant-scoped, but this tool does not replace required regulatory, insurance, HR, or emergency reporting." : "This prototype does not replace required regulatory, insurance, human-resources, or emergency reporting."}</p></div></div><OperationsIncidentManager initialIncidents={data.incidents} persistence={data.persistence} initialError={data.error}/></AppShell>; }

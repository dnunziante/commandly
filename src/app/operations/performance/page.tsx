import Link from "next/link";
import { ArrowLeft, Info } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { OperationsPerformanceDashboard } from "@/components/operations-performance-dashboard";
import { PageHeader } from "@/components/page-header";
import { getOperationsWorkspace } from "@/lib/operations/repository";

export default async function OperationsPerformancePage() {
  const data = await getOperationsWorkspace();
  const shared = data.persistence === "supabase";
  return <AppShell title="Operations Performance">
    <PageHeader eyebrow="Measure execution" title="See where operational work is on track—and where it is not" description="Compare checklist completion, overdue work, and alert follow-through across locations using transparent calculations." action={<Link className="btn btn-ghost" href="/operations"><ArrowLeft size={16}/> Operations dashboard</Link>}/>
    <div className="callout operations-disclaimer"><Info size={20}/><div><strong>{shared ? "Shared operational performance" : "Browser-local performance"}</strong><p>{shared ? "Metrics use tenant-scoped checklists and alert history stored in Supabase." : "Metrics use only the sample and locally saved checklist and alert records in this browser. They are not live dealership results."}</p></div></div>
    <OperationsPerformanceDashboard initialChecklists={data.checklists} initialAlerts={data.alerts} persistence={data.persistence} initialError={data.error}/>
  </AppShell>;
}

import Link from "next/link";
import { ClipboardCheck } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { GrowthPerformanceDashboard } from "@/components/growth-performance-dashboard";
import { PageHeader } from "@/components/page-header";
import { getGrowthPlans } from "@/lib/growth/plans";

export default async function GrowthPerformancePage() {
  const data = await getGrowthPlans();
  return <AppShell title="Growth Performance"><PageHeader eyebrow="Measure execution" title="See whether growth plans are moving" description="Monitor ownership, deadlines, plan status, and task completion without confusing activity with verified business results." action={<Link className="btn btn-ghost" href="/growth/plans"><ClipboardCheck size={16}/> Action plans</Link>}/><div className="callout growth-disclaimer"><div><strong>{data.persistence === "demo" ? "Local prototype performance" : "Organization performance"}</strong><p>{data.persistence === "demo" ? "Metrics use plans saved in this browser only." : "Metrics use action plans protected within this organization’s Supabase workspace."}</p></div></div><GrowthPerformanceDashboard initialPlans={data.plans} persistence={data.persistence} initialError={data.error}/></AppShell>;
}

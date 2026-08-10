import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { GrowthPlanList } from "@/components/growth-plan-list";
import { PageHeader } from "@/components/page-header";
import { getGrowthPlans } from "@/lib/growth/plans";

export default async function GrowthPlansPage() {
  const data = await getGrowthPlans();
  return <AppShell title="Growth Action Plans"><PageHeader eyebrow={data.persistence === "demo" ? "Local prototype" : "Shared workspace"} title="Keep growth work accountable" description="Track owners, target dates, measures, and validation steps for opportunities you choose to explore." action={<Link className="btn btn-ghost" href="/growth"><ArrowLeft size={16}/> Opportunities</Link>}/><div className="callout growth-disclaimer"><div><strong>{data.persistence === "demo" ? "Saved only in this browser" : "Protected organization workspace"}</strong><p>{data.persistence === "demo" ? "These prototype plans are not shared with other users. Clearing browser data will remove them." : "Plans are stored in Supabase and visible only to authorized members of this organization."}</p></div></div><div className="section-heading"><h2>Active plans</h2></div><GrowthPlanList initialPlans={data.plans} persistence={data.persistence} initialError={data.error}/></AppShell>;
}

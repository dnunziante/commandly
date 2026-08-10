import Link from "next/link";
import { Boxes } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { AdminGrowthScoringEditor } from "@/components/admin-growth-scoring-editor";
import { PageHeader } from "@/components/page-header";
import { getGrowthScoring } from "@/lib/growth/scoring";
export default async function AdminGrowthPage(){const data=await getGrowthScoring();return <AppShell title="Admin · Growth Scoring"><PageHeader eyebrow="Tenant configuration" title="Set how this business prioritizes growth" description="Adjust the formula weights and opportunity ratings while keeping every result deterministic and explainable." action={<Link className="btn btn-secondary" href="/admin/growth/opportunities"><Boxes size={16}/> Manage opportunities</Link>}/>{data.error&&<div className="card error-card"><h2>Scoring configuration unavailable</h2><p>{data.error}</p></div>}<AdminGrowthScoringEditor opportunities={data.opportunities} initialWeights={data.weights} persistence={data.persistence} canEdit={data.canEdit}/></AppShell>}

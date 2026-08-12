import { redirect } from "next/navigation";
import Link from "next/link";
import { SearchCheck } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { SalesResultsManager } from "@/components/sales-results-manager";
import { getSalesResultsWorkspace } from "@/lib/sales/results";

export default async function SalesResultsPage() { const workspace = await getSalesResultsWorkspace(); if (!workspace.canManage) redirect("/executive"); return <AppShell title="Sales Results"><PageHeader eyebrow="Administrator data source" title="Approve monthly sales results" description="Enter verified location results. Only approved records feed the Executive Advisor." action={<Link className="btn btn-secondary" href="/admin/sales-results/quality"><SearchCheck size={16}/> Review data quality</Link>}/>{workspace.error && <div className="card error-card"><h2>Sales results unavailable</h2><p>{workspace.error}</p></div>}<SalesResultsManager workspace={workspace}/></AppShell>; }

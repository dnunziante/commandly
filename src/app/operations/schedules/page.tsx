import Link from "next/link";
import { ArrowLeft, Info } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { OperationsScheduleManager } from "@/components/operations-schedule-manager";
import { PageHeader } from "@/components/page-header";
import { getOperationsWorkspace } from "@/lib/operations/repository";

export default async function OperationsSchedulesPage() {
  const data = await getOperationsWorkspace(); const shared = data.persistence === "supabase";
  return <AppShell title="Recurring Schedules"><PageHeader eyebrow="Automate the routine" title="Turn approved procedures into recurring work" description="Schedule repeatable operational checklists, assign ownership, and generate each occurrence with a clear due date." action={<Link className="btn btn-ghost" href="/operations"><ArrowLeft size={16}/> Operations dashboard</Link>}/><div className="callout operations-disclaimer"><Info size={20}/><div><strong>{shared ? "Protected recurring schedules" : "Browser-local scheduling"}</strong><p>{shared ? "Schedules and generated checklists are stored for this organization. Background automation and notifications are not connected yet." : "This prototype generates checklists only when you select Generate now. It does not run in the background or notify employees."}</p></div></div><OperationsScheduleManager initialSchedules={data.schedules} initialProcedures={data.procedures} persistence={data.persistence} initialError={data.error}/></AppShell>;
}

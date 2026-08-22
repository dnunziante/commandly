import Link from "next/link";
import { ArrowLeft, Info } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { OperationsAlertManager } from "@/components/operations-alert-manager";
import { PageHeader } from "@/components/page-header";
import { getOperationsWorkspace } from "@/lib/operations/repository";

export default async function OperationsAlertsPage() {
  const data = await getOperationsWorkspace(); const shared = data.persistence === "supabase";
  return <AppShell title="Operational Alerts"><PageHeader eyebrow="Manage the exceptions" title="Surface problems, assign ownership, and close the loop" description="Track operational issues from the first alert through acknowledgment and verified resolution." action={<Link className="btn btn-ghost" href="/operations"><ArrowLeft size={16}/> Operations dashboard</Link>}/><div className="callout operations-disclaimer"><Info size={20}/><div><strong>{shared ? "Protected alert history" : "Browser-local alert history"}</strong><p>{shared ? "Alerts and status history are shared only with authorized organization members." : "Alerts and status changes are saved only in this browser and are not connected to shared dealership systems."}</p></div></div><OperationsAlertManager initialAlerts={data.alerts} persistence={data.persistence} initialError={data.error}/></AppShell>;
}

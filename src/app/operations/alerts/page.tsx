import Link from "next/link";
import { ArrowLeft, Info } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { OperationsAlertManager } from "@/components/operations-alert-manager";
import { PageHeader } from "@/components/page-header";

export default function OperationsAlertsPage() {
  return <AppShell title="Operational Alerts"><PageHeader eyebrow="Manage the exceptions" title="Surface problems, assign ownership, and close the loop" description="Track operational issues from the first alert through acknowledgment and verified resolution." action={<Link className="btn btn-ghost" href="/operations"><ArrowLeft size={16}/> Operations dashboard</Link>}/><div className="callout operations-disclaimer"><Info size={20}/><div><strong>Browser-local alert history</strong><p>Prototype alerts and status changes are saved only in this browser and are not connected to live dealership systems.</p></div></div><OperationsAlertManager/></AppShell>;
}

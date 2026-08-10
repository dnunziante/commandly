import Link from "next/link";
import { ArrowLeft, Info } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { OperationsHandoffManager } from "@/components/operations-handoff-manager";
import { PageHeader } from "@/components/page-header";

export default function OperationsHandoffsPage() { return <AppShell title="Operations Handoffs"><PageHeader eyebrow="Carry context forward" title="Make every shift change clear and accountable" description="Record what happened, what remains unresolved, what was decided, and who owns the next action." action={<Link className="btn btn-ghost" href="/operations"><ArrowLeft size={16}/> Operations dashboard</Link>}/><div className="callout operations-disclaimer"><Info size={20}/><div><strong>Browser-local handoffs</strong><p>These prototype handoff logs are saved only in this browser and are not sent to employees or other locations.</p></div></div><OperationsHandoffManager/></AppShell>; }

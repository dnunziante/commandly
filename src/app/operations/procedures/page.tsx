import Link from "next/link";
import { ArrowLeft, Info } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { OperationsProcedureManager } from "@/components/operations-procedure-manager";
import { PageHeader } from "@/components/page-header";

export default function OperationsProceduresPage() {
  return <AppShell title="Operations Procedures"><PageHeader eyebrow="Standardize the work" title="Give every location one trusted way to operate" description="Find, review, and maintain clear step-by-step procedures for repeatable dealership operations." action={<Link className="btn btn-ghost" href="/operations"><ArrowLeft size={16}/> Operations dashboard</Link>}/><div className="callout operations-disclaimer"><Info size={20}/><div><strong>Browser-local procedure library</strong><p>Prototype changes are saved only in this browser and are not yet shared, approved, or connected to the Knowledge Base.</p></div></div><OperationsProcedureManager/></AppShell>;
}

import Link from "next/link";
import { ArrowLeft, Info } from "lucide-react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ExecutiveTargetEditor } from "@/components/executive-target-editor";
import { ExecutiveEscalationEditor } from "@/components/executive-escalation-editor";
import { PageHeader } from "@/components/page-header";
import { getExecutiveWorkspace } from "@/lib/executive/repository";
import { getExecutiveEscalationSettings } from "@/lib/executive/accountability-repository";

export default async function ExecutiveTargetSettingsPage() {
  const data = await getExecutiveWorkspace();
  const escalationSettings = await getExecutiveEscalationSettings();
  if (!data.canEditTargets) redirect("/executive");
  return <AppShell title="Executive Targets"><PageHeader eyebrow="Administrator settings" title="Define what needs leadership attention" description="Set organization-level targets and accountability rules used by the Executive Advisor’s transparent calculations." action={<Link className="btn btn-ghost" href="/executive"><ArrowLeft size={16}/> Command center</Link>}/><div className="callout executive-disclaimer"><Info size={20}/><div><strong>{data.persistence === "supabase" ? "Organization configuration" : "Prototype configuration"}</strong><p>{data.persistence === "supabase" ? "Saved settings apply only to this tenant. Source records and platform-wide methodology remain separate." : "Changes are temporary in local demo mode and do not update Supabase."}</p></div></div><div className="executive-settings-stack"><ExecutiveTargetEditor initialTargets={data.targets} persistence={data.persistence}/><ExecutiveEscalationEditor initialSettings={escalationSettings.settings} persistence={data.persistence}/></div></AppShell>;
}

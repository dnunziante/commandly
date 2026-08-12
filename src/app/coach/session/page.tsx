import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { CoachSession } from "@/components/coach-session";
import { PageHeader } from "@/components/page-header";
import { getCoachScenario } from "@/lib/coach/data";
import { getOrganizationLocations } from "@/lib/locations";

export default async function CoachSessionPage({ searchParams }: { searchParams: Promise<{ scenario?: string }> }) {
  const { scenario: scenarioId } = await searchParams;
  const result = await getCoachScenario(scenarioId);
  if (!result.scenario) return <AppShell title="Role-Play Session"><div className="card error-card"><h1>Scenario unavailable</h1><p>{result.error || "No published practice scenario is available."}</p><Link className="btn btn-primary" href="/coach/scenarios">Return to scenarios</Link></div></AppShell>;

  const scenario = result.scenario;
  const { locations } = await getOrganizationLocations();
  return <AppShell title="Role-Play Session"><PageHeader eyebrow={`${scenario.difficulty} · ${scenario.duration}`} title={scenario.title} description={`You are speaking with ${scenario.customer.toLowerCase()}. Choose the response that best advances a helpful, consultative conversation.`}/><CoachSession scenario={scenario} locations={locations}/></AppShell>;
}

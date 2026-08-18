import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { CoachSession } from "@/components/coach-session";
import { PageHeader } from "@/components/page-header";
import { getViewer } from "@/lib/auth/viewer";
import { getCoachLocationAccess } from "@/lib/coach/access";
import { getCoachScenario } from "@/lib/coach/data";

export default async function CoachSessionPage({ searchParams }: { searchParams: Promise<{ scenario?: string }> }) {
  const { scenario: scenarioId } = await searchParams;
  const result = await getCoachScenario(scenarioId);
  if (!result.scenario) return <AppShell title="Role-Play Session"><div className="card error-card"><h1>Scenario unavailable</h1><p>{result.error || "No published practice scenario is available."}</p><Link className="btn btn-primary" href="/coach/scenarios">Return to scenarios</Link></div></AppShell>;

  const scenario = result.scenario;
  const viewer = await getViewer();
  const locationAccess = viewer ? await getCoachLocationAccess(viewer) : { locations: [], selectedLocationId: null, canSelectLocation: false, scopeLabel: "Your practice", error: "Sign in to start a practice session." };
  return <AppShell title="Role-Play Session"><PageHeader eyebrow={`${scenario.difficulty} · ${scenario.duration}`} title={scenario.title} description={`You are speaking with ${scenario.customer.toLowerCase()}. Choose the response that best advances a helpful, consultative conversation.`}/><CoachSession scenario={scenario} locationAccess={locationAccess}/></AppShell>;
}

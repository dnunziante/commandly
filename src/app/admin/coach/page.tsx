import { Archive, CheckCircle2 } from "lucide-react";
import { AdminCoachRubricForm } from "@/components/admin-coach-rubric-form";
import { AdminCoachScenarioForm } from "@/components/admin-coach-scenario-form";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { getCoachScenarios } from "@/lib/coach/data";
import { updateCoachScenarioStatus } from "./actions";

export default async function AdminCoachPage() {
  const result = await getCoachScenarios({ includeDrafts: true });
  return <AppShell title="Admin · Sales Coach">
    <PageHeader eyebrow="Tenant coaching content" title="Practice scenarios" description="Create multi-round practice and configure transparent C.L.O.S.E.R. scoring for this workspace. Platform methodology remains separately controlled."/>
    {result.error && <div className="card error-card"><h2>Scenarios unavailable</h2><p>{result.error}</p></div>}
    <div className="admin-coach-layout">
      <AdminCoachScenarioForm demo={result.source === "demo"}/>
      <div className="coach-admin-stack">
        {result.scenarios.length > 0 && <AdminCoachRubricForm scenarios={result.scenarios} demo={result.source === "demo"}/>}
        <section className="card"><div className="metric-row"><h2>Workspace scenarios</h2><span className="badge blue">{result.scenarios.length} total</span></div>
          {result.scenarios.length ? <div className="table-wrap"><table className="table"><thead><tr><th>Scenario</th><th>Rounds</th><th>Status</th><th>Action</th></tr></thead><tbody>{result.scenarios.map((scenario) => <tr key={scenario.id}><td><strong>{scenario.title}</strong><small style={{ display: "block", color: "#68738a" }}>{scenario.category} · {scenario.difficulty}</small></td><td>{scenario.rounds.length}</td><td><span className={`badge ${scenario.status === "Draft" ? "amber" : scenario.status === "Archived" ? "" : "blue"}`}>{scenario.status}</span></td><td>{result.source === "demo" ? <small>Preview only</small> : <form action={updateCoachScenarioStatus}><input type="hidden" name="scenarioId" value={scenario.id}/><input type="hidden" name="status" value={scenario.status === "Published" ? "archived" : "published"}/><button className="btn btn-ghost danger-button" type="submit">{scenario.status === "Published" ? <><Archive size={14}/> Archive</> : <><CheckCircle2 size={14}/> Publish</>}</button></form>}</td></tr>)}</tbody></table></div> : <div className="output empty"><div><h3>No scenarios yet</h3><p>Add the first multi-round practice scenario for this organization.</p></div></div>}
        </section>
      </div>
    </div>
  </AppShell>;
}

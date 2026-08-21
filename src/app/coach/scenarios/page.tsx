import Link from "next/link";
import { ArrowRight, Clock3, Play, Users } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { getCoachScenarios } from "@/lib/coach/data";

export default async function CoachScenariosPage() {
  const result = await getCoachScenarios();
  return <AppShell title="Practice Scenarios"><PageHeader eyebrow="Scenario library" title="Choose a customer conversation to practice" description="Build confidence across realistic customer conversations and focused sales skills."/>
    {result.error && <div className="card error-card"><h2>Scenarios unavailable</h2><p>{result.error}</p></div>}
    <div className="coach-filter-bar card"><label><span className="label">Skill focus</span><select className="input" defaultValue="all"><option value="all">All scenarios</option><option>Objection handling</option><option>Product recommendation</option><option>Closing conversation</option></select></label><label><span className="label">Difficulty</span><select className="input" defaultValue="all"><option value="all">All levels</option><option>Foundational</option><option>Intermediate</option><option>Advanced</option></select></label><div><span className="label">Available</span><strong className="coach-result-count">{result.scenarios.length} scenarios</strong></div></div>
    {result.scenarios.length ? <div className="grid grid-3 coach-scenario-grid">{result.scenarios.map((scenario) => <article className="card coach-scenario" key={scenario.id}><div className="metric-row"><span className="badge blue">{scenario.difficulty}</span><span className="coach-duration"><Clock3 size={14}/> {scenario.duration}</span></div><h2>{scenario.title}</h2><p>{scenario.goal}</p><div className="coach-customer-line"><Users size={15}/><span>{scenario.customer}</span></div><div className="chips">{scenario.skills.map((skill) => <span className="chip" key={skill}>{skill}</span>)}</div><Link className="btn btn-secondary" href={`/coach/session?scenario=${scenario.slug}`}><Play size={15}/> Start scenario <ArrowRight size={15}/></Link></article>)}</div> : <div className="output empty"><div><h2>No practice scenarios yet</h2><p>Ask a workspace administrator to publish the first scenario.</p></div></div>}
  </AppShell>;
}

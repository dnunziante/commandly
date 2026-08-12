import Link from "next/link";
import { ArrowRight, BarChart3, CheckCircle2, Clock3, Lightbulb, Plus, UserRound } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { getImprovementWorkspace } from "@/lib/operations/improvement-repository";

export default async function ImprovementsPage() {
  const data = await getImprovementWorkspace();
  const processImprovements = data.items;
  const canManage = data.canManage;
  const open = processImprovements.filter((item) => !["Verified", "Closed"].includes(item.status)).length;
  const review = processImprovements.filter((item) => item.managerDecision === "Pending").length;
  const verified = processImprovements.filter((item) => ["Verified", "Closed"].includes(item.status)).length;
  return <AppShell title="Help Us Improve"><PageHeader eyebrow="Process improvement" title="Small observations can create meaningful change" description="Report a problem, suggest an improvement, and follow what happens next." action={<Link className="btn btn-primary" href="/operations/improvements/new"><Plus size={16}/> Help us improve</Link>}/>
    <div className="callout operations-disclaimer"><Lightbulb size={20}/><div><strong>Simple employee experience</strong><p>Describe what you noticed in everyday language. Managers will handle the improvement-method terminology and review steps.</p></div></div>
    {data.error && <p className="form-error">{data.error}</p>}
    <section className="grid grid-3"><div className="card"><div className="metric-row"><span>Open submissions</span><Clock3 size={18}/></div><div className="metric">{open}</div><p>Still moving through review or action</p></div><div className="card"><div className="metric-row"><span>Waiting for review</span><UserRound size={18}/></div><div className="metric">{review}</div><p>Ready for a manager decision</p></div><div className="card"><div className="metric-row"><span>Verified improvements</span><CheckCircle2 size={18}/></div><div className="metric">{verified}</div><p>Results confirmed and closed</p></div></section>
    {canManage && <div className="improvement-page-actions"><Link className="btn btn-secondary" href="/operations/improvements/review"><UserRound size={16}/> Manager review</Link><Link className="btn btn-ghost" href="/operations/improvements/dashboard"><BarChart3 size={16}/> Improvement dashboard</Link></div>}
    {processImprovements.length ? <section className="improvement-list" aria-label="Improvement submissions">{processImprovements.map((item) => <article className="card improvement-list-card" key={item.id}><div className="metric-row"><div className="operations-alert-badges"><span className={`badge ${item.kind === "Problem" ? "amber" : "blue"}`}>{item.kind === "Problem" ? "Problem reported" : "Improvement idea"}</span><span className="badge">{item.status}</span></div><small>{new Date(item.submittedAt).toLocaleDateString()}</small></div><h2>{item.title}</h2><p>{item.description}</p><div className="operations-assigned-meta"><span>{item.department}</span><span>{item.location}</span><span>{item.frequency}</span></div><div className="metric-row improvement-card-footer"><small>Submitted by {item.submittedBy}</small><Link className="text-button" href={`/operations/improvements/${item.id}`}>View progress <ArrowRight size={14}/></Link></div></article>)}</section> : <section className="card output empty"><div><Lightbulb size={28}/><h2>No submissions yet</h2><p>Report the first problem or improvement idea for your location.</p><Link className="btn btn-primary" href="/operations/improvements/new">Help us improve</Link></div></section>}
  </AppShell>;
}

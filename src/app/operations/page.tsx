import { AlertTriangle, BookOpenCheck, CheckCircle2, ClipboardCheck, Clock3, MapPin, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { operationsAlerts, operationsChecklists, operationsProcedures } from "@/lib/operations/data";

export default function OperationsDashboardPage() {
  const completedSteps = operationsChecklists.reduce((total, checklist) => total + checklist.completed, 0);
  const totalSteps = operationsChecklists.reduce((total, checklist) => total + checklist.total, 0);
  const completion = Math.round(completedSteps / totalSteps * 100);
  const needsAttention = operationsChecklists.filter((checklist) => checklist.status === "Needs attention").length;
  return <AppShell title="Operations Assistant">
    <PageHeader eyebrow="Run the day with confidence" title="Keep every location aligned and accountable" description="See today’s operational work, find the right procedure, and address exceptions before they become customer problems." />
    <div className="callout operations-disclaimer"><ShieldCheck size={20}/><div><strong>Operations prototype</strong><p>This milestone uses sample BGC workflows. It is not connected to live inventory, employees, schedules, or dealership systems.</p></div></div>
    <section className="grid grid-4 operations-metrics" aria-label="Operations summary">
      <div className="card"><div className="metric-row"><span>Today’s completion</span><span className="metric-icon"><CheckCircle2 size={18}/></span></div><div className="metric">{completion}%</div><span className="delta">{completedSteps} of {totalSteps} steps</span></div>
      <div className="card"><div className="metric-row"><span>Active checklists</span><span className="metric-icon"><ClipboardCheck size={18}/></span></div><div className="metric">{operationsChecklists.length}</div><span className="delta">Across sample locations</span></div>
      <div className={`card ${needsAttention ? "performance-attention" : ""}`}><div className="metric-row"><span>Needs attention</span><span className="metric-icon"><AlertTriangle size={18}/></span></div><div className="metric">{needsAttention}</div><span className="delta">Review before completion</span></div>
      <div className="card"><div className="metric-row"><span>Procedures</span><span className="metric-icon"><BookOpenCheck size={18}/></span></div><div className="metric">{operationsProcedures.length}</div><span className="delta">Approved sample guidance</span></div>
    </section>
    <div className="section-heading" id="checklists"><div><h2>Today’s checklists</h2><p>Sample assignments and completion status by location.</p></div></div>
    <section className="grid grid-3 operations-checklist-grid">{operationsChecklists.map((checklist) => { const progress = Math.round(checklist.completed / checklist.total * 100); return <article className="card operations-checklist" key={checklist.id}><div className="metric-row"><span className={`badge ${checklist.status === "Needs attention" ? "amber" : checklist.status === "Complete" ? "" : "blue"}`}>{checklist.status}</span><strong>{progress}%</strong></div><h2>{checklist.title}</h2><div className="operations-meta"><span><MapPin size={14}/>{checklist.location}</span><span><Clock3 size={14}/>Due {checklist.due}</span></div><p>Owner: <strong>{checklist.owner}</strong></p><div className="progress"><span style={{ width: `${progress}%` }}/></div><small>{checklist.completed} of {checklist.total} steps complete</small></article>; })}</section>
    <section className="operations-dashboard-grid">
      <div id="procedures"><div className="section-heading"><div><h2>Quick procedures</h2><p>Frequently needed operational guidance.</p></div></div><div className="card operations-procedure-list">{operationsProcedures.map((procedure) => <article key={procedure.title}><span className="metric-icon"><BookOpenCheck size={17}/></span><div><span className="badge blue">{procedure.category}</span><h3>{procedure.title}</h3><p>{procedure.owner} · {procedure.updated}</p></div></article>)}</div></div>
      <div id="alerts"><div className="section-heading"><div><h2>Operational alerts</h2><p>Exceptions that may require follow-up.</p></div></div>{operationsAlerts.length ? <div className="card operations-alert-list">{operationsAlerts.map((alert) => <article key={alert.title}><AlertTriangle size={20}/><div><span className="badge amber">{alert.level}</span><h3>{alert.title}</h3><p>{alert.detail}</p><small><MapPin size={13}/>{alert.location}</small></div></article>)}</div> : <div className="card output empty"><div><CheckCircle2 size={28}/><h2>No active alerts</h2><p>Nothing currently requires operational follow-up.</p></div></div>}</div>
    </section>
  </AppShell>;
}

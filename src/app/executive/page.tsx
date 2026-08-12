import Link from "next/link";
import { Activity, AlertTriangle, ArrowRight, Building2, CheckCircle2, CircleGauge, Crown, FileText, Info, SearchCheck, Settings, Target, TrendingUp, UsersRound } from "lucide-react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { ReportingPeriodSelector } from "@/components/reporting-period-selector";
import { ExecutiveReviewBoard } from "@/components/executive-review-board";
import { getExecutiveWorkspace } from "@/lib/executive/repository";

const metricIcons = [Target, UsersRound, TrendingUp, Activity] as const;

export default async function ExecutiveAdvisorPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const { period } = await searchParams;
  const data = await getExecutiveWorkspace(period);
  if (!data.canView) redirect("/dashboard");
  const { priorities } = data;
  return <AppShell title="Executive Advisor">
    <PageHeader eyebrow="Executive command center" title="See what matters, understand why, and decide what happens next" description="Bring sales, people, growth, and operations signals into one clear leadership view." action={<div className="executive-header-actions"><Link className="btn btn-ghost" href="/executive/trends"><TrendingUp size={16}/> Trends</Link><Link className="btn btn-ghost" href={`/executive/review?period=${data.reportingPeriod}`}><FileText size={16}/> Monthly review</Link><Link className="btn btn-ghost" href={`/executive/accountability?period=${data.reportingPeriod}`}><UsersRound size={16}/> Accountability</Link>{data.canEditTargets && <><Link className="btn btn-ghost" href="/admin/sales-results/quality"><SearchCheck size={16}/> Data quality</Link><Link className="btn btn-ghost" href="/admin/executive"><Settings size={16}/> Targets</Link></>}<Link className="btn btn-primary" href="#priorities"><Crown size={16}/> Review priorities</Link></div>}/>
    <div className="callout executive-disclaimer"><Info size={20}/><div><strong>{data.persistence === "supabase" ? "Protected organization rollup" : "Explainable prototype"}</strong><p>{data.persistence === "supabase" ? "Metrics use approved tenant records and organization targets. Unavailable measures are shown as unavailable; forecasting and OpenAI are not connected." : "This local demo uses temporary sample rollups. Every recommendation shows the signal behind it; forecasting and OpenAI are not connected."}</p></div></div>
    {data.error && <p className="form-error executive-data-error"><AlertTriangle size={15}/>Some source data could not be loaded: {data.error}</p>}
    <ReportingPeriodSelector action="/executive" periods={data.availablePeriods} selected={data.reportingPeriod} label="Sales reporting period"/>

    <section className="grid grid-4 executive-metrics" aria-label="Executive summary">
      {data.metrics.map((metric, index) => { const Icon = metricIcons[index]; return <article className="card" key={metric.label}><div className="metric-row"><span>{metric.label}</span><span className="metric-icon"><Icon size={18}/></span></div><div className="metric">{metric.value}</div><span className={`executive-context ${metric.tone}`}>{metric.context}</span></article>; })}
    </section>

    <section className="executive-layout" id="priorities">
      <div className="card executive-priorities"><div className="section-heading"><div><span className="badge blue">Leadership focus</span><h2>Recommended priorities</h2><p>Ranked by sample urgency, business impact, and distance from target.</p></div></div>{priorities.length ? <div className="executive-priority-list">{priorities.map((priority) => <article key={priority.id}><span className="executive-rank">{priority.rank}</span><div><div className="metric-row"><span className="badge">{priority.area}</span><span className={`badge ${priority.urgency === "Act now" ? "amber" : "blue"}`}>{priority.urgency}</span></div><h3>{priority.title}</h3><p><strong>Why:</strong> {priority.reason}</p><p><strong>Next action:</strong> {priority.action}</p><Link className="text-button" href={priority.href}>Open source area <ArrowRight size={14}/></Link></div></article>)}</div> : <div className="output empty"><CheckCircle2 size={28}/><h2>No leadership priorities</h2><p>New priorities will appear when a metric falls outside its configured target.</p></div>}</div>
      <aside className="executive-side-stack">
        <div className="card"><div className="metric-row"><h2>Key risks</h2><AlertTriangle size={19}/></div>{data.risks.length ? <div className="executive-risk-list">{data.risks.map((risk) => <Link href={risk.href} key={risk.title}><span><strong>{risk.title}</strong><small>{risk.owner} · {risk.due}</small></span><ArrowRight size={15}/></Link>)}</div> : <p className="executive-empty-note">No high-severity risks exceed the configured limit.</p>}</div>
        <div className="card"><div className="metric-row"><h2>What is working</h2><CheckCircle2 size={19}/></div>{data.wins.length ? <ul className="executive-win-list">{data.wins.map((win) => <li key={win}>{win}</li>)}</ul> : <p className="executive-empty-note">A win appears when a connected measure reaches its target or an improvement result is verified.</p>}</div>
      </aside>
    </section>

    {data.canManageReviews && <ExecutiveReviewBoard period={data.reportingPeriod} persistence={data.persistence} priorities={priorities} reviews={data.reviews}/>}

    <section className="card executive-scorecard"><div className="section-heading"><div><span className="badge blue">Business scorecard</span><h2>Performance against {data.persistence === "supabase" ? "organization" : "sample"} targets</h2><p>Targets are visible so leaders can understand each status without a black-box score.</p></div></div>{data.signals.length ? <div className="executive-signal-list">{data.signals.map((signal) => { const progress = Math.min(100, Math.round(signal.value / signal.target * 100)); return <Link href={signal.href} key={signal.label}><div><strong>{signal.label}</strong><small>{signal.value}{signal.unit} of {signal.target}{signal.unit} target</small></div><div className="progress"><span style={{ width: `${progress}%` }}/></div><b>{progress}%</b></Link>; })}</div> : <div className="output empty"><CircleGauge size={28}/><h2>No connected scorecard data</h2><p>Complete coaching sessions, growth tasks, or operations checklists to begin the organization scorecard.</p></div>}</section>

    <section className="card executive-locations"><div className="section-heading"><div><span className="badge blue">Location comparison</span><h2>Where leadership attention is needed</h2><p>{data.persistence === "supabase" ? "Each measure uses only records assigned to that tenant location. A dash means no qualifying location-scoped data exists." : "Sample comparisons use the same five dimensions for every location."}</p></div><Building2 size={22}/></div>{data.locations.length ? <div className="executive-table-scroll"><table><thead><tr><th>Location</th><th>Sales pace</th><th>Coaching</th><th>Growth</th><th>Operations</th><th>Open risks</th><th>Signal</th></tr></thead><tbody>{data.locations.map((location) => <tr key={location.location}><td><strong>{location.location}</strong></td><td>{location.salesPace === null ? "—" : `${location.salesPace}%`}</td><td>{location.coachingCompletion === null ? "—" : `${location.coachingCompletion}%`}</td><td>{location.growthCompletion === null ? "—" : `${location.growthCompletion}%`}</td><td>{location.operationsCompletion === null ? "—" : `${location.operationsCompletion}%`}</td><td>{location.openRisks}</td><td><span className={`badge ${location.signal === "Needs attention" ? "amber" : "blue"}`}>{location.signal}</span></td></tr>)}</tbody></table></div> : <div className="output empty"><Building2 size={28}/><h2>No locations configured</h2><p>Location comparisons appear after locations are added to the tenant workspace.</p></div>}</section>

    <div className="card executive-method"><CircleGauge size={20}/><div><strong>How this dashboard decides</strong><p>“Act now” appears when open high or critical alerts exceed the tenant’s risk limit. “This week” appears when a connected completion measure is below its configured target. Missing data never creates a recommendation.</p></div></div>
  </AppShell>;
}

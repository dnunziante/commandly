import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, ClipboardList, FileText, Info, Scale, UsersRound } from "lucide-react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { ReportingPeriodSelector } from "@/components/reporting-period-selector";
import { getMonthlyLeadershipReview } from "@/lib/executive/monthly-review-repository";
import { MonthlyReviewControls } from "@/components/monthly-review-controls";

const periodName = (period: string) => new Date(`${period}-01T12:00:00`).toLocaleDateString(undefined, { month: "long", year: "numeric" });

export default async function MonthlyLeadershipReviewPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const { period } = await searchParams;
  const data = await getMonthlyLeadershipReview(period);
  if (!data.canView) redirect("/dashboard");
  const { workspace, accountability, decisionLog } = data;
  const outcomes = decisionLog.decisions.filter((decision) => decision.measuredOutcome.trim());
  return <AppShell title="Monthly Leadership Review">
    <PageHeader eyebrow="Executive Advisor" title={`${periodName(data.reportingPeriod)} leadership review`} description="One explainable meeting view assembled from approved metrics, accountability records, and recorded decision outcomes." action={<Link className="btn btn-secondary" href={`/executive?period=${data.reportingPeriod}`}><ArrowRight size={16}/> Command center</Link>}/>
    <div className="callout executive-disclaimer"><Info size={20}/><div><strong>{data.persistence === "supabase" ? "Protected organization review" : "Explainable demo review"}</strong><p>This summary only organizes existing records. It does not forecast, infer missing results, or use OpenAI.</p></div></div>
    {data.error && <p className="form-error executive-data-error"><AlertTriangle size={15}/>Some source data could not be loaded: {data.error}</p>}
    <ReportingPeriodSelector action="/executive/review" periods={data.availablePeriods} selected={data.reportingPeriod}/>
    <MonthlyReviewControls period={data.reportingPeriod} initial={data.completion}/>

    <section className="grid grid-4 executive-metrics" aria-label="Monthly business snapshot">{workspace.metrics.map((metric) => <article className="card" key={metric.label}><span>{metric.label}</span><div className="metric">{metric.value}</div><span className={`executive-context ${metric.tone}`}>{metric.context}</span></article>)}</section>

    <section className="leadership-review-layout">
      <article className="card leadership-agenda"><div className="metric-row"><div><span className="badge blue">Meeting agenda</span><h2>Items requiring leadership attention</h2></div><ClipboardList size={21}/></div>{data.agenda.length ? <ol>{data.agenda.map((item) => <li key={item.title}><div><strong>{item.title}</strong><p>{item.explanation}</p></div><Link className="text-button" href={`${item.href}?period=${data.reportingPeriod}`}>Review <ArrowRight size={14}/></Link></li>)}</ol> : <div className="output empty"><CheckCircle2 size={28}/><h2>No exceptions to review</h2><p>No current records created a leadership agenda item for this period.</p></div>}</article>
      <aside className="card leadership-accountability"><div className="metric-row"><h2>Accountability</h2><UsersRound size={20}/></div><div className="leadership-summary-grid"><span><strong>{accountability.summary.active}</strong><small>Active</small></span><span><strong>{accountability.summary.overdue}</strong><small>Overdue</small></span><span><strong>{accountability.summary.unassigned}</strong><small>Unassigned</small></span><span><strong>{accountability.summary.completionRate}%</strong><small>Completed</small></span></div><Link className="text-button" href={`/executive/accountability?period=${data.reportingPeriod}`}>Open accountability <ArrowRight size={14}/></Link></aside>
    </section>

    <section className="leadership-review-columns">
      <article className="card"><div className="metric-row"><div><span className="badge blue">Decisions</span><h2>Decisions and measured outcomes</h2></div><Scale size={20}/></div>{decisionLog.decisions.length ? <div className="leadership-record-list">{decisionLog.decisions.map((decision) => <div key={decision.id}><span className={`badge ${decision.status === "open" ? "amber" : "blue"}`}>{decision.status}</span><strong>{decision.title}</strong><p>{decision.decision}</p><small>{decision.measuredOutcome || `Expected: ${decision.expectedOutcome}`}</small></div>)}</div> : <p className="executive-empty-note">No decisions were recorded for this period.</p>}<Link className="text-button" href={`/executive/decisions?period=${data.reportingPeriod}`}>Open decision log <ArrowRight size={14}/></Link></article>
      <article className="card"><div className="metric-row"><div><span className="badge blue">Results</span><h2>Verified progress and risks</h2></div><FileText size={20}/></div><h3>Measured outcomes</h3>{outcomes.length ? <ul className="executive-win-list">{outcomes.map((item) => <li key={item.id}>{item.measuredOutcome}</li>)}</ul> : <p className="executive-empty-note">No measured decision outcomes have been recorded for this period.</p>}<h3>What is working</h3>{workspace.wins.length ? <ul className="executive-win-list">{workspace.wins.map((win) => <li key={win}>{win}</li>)}</ul> : <p className="executive-empty-note">No connected measure has reached its target yet.</p>}<h3>Open risks</h3>{workspace.risks.length ? <ul className="executive-win-list">{workspace.risks.map((risk) => <li key={risk.title}>{risk.title} — {risk.owner}</li>)}</ul> : <p className="executive-empty-note">No high-severity risks exceed the configured limit.</p>}</article>
    </section>
  </AppShell>;
}

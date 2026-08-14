import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, CircleGauge, Info, ListChecks } from "lucide-react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { ReportingPeriodSelector } from "@/components/reporting-period-selector";
import { getExecutiveReadiness } from "@/lib/executive/readiness-repository";

export default async function ExecutiveReadinessPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const { period } = await searchParams;
  const data = await getExecutiveReadiness(period);
  if (!data.canView) redirect("/dashboard");
  const required = data.checks.filter((check) => check.required);
  const practices = data.checks.filter((check) => !check.required);
  return <AppShell title="Executive Data Readiness">
    <PageHeader eyebrow="Executive Advisor" title="Know what must be completed before trusting the report" description="A deterministic checklist of the tenant records required for dependable monthly leadership reporting." action={<div className="executive-header-actions">{data.canManageSetup && <Link className="btn btn-primary" href={`/admin/executive/setup?period=${data.reportingPeriod}`}><ListChecks size={16}/> Guided setup</Link>}<Link className="btn btn-secondary" href="/executive"><ArrowRight size={16}/> Command center</Link></div>}/>
    <div className="callout executive-disclaimer"><Info size={20}/><div><strong>{data.persistence === "supabase" ? "Live tenant readiness" : "Explainable demo readiness"}</strong><p>This checklist reports missing or incomplete source records. It does not estimate data quality, forecast results, or use OpenAI.</p></div></div>
    {data.error && <p className="form-error executive-data-error"><AlertTriangle size={15}/>Some readiness checks could not be completed: {data.error}</p>}
    <ReportingPeriodSelector action="/executive/readiness" periods={data.availablePeriods} selected={data.reportingPeriod}/>
    <section className="readiness-summary"><article className="card readiness-score"><CircleGauge size={26}/><div><span>Required-source readiness</span><strong>{data.score}%</strong><small>{data.readyRequired} of {data.requiredTotal} required checks ready</small></div></article><article className="card"><span>Missing sales approvals</span><div className="metric">{data.missingSales}</div><small>Active locations in this period</small></article><article className="card"><span>Missing operations coverage</span><div className="metric">{data.missingOperations}</div><small>Active locations without checklist data</small></article></section>
    <ReadinessGroup title="Required reporting sources" description="All six checks should be ready before leaders rely on the complete Executive rollup." checks={required} period={data.reportingPeriod}/>
    <ReadinessGroup title="Reporting practices" description="These checks strengthen comparison history and meeting accountability but do not create source metrics." checks={practices} period={data.reportingPeriod}/>
    <div className="card executive-method"><ListChecks size={20}/><div><strong>How readiness is calculated</strong><p>The percentage counts only required source checks: locations, approved monthly sales, tenant targets, Coaching assignments, Growth assignments, and Operations location coverage. Reporting practices are shown separately and do not inflate the score.</p></div></div>
  </AppShell>;
}

function ReadinessGroup({ title, description, checks, period }: { title: string; description: string; checks: Awaited<ReturnType<typeof getExecutiveReadiness>>["checks"]; period: string }) {
  return <section className="card readiness-group"><div className="section-heading"><div><span className="badge blue">Data readiness</span><h2>{title}</h2><p>{description}</p></div></div><div className="readiness-list">{checks.map((check) => <article className={check.ready ? "ready" : "attention"} key={check.id}><span className="readiness-icon">{check.ready ? <CheckCircle2 size={20}/> : <AlertTriangle size={20}/>}</span><div><div className="metric-row"><h3>{check.title}</h3><span className={`badge ${check.ready ? "blue" : "amber"}`}>{check.ready ? "Ready" : "Action needed"}</span></div><p>{check.explanation}</p>{!check.ready && <small><strong>Next step:</strong> {check.action}</small>}</div><Link className="text-button" href={`${check.href}${check.href.includes("?") ? "&" : "?"}period=${period}`}>Open source <ArrowRight size={14}/></Link></article>)}</div></section>;
}

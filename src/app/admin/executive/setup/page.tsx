import Link from "next/link";
import { AlertTriangle, ArrowRight, Check, CheckCircle2, Circle, Info, ListChecks } from "lucide-react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { ReportingPeriodSelector } from "@/components/reporting-period-selector";
import { canManageExecutiveTargets } from "@/lib/auth/permissions";
import { getViewer } from "@/lib/auth/viewer";
import { getExecutiveReadiness } from "@/lib/executive/readiness-repository";
import { buildExecutiveSetupSequence } from "@/lib/executive/setup-sequence";

export default async function ExecutiveSetupPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const [{ period }, viewer] = await Promise.all([searchParams, getViewer()]);
  if (!viewer || !canManageExecutiveTargets(viewer.role)) redirect("/executive/readiness");
  const data = await getExecutiveReadiness(period);
  const steps = buildExecutiveSetupSequence(data.checks);
  const current = steps.find((step) => step.state === "current");
  const complete = steps.filter((step) => step.state === "complete").length;
  return <AppShell title="Executive Setup Guide">
    <PageHeader eyebrow="Administrator setup" title="Prepare dependable Executive reporting step by step" description="Complete the required tenant configuration in order, then return here to confirm that every source is ready." action={<Link className="btn btn-secondary" href={`/executive/readiness?period=${data.reportingPeriod}`}><ListChecks size={16}/> View readiness</Link>}/>
    <div className="callout executive-disclaimer"><Info size={20}/><div><strong>{data.persistence === "supabase" ? "Live tenant setup" : "Guided demo setup"}</strong><p>Each completed step is verified from existing records. The guide does not mark a step complete based only on a button click.</p></div></div>
    {data.error && <p className="form-error executive-data-error"><AlertTriangle size={15}/>Some setup checks could not be completed: {data.error}</p>}
    <ReportingPeriodSelector action="/admin/executive/setup" periods={data.availablePeriods} selected={data.reportingPeriod}/>
    <section className="card setup-progress"><div><span className="badge blue">Foundation progress</span><h2>{complete} of {steps.length} required steps complete</h2><p>{current ? `Start with: ${current.title}` : "All required reporting sources are ready for this period."}</p></div><div className="setup-progress-ring" style={{ "--setup-progress": `${data.score * 3.6}deg` } as React.CSSProperties}><span>{data.score}%</span></div></section>
    {current ? <section className="card setup-current"><span className="badge amber">Start here</span><h2>{current.title}</h2><p>{current.explanation}</p><div className="callout"><AlertTriangle size={18}/><div><strong>What to do</strong><p>{current.action}</p></div></div><Link className="btn btn-primary" href={`${current.href}?period=${data.reportingPeriod}`}>Open this setup step <ArrowRight size={16}/></Link></section> : <section className="card setup-complete"><CheckCircle2 size={34}/><div><span className="badge blue">Foundation ready</span><h2>Required Executive sources are complete</h2><p>Continue maintaining monthly approvals and complete each leadership review to preserve reporting reliability.</p></div><Link className="btn btn-primary" href={`/executive/review?period=${data.reportingPeriod}`}>Open monthly review <ArrowRight size={16}/></Link></section>}
    <section className="card setup-sequence"><div className="section-heading"><div><span className="badge blue">Required sequence</span><h2>Executive reporting foundation</h2><p>Completed steps remain visible. The first incomplete step is highlighted as the current action.</p></div></div><ol>{steps.map((step) => <li className={step.state} key={step.id}><span className="setup-step-marker">{step.state === "complete" ? <Check size={17}/> : step.state === "current" ? step.number : <Circle size={13}/>}</span><div><div className="metric-row"><h3>{step.title}</h3><span className={`badge ${step.state === "complete" ? "blue" : step.state === "current" ? "amber" : ""}`}>{step.state === "complete" ? "Complete" : step.state === "current" ? "Current step" : "Upcoming"}</span></div><p>{step.explanation}</p>{step.state !== "complete" && <small>{step.action}</small>}</div><Link className="text-button" href={`${step.href}?period=${data.reportingPeriod}`}>{step.state === "complete" ? "Review" : "Open step"} <ArrowRight size={14}/></Link></li>)}</ol></section>
  </AppShell>;
}

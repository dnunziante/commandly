"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, CalendarClock, CheckCircle2, CircleDashed, ClipboardList, Gauge, LoaderCircle, Target } from "lucide-react";
import { useEffect, useState } from "react";
import type { GrowthPlan } from "@/lib/growth/data";
import { calculateGrowthPerformance } from "@/lib/growth/performance";
import { formatGrowthDate, readGrowthPlans } from "@/lib/growth/storage";

export function GrowthPerformanceDashboard({ initialPlans, persistence, initialError = "" }: { initialPlans: GrowthPlan[]; persistence: "demo" | "supabase"; initialError?: string }) {
  const [plans, setPlans] = useState<GrowthPlan[] | null>(persistence === "supabase" ? initialPlans : null);
  const [error, setError] = useState(initialError);
  useEffect(() => { if (persistence === "supabase") return; const timer = window.setTimeout(() => { try { setPlans(readGrowthPlans()); } catch { setError("Growth performance could not be loaded from this browser."); } }, 0); return () => window.clearTimeout(timer); }, [persistence]);
  if (error) return <div className="card error-card growth-plan-state"><AlertTriangle size={22}/><div><h2>Performance unavailable</h2><p>{error}</p></div></div>;
  if (plans === null) return <div className="card growth-plan-state"><LoaderCircle className="spin" size={22}/><div><h2>Loading performance</h2><p>Reviewing saved plans and task progress.</p></div></div>;
  if (!plans.length) return <div className="card output empty"><div><ClipboardList size={28}/><h2>No performance data yet</h2><p>Create an action plan to begin tracking ownership, deadlines, and execution.</p><Link className="btn btn-primary" href="/growth">Explore opportunities</Link></div></div>;
  const performance = calculateGrowthPerformance(plans);
  const pipeline = [["Not started", performance.notStartedPlans], ["In progress", performance.inProgressPlans], ["Complete", performance.completedPlans]] as const;
  return <>
    <section className="grid grid-4 growth-performance-metrics" aria-label="Growth performance summary">
      <div className="card"><div className="metric-row"><span>Active plans</span><span className="metric-icon"><Target size={18}/></span></div><div className="metric">{performance.activePlans}</div><span className="delta">{performance.onTrackPlans} on track</span></div>
      <div className="card"><div className="metric-row"><span>Task completion</span><span className="metric-icon"><Gauge size={18}/></span></div><div className="metric">{performance.taskCompletion}%</div><span className="delta">{performance.completedTasks} of {performance.totalTasks} steps</span></div>
      <div className="card"><div className="metric-row"><span>Completed plans</span><span className="metric-icon"><CheckCircle2 size={18}/></span></div><div className="metric">{performance.completedPlans}</div><span className="delta">{performance.totalPlans} total plans</span></div>
      <div className={`card ${performance.overduePlans ? "performance-attention" : ""}`}><div className="metric-row"><span>Overdue plans</span><span className="metric-icon"><CalendarClock size={18}/></span></div><div className="metric">{performance.overduePlans}</div><span className="delta">Excludes completed work</span></div>
    </section>
    <section className="growth-performance-grid">
      <div className="card"><div className="performance-card-heading"><div><h2>Plan pipeline</h2><p>Where current growth work stands.</p></div><CircleDashed size={20}/></div><div className="performance-pipeline">{pipeline.map(([label, count]) => { const percent = Math.round(count / performance.totalPlans * 100); return <div key={label}><span><strong>{label}</strong><small>{count} {count === 1 ? "plan" : "plans"}</small></span><div className="progress"><span style={{ width: `${percent}%` }}/></div><b>{percent}%</b></div>; })}</div></div>
      <div className="card performance-results"><div className="performance-card-heading"><div><h2>Verified business results</h2><p>Actual outcomes entered against growth plans.</p></div><Target size={20}/></div>{performance.outcomeEntries ? <div className="performance-outcome-grid"><span><small>Leads</small><strong>{performance.leads}</strong></span><span><small>Appointments</small><strong>{performance.appointments}</strong></span><span><small>Revenue</small><strong>${performance.revenue.toLocaleString()}</strong></span><span><small>Cost</small><strong>${performance.cost.toLocaleString()}</strong></span><span><small>ROI</small><strong>{performance.roi === null ? "Not available" : `${performance.roi}%`}</strong></span><span><small>Entries</small><strong>{performance.outcomeEntries}</strong></span></div> : <div className="performance-empty-result"><CircleDashed size={28}/><strong>No verified outcomes recorded</strong><p>Open an action plan to enter actual leads, appointments, revenue, costs, and verification notes. No results are inferred from task completion.</p></div>}</div>
    </section>
    <div className="section-heading"><div><h2>Progress by opportunity</h2><p>Execution health across every saved action plan.</p></div><Link className="text-button" href="/growth/plans">View all plans <ArrowRight size={15}/></Link></div>
    <section className="card performance-plan-list" aria-label="Action plan performance">{performance.planPerformance.map(({ plan, completedTasks, totalTasks, progress, overdue }) => <article key={plan.id}><div className="performance-plan-title"><span className={`badge ${overdue ? "amber" : plan.status === "Complete" ? "" : "blue"}`}>{overdue ? "Overdue" : plan.status}</span><div><h3>{plan.title}</h3><p>{plan.owner} · Target {formatGrowthDate(plan.targetDate)}</p></div></div><div className="performance-plan-measure"><small>Success measure</small><strong>{plan.targetMeasure || "Not defined"}</strong></div><div className="performance-plan-progress"><span><strong>{progress}%</strong><small>{completedTasks} of {totalTasks} steps</small></span><div className="progress"><span style={{ width: `${progress}%` }}/></div></div><Link className="text-button" href={`/growth/opportunities/${plan.opportunitySlug}`}>Open plan <ArrowRight size={15}/></Link></article>)}</section>
  </>;
}

"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, ClipboardList, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import type { GrowthPlan } from "@/lib/growth/data";
import { formatGrowthDate, readGrowthPlans } from "@/lib/growth/storage";

export function GrowthPlanList({ initialPlans, persistence, initialError = "" }: { initialPlans: GrowthPlan[]; persistence: "demo" | "supabase"; initialError?: string }) {
  const [plans, setPlans] = useState<GrowthPlan[] | null>(persistence === "supabase" ? initialPlans : null);
  const [error, setError] = useState(initialError);
  useEffect(() => { if (persistence === "supabase") return; const timer = window.setTimeout(() => { try { setPlans(readGrowthPlans()); } catch { setError("Saved plans could not be loaded from this browser."); } }, 0); return () => window.clearTimeout(timer); }, [persistence]);
  if (error) return <div className="card error-card growth-plan-state"><AlertTriangle size={22}/><div><h2>Plans unavailable</h2><p>{error}</p></div></div>;
  if (plans === null) return <div className="card growth-plan-state"><LoaderCircle className="spin" size={22}/><div><h2>Loading action plans</h2><p>Checking this browser for saved prototype data.</p></div></div>;
  if (!plans.length) return <div className="card output empty"><div><ClipboardList size={28}/><h2>No action plans yet</h2><p>Choose a growth opportunity and create the first validation plan.</p><Link className="btn btn-primary" href="/growth">Explore opportunities</Link></div></div>;
  return <div className="grid grid-3">{plans.map((plan) => { const completed = plan.tasks.filter((task) => task.complete).length; const progress = Math.round(completed / plan.tasks.length * 100); return <article className="card growth-plan-card" key={plan.id}><div className="metric-row"><span className={`badge ${plan.status === "Complete" ? "" : "blue"}`}>{plan.status}</span><strong>{progress}%</strong></div><h2>{plan.title}</h2><p>{plan.owner} · Target {formatGrowthDate(plan.targetDate)}</p><div className="progress"><span style={{ width: `${progress}%` }}/></div><small><CheckCircle2 size={13}/>{completed} of {plan.tasks.length} steps complete</small><Link className="text-button" href={`/growth/opportunities/${plan.opportunitySlug}`}>Open action plan <ArrowRight size={15}/></Link></article>; })}</div>;
}

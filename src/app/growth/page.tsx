import { BarChart3, Compass, Lightbulb, Target } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { GrowthOpportunityBoard } from "@/components/growth-opportunity-board";
import { PageHeader } from "@/components/page-header";
import { getGrowthScoring } from "@/lib/growth/scoring";

export default async function GrowthAdvisorPage() {
  const scoring = await getGrowthScoring();
  const growthOpportunities = scoring.opportunities;
  const highImpact = growthOpportunities.filter((item) => item.impact === "High").length;
  const ready = growthOpportunities.filter((item) => item.status === "Ready to review").length;
  return <AppShell title="Business Growth Advisor">
    <PageHeader eyebrow="Explore where to grow" title="Turn possibilities into focused action" description="Review practical growth opportunities, compare effort and potential impact, and decide what deserves a closer look." />
    <div className="callout growth-disclaimer"><Lightbulb size={20}/><div><strong>Prototype insights</strong><p>These are simulated BGC examples for planning the experience. They are not based on live market data, verified demand, or AI analysis.</p></div></div>
    <div className="grid grid-3 growth-metrics"><div className="card"><div className="metric-row"><span>Sample opportunities</span><span className="metric-icon"><Compass size={18}/></span></div><div className="metric">{growthOpportunities.length}</div><span className="delta">Across five growth areas</span></div><div className="card"><div className="metric-row"><span>High potential</span><span className="metric-icon"><Target size={18}/></span></div><div className="metric">{highImpact}</div><span className="delta">Needs validation</span></div><div className="card"><div className="metric-row"><span>Ready to review</span><span className="metric-icon"><BarChart3 size={18}/></span></div><div className="metric">{ready}</div><span className="delta">No work started</span></div></div>
    <div className="section-heading"><div><h2>Opportunity board</h2><p>Start with a focused idea, then validate it before committing resources.</p></div></div>
    <GrowthOpportunityBoard opportunities={growthOpportunities} weights={scoring.weights}/>
  </AppShell>;
}

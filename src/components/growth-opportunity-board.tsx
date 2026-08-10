"use client";

import Link from "next/link";
import { ArrowRight, Filter, Lightbulb, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { calculateGrowthPriority, growthCategories, growthPriorityLabel, type GrowthOpportunity, type GrowthScoreWeights } from "@/lib/growth/data";

export function GrowthOpportunityBoard({ opportunities, weights }: { opportunities: GrowthOpportunity[]; weights: GrowthScoreWeights }) {
  const [category, setCategory] = useState("All opportunities");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("Priority score");
  const visible = useMemo(() => opportunities.filter((item) => (category === "All opportunities" || item.category === category) && `${item.title} ${item.summary}`.toLowerCase().includes(query.toLowerCase())).sort((a, b) => sort === "Priority score" ? calculateGrowthPriority(b.score, weights) - calculateGrowthPriority(a.score, weights) : a.title.localeCompare(b.title)), [category, opportunities, query, sort, weights]);
  return <>
    <section className="card growth-filter" aria-label="Opportunity filters">
      <label><span className="label"><Search size={14}/> Search opportunities</span><input className="input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search sample ideas" /></label>
      <label><span className="label"><Filter size={14}/> Category</span><select className="input" value={category} onChange={(event) => setCategory(event.target.value)}>{growthCategories.map((item) => <option key={item}>{item}</option>)}</select></label>
      <label><span className="label">Sort by</span><select className="input" value={sort} onChange={(event) => setSort(event.target.value)}><option>Priority score</option><option>Opportunity name</option></select></label>
      <strong className="growth-result-count">{visible.length} {visible.length === 1 ? "opportunity" : "opportunities"}</strong>
    </section>
    {visible.length ? <div className="grid grid-3 growth-grid">{visible.map((item) => <article className="card growth-card" key={item.slug}>
      <div className="metric-row"><span className="badge blue">{item.category}</span><span className="growth-priority-score"><strong>{calculateGrowthPriority(item.score, weights)}</strong><small>{growthPriorityLabel(calculateGrowthPriority(item.score, weights))}</small></span></div>
      <span className="metric-icon"><Lightbulb size={18}/></span><h2>{item.title}</h2><p>{item.summary}</p>
      <div className="growth-facts"><span><small>Impact</small><strong>{item.impact}</strong></span><span><small>Effort</small><strong>{item.effort}</strong></span><span><small>Timeframe</small><strong>{item.timeframe}</strong></span></div>
      <Link className="text-button" href={`/growth/opportunities/${item.slug}`}>Review opportunity <ArrowRight size={15}/></Link>
    </article>)}</div> : <div className="card output empty"><div><h2>No matching opportunities</h2><p>Clear the search or choose another category.</p><button className="btn btn-secondary" onClick={() => { setQuery(""); setCategory("All opportunities"); }}>Clear filters</button></div></div>}
  </>;
}

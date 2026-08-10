"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpDown } from "lucide-react";
import { useMemo, useState } from "react";
import { calculateGrowthPriority, growthPriorityLabel, type GrowthOpportunity, type GrowthScore, type GrowthScoreWeights } from "@/lib/growth/data";

const dimensions: Array<[keyof GrowthScore, string]> = [["impact", "Impact"], ["effort", "Effort"], ["confidence", "Confidence"], ["cost", "Cost"], ["risk", "Risk"], ["alignment", "Alignment"]];

export function GrowthPriorityTable({ opportunities, weights }: { opportunities: GrowthOpportunity[]; weights: GrowthScoreWeights }) {
  const [sortKey, setSortKey] = useState<"priority" | keyof GrowthScore>("priority");
  const sorted = useMemo(() => [...opportunities].sort((a, b) => sortKey === "priority" ? calculateGrowthPriority(b.score, weights) - calculateGrowthPriority(a.score, weights) : b.score[sortKey] - a.score[sortKey]), [opportunities, sortKey, weights]);
  return <div className="card table-wrap"><table className="table growth-score-table"><thead><tr><th>Rank</th><th>Opportunity</th>{dimensions.map(([key, label]) => <th key={key}><button type="button" onClick={() => setSortKey(key)}>{label}<ArrowUpDown size={12}/></button></th>)}<th><button type="button" onClick={() => setSortKey("priority")}>Priority<ArrowUpDown size={12}/></button></th><th/></tr></thead><tbody>{sorted.map((item, index) => { const total = calculateGrowthPriority(item.score, weights); return <tr key={item.slug}><td><strong>#{index + 1}</strong></td><td><strong>{item.title}</strong><small>{item.category}</small></td>{dimensions.map(([key]) => <td key={key}><span className="score-dot">{item.score[key]}</span></td>)}<td><span className="growth-priority-score"><strong>{total}</strong><small>{growthPriorityLabel(total)}</small></span></td><td><Link className="text-button" href={`/growth/opportunities/${item.slug}`} aria-label={`Review ${item.title}`}><ArrowRight size={16}/></Link></td></tr>; })}</tbody></table></div>;
}

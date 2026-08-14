import Link from "next/link";
import { ArrowLeft, CalendarDays, MapPin, UserRound } from "lucide-react";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ImprovementWorkflow } from "@/components/improvement-workflow";
import { PageHeader } from "@/components/page-header";
import { getImprovement } from "@/lib/operations/improvement-repository";
import { processImprovements } from "@/lib/operations/improvements";

export function generateStaticParams() { return processImprovements.map((item) => ({ id: item.id })); }

export default async function ImprovementDetailPage({ params }: PageProps<"/operations/improvements/[id]">) {
  const { id } = await params;
  const data = await getImprovement(id);
  const item = data.item;
  if (!item) notFound();
  const canManage = data.canManage;
  return <AppShell title="Process Improvement"><PageHeader eyebrow="Improvement record" title={item.title} description={item.description} action={<Link className="btn btn-ghost" href="/operations/improvements"><ArrowLeft size={16}/> All submissions</Link>}/>
    <section className="card improvement-summary"><div className="metric-row"><div className="operations-alert-badges"><span className={`badge ${item.kind === "Problem" ? "amber" : "blue"}`}>{item.kind}</span><span className="badge">{item.status}</span></div><strong>{item.managerDecision}</strong></div><div className="improvement-rating-row"><span><small>Department</small><strong>{item.department}</strong></span><span><small>Frequency</small><strong>{item.frequency}</strong></span><span><small>Impact</small><strong>{item.impact}</strong></span><span><small>Urgency</small><strong>{item.urgency}</strong></span></div><div className="operations-assigned-meta"><span><MapPin size={14}/>{item.location}</span><span><UserRound size={14}/>{item.submittedBy}</span><span><CalendarDays size={14}/>{new Date(item.submittedAt).toLocaleDateString()}</span></div></section>
    {canManage ? <ImprovementWorkflow improvement={item} persistence={data.persistence}/> : <section className="card improvement-success"><span className="badge blue">Current status</span><h2>{item.status}</h2><p>{item.managerDecision === "Pending" ? "A manager will review this submission and update the next step." : item.managerNote || "The improvement team will keep this record updated as work progresses."}</p>{item.owner !== "Unassigned" && <p><strong>Owner:</strong> {item.owner}{item.dueDate ? ` · Target ${item.dueDate}` : ""}</p>}</section>}
  </AppShell>;
}

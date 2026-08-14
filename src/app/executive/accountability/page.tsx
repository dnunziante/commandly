import Link from "next/link";
import { AlertTriangle, BellRing, CalendarClock, CheckCircle2, ClipboardList, History, Settings, UserRoundX } from "lucide-react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { ReportingPeriodSelector } from "@/components/reporting-period-selector";
import { executiveReviewStatusLabel } from "@/lib/executive/accountability";
import { getExecutiveAccountability } from "@/lib/executive/accountability-repository";

const dateLabel = (value: string) => value ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(`${value}T12:00:00`)) : "No due date";
const timeLabel = (value: string) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));

export default async function ExecutiveAccountabilityPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const { period } = await searchParams;
  const data = await getExecutiveAccountability(period);
  if (!data.canView) redirect("/dashboard");
  const cards = [
    ["Active ownership", data.summary.active, "Acknowledged or in progress", ClipboardList],
    ["Completed", data.summary.completed, `${data.summary.completionRate}% of reviewed priorities`, CheckCircle2],
    ["Overdue", data.summary.overdue, "Past due and still active", CalendarClock],
    ["Unassigned", data.summary.unassigned, "Needs a named owner", UserRoundX],
  ] as const;
  return <AppShell title="Executive Accountability">
    <PageHeader eyebrow="Executive Advisor" title="Turn leadership priorities into accountable action" description="See ownership, due dates, completion, notices, and the full review trail for one reporting period." action={<Link className="btn btn-ghost" href="/admin/executive"><Settings size={16}/> Notice rules</Link>}/>
    {data.error && <p className="form-error executive-data-error"><AlertTriangle size={15}/>Some accountability data could not be loaded: {data.error}</p>}
    <ReportingPeriodSelector action="/executive/accountability" periods={data.availablePeriods} selected={data.reportingPeriod} label="Accountability period"/>
    <section className="grid grid-4 executive-metrics" aria-label="Accountability summary">{cards.map(([label, value, context, Icon]) => <article className="card" key={label}><div className="metric-row"><span>{label}</span><span className="metric-icon"><Icon size={18}/></span></div><div className="metric">{value}</div><span className="executive-context neutral">{context}</span></article>)}</section>
    <section className="card executive-notifications"><div className="section-heading"><div><span className="badge blue">In-app notification queue</span><h2>Reminders and escalations</h2><p>{data.settings.enabled ? `Reminders begin ${data.settings.remindBeforeDays} days before due; escalation begins after ${data.settings.escalateAfterDays} overdue days.` : "Accountability notices are disabled for this organization."}</p></div><BellRing size={22}/></div>{data.notifications.length ? <div className="executive-notification-list">{data.notifications.map((notice) => <article key={`${notice.priorityKey}-${notice.level}`} className={notice.level}><div><span className={`badge ${notice.level === "escalation" ? "amber" : "blue"}`}>{notice.title}</span><h3>{data.names[notice.priorityKey] ?? notice.priorityKey.replaceAll("-", " ")}</h3><p>{notice.explanation}</p></div><small><strong>{notice.ownerName}</strong>{notice.dueDate ? ` · Due ${dateLabel(notice.dueDate)}` : " · No due date"}</small></article>)}</div> : <div className="output empty executive-notification-empty"><CheckCircle2 size={28}/><h2>No notices require attention</h2><p>New notices appear automatically from active review owners and due dates.</p></div>}</section>
    <section className="card executive-accountability-table"><div className="section-heading"><div><span className="badge blue">Current accountability</span><h2>Priority owners and commitments</h2><p>The current review status for each priority in this period.</p></div></div>{data.reviews.length ? <div className="executive-table-scroll"><table><thead><tr><th>Priority</th><th>Status</th><th>Owner</th><th>Due</th><th>Last updated</th></tr></thead><tbody>{data.reviews.map((review) => <tr key={review.id}><td><strong>{data.names[review.priorityKey] ?? review.priorityKey.replaceAll("-", " ")}</strong></td><td><span className={`badge ${review.status === "completed" ? "blue" : review.status === "open" ? "amber" : ""}`}>{executiveReviewStatusLabel[review.status]}</span></td><td>{review.ownerName || "Unassigned"}</td><td>{dateLabel(review.dueDate)}</td><td>{timeLabel(review.updatedAt)}</td></tr>)}</tbody></table></div> : <div className="output empty"><ClipboardList size={28}/><h2>No priority reviews yet</h2><p>Review a recommended priority in the Command Center to begin accountability tracking.</p></div>}</section>
    <section className="card executive-history"><div className="section-heading"><div><span className="badge blue">Review trail</span><h2>Priority history</h2><p>Append-only changes recorded when a manager updates a review.</p></div><History size={22}/></div>{data.history.length ? <ol className="executive-history-list">{data.history.map((item, index) => <li key={`${item.id}-${item.changedAt}-${index}`}><span className="executive-history-dot"/><div><div className="metric-row"><strong>{data.names[item.priorityKey] ?? item.priorityKey.replaceAll("-", " ")}</strong><time>{timeLabel(item.changedAt)}</time></div><p>{item.previousStatus ? `${executiveReviewStatusLabel[item.previousStatus]} → ` : "Created as "}<b>{executiveReviewStatusLabel[item.status]}</b>{item.ownerName ? ` · ${item.ownerName}` : " · Unassigned"}</p>{item.reviewNote && <small>{item.reviewNote}</small>}</div></li>)}</ol> : <div className="output empty"><History size={28}/><h2>No history for this period</h2><p>Changes will appear here after a manager saves a priority review.</p></div>}</section>
  </AppShell>;
}

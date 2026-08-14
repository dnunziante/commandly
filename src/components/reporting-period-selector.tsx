import Link from "next/link";

export function ReportingPeriodSelector({ action, periods, selected, label = "Reporting period" }: { action: string; periods: string[]; selected: string; label?: string }) {
  return <form className="reporting-period-selector" action={action} method="get"><label><span className="label">{label}</span><select className="input" name="period" defaultValue={selected}>{periods.map((period) => <option key={period} value={period}>{new Date(`${period}-01T12:00:00`).toLocaleDateString(undefined, { month: "long", year: "numeric" })}</option>)}</select></label><button className="btn btn-secondary" type="submit">View period</button><Link className="text-button" href={action}>Current month</Link></form>;
}

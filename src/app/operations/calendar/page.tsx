import Link from "next/link";
import { ArrowLeft, Info } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { OperationsTaskCalendar } from "@/components/operations-task-calendar";
import { PageHeader } from "@/components/page-header";

export default function OperationsCalendarPage() {
  return <AppShell title="Operations Calendar"><PageHeader eyebrow="See the work by date" title="Keep scheduled, active, and overdue operations visible" description="Review checklist deadlines, alert due dates, and recurring schedule runs in one monthly view." action={<Link className="btn btn-ghost" href="/operations"><ArrowLeft size={16}/> Operations dashboard</Link>}/><div className="callout operations-disclaimer"><Info size={20}/><div><strong>Browser-local calendar</strong><p>This calendar reflects only sample and locally saved Operations records. It is not connected to employee calendars or notifications.</p></div></div><OperationsTaskCalendar/></AppShell>;
}

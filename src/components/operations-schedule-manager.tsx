"use client";

import Link from "next/link";
import { AlertTriangle, CalendarClock, CheckCircle2, CirclePause, ClipboardPlus, LoaderCircle, MapPin, Play, Plus, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { generateOperationsChecklist, saveOperationsSchedule, setOperationsScheduleStatus } from "@/app/operations/actions";
import type { OperationsChecklistRecord, OperationsProcedureRecord, OperationsScheduleRecord } from "@/lib/operations/data";
import { getNextScheduleDate } from "@/lib/operations/schedules";
import type { OperationsPersistence } from "@/lib/operations/repository";
import { formatOperationsDate, readOperationsChecklists, readOperationsProcedures, readOperationsSchedules, writeOperationsChecklists, writeOperationsSchedules } from "@/lib/operations/storage";

export function OperationsScheduleManager({ initialSchedules = [], initialProcedures = [], persistence = "demo", initialError = "" }: { initialSchedules?: OperationsScheduleRecord[]; initialProcedures?: OperationsProcedureRecord[]; persistence?: OperationsPersistence; initialError?: string }) {
  const publishedInitial = initialProcedures.filter((item) => item.status === "Published");
  const [schedules, setSchedules] = useState<OperationsScheduleRecord[] | null>(persistence === "supabase" ? initialSchedules : null);
  const [procedures, setProcedures] = useState<OperationsProcedureRecord[]>(persistence === "supabase" ? publishedInitial : []);
  const [procedureId, setProcedureId] = useState(publishedInitial[0]?.id ?? "");
  const [frequency, setFrequency] = useState<OperationsScheduleRecord["frequency"]>("Daily");
  const [location, setLocation] = useState("Charleston");
  const [owner, setOwner] = useState("");
  const [nextRunDate, setNextRunDate] = useState("");
  const [error, setError] = useState(initialError);
  const [notice, setNotice] = useState("");

  useEffect(() => { if (persistence === "supabase") return; const timer = window.setTimeout(() => { try { const available = readOperationsProcedures().filter((item) => item.status === "Published"); setProcedures(available); setProcedureId(available[0]?.id ?? ""); setSchedules(readOperationsSchedules()); } catch { setError("Recurring schedules could not be loaded from this browser."); setSchedules([]); } }, 0); return () => window.clearTimeout(timer); }, [persistence]);

  function save(next: OperationsScheduleRecord[]) { try { writeOperationsSchedules(next); setSchedules(next); setError(""); } catch { setError("Schedule changes could not be saved in this browser."); } }

  async function createSchedule(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const procedure = procedures.find((item) => item.id === procedureId);
    if (!procedure || owner.trim().length < 2 || !nextRunDate) { setError("Select a published procedure and add an owner and first run date."); return; }
    const input = { procedureId: procedure.id, procedureTitle: procedure.title, frequency, location, owner: owner.trim(), nextRunDate };
    if (persistence === "supabase") { const result = await saveOperationsSchedule(input); if (result.error || !result.record) { setError(result.error ?? "Schedule could not be created."); return; } setSchedules([result.record, ...(schedules ?? [])]); setError(""); }
    else { const schedule: OperationsScheduleRecord = { ...input, id: crypto.randomUUID(), status: "Active", lastGeneratedAt: null, createdAt: new Date().toISOString() }; save([schedule, ...(schedules ?? [])]); }
    setOwner(""); setNextRunDate(""); setNotice(`${procedure.title} schedule created.`);
  }

  async function toggleStatus(id: string) {
    if (!schedules) return;
    const item = schedules.find((schedule) => schedule.id === id); if (!item) return; const status = item.status === "Active" ? "Paused" : "Active";
    if (persistence === "demo") save(schedules.map((schedule) => schedule.id === id ? { ...schedule, status } : schedule)); else { const result = await setOperationsScheduleStatus(id, status); if (result.error) { setError(result.error); return; } setSchedules(schedules.map((schedule) => schedule.id === id ? { ...schedule, status } : schedule)); }
    setNotice("");
  }

  async function generateChecklist(schedule: OperationsScheduleRecord) {
    if (persistence === "supabase") { const result = await generateOperationsChecklist(schedule); if ("error" in result && result.error) { setError(result.error); return; } if (!("lastGeneratedAt" in result)) return; setSchedules((schedules ?? []).map((item) => item.id === schedule.id ? { ...item, lastGeneratedAt: result.lastGeneratedAt ?? item.lastGeneratedAt, nextRunDate: result.nextRunDate ?? item.nextRunDate } : item)); setNotice(`Checklist generated for ${schedule.procedureTitle}. The next run date moved forward automatically.`); setError(""); return; }
    const procedure = readOperationsProcedures().find((item) => item.id === schedule.procedureId);
    if (!procedure) { setError("The source procedure is no longer available."); return; }
    try {
      const checklists = readOperationsChecklists();
      const generated: OperationsChecklistRecord = { id: crypto.randomUUID(), title: `${procedure.title} · ${formatOperationsDate(schedule.nextRunDate)}`, location: schedule.location, owner: schedule.owner, dueDate: schedule.nextRunDate, createdAt: new Date().toISOString(), steps: procedure.steps.map((title) => ({ id: crypto.randomUUID(), title, complete: false })) };
      writeOperationsChecklists([generated, ...checklists]);
      const generatedAt = new Date().toISOString();
      save((schedules ?? []).map((item) => item.id === schedule.id ? { ...item, lastGeneratedAt: generatedAt, nextRunDate: getNextScheduleDate(item.nextRunDate, item.frequency) } : item));
      setNotice(`Checklist generated for ${schedule.procedureTitle}. The next run date moved forward automatically.`);
    } catch { setError("The scheduled checklist could not be generated in this browser."); }
  }

  if (schedules === null && !error) return <div className="card operations-loading"><LoaderCircle className="spin" size={22}/><div><h2>Loading recurring schedules</h2><p>Checking this browser for saved procedures and schedules.</p></div></div>;
  const active = schedules?.filter((item) => item.status === "Active").length ?? 0;

  return <div className="operations-schedule-stack">
    <section className="grid grid-3 operations-schedule-metrics" aria-label="Schedule summary"><div className="card"><div className="metric-row"><span>Active schedules</span><span className="metric-icon"><CalendarClock size={18}/></span></div><div className="metric">{active}</div><span className="delta">Ready for the next occurrence</span></div><div className="card"><div className="metric-row"><span>Paused</span><span className="metric-icon"><CirclePause size={18}/></span></div><div className="metric">{(schedules?.length ?? 0) - active}</div><span className="delta">Retained without generating work</span></div><div className="card"><div className="metric-row"><span>Published procedures</span><span className="metric-icon"><CheckCircle2 size={18}/></span></div><div className="metric">{procedures.length}</div><span className="delta">Available as schedule templates</span></div></section>
    {error && <p className="form-error operations-schedule-message"><AlertTriangle size={15}/>{error}</p>}{notice && <p className="operations-schedule-notice"><CheckCircle2 size={15}/>{notice}</p>}
    <div className="operations-schedule-layout"><aside className="card operations-schedule-form"><div className="metric-row"><div><span className="badge blue">Local prototype</span><h2>Create a schedule</h2></div><span className="metric-icon"><Plus size={18}/></span></div><p>Choose a published procedure to define the checklist steps.</p>{procedures.length ? <form className="form-stack" onSubmit={createSchedule}><label><span className="label">Procedure</span><select className="input" value={procedureId} onChange={(event) => setProcedureId(event.target.value)}>{procedures.map((item) => <option value={item.id} key={item.id}>{item.title}</option>)}</select></label><div className="grid grid-2"><label><span className="label">Frequency</span><select className="input" value={frequency} onChange={(event) => setFrequency(event.target.value as OperationsScheduleRecord["frequency"])}><option>Daily</option><option>Weekly</option><option>Monthly</option></select></label><label><span className="label">Location</span><select className="input" value={location} onChange={(event) => setLocation(event.target.value)}><option>Charleston</option><option>Summerville</option><option>All locations</option></select></label></div><label><span className="label">Owner</span><input className="input" required value={owner} onChange={(event) => setOwner(event.target.value)} placeholder="Person or team"/></label><label><span className="label">First run date</span><input className="input" required type="date" value={nextRunDate} onChange={(event) => setNextRunDate(event.target.value)}/></label><button className="btn btn-primary" type="submit"><Plus size={16}/> Create schedule</button></form> : <div className="operations-schedule-empty"><AlertTriangle size={22}/><strong>No published procedures</strong><p>Publish a procedure before creating a recurring schedule.</p><Link className="btn btn-secondary" href="/operations/procedures">Manage procedures</Link></div>}</aside>
      <section><div className="section-heading operations-list-heading"><div><h2>Recurring work</h2><p>{schedules?.length ?? 0} schedules saved in this browser</p></div></div>{schedules?.length ? <div className="operations-schedule-list">{schedules.map((schedule) => <article className="card operations-schedule-card" key={schedule.id}><div className="metric-row"><div className="operations-alert-badges"><span className={`badge ${schedule.status === "Active" ? "" : "amber"}`}>{schedule.status}</span><span className="badge blue">{schedule.frequency}</span></div><small>Next {formatOperationsDate(schedule.nextRunDate)}</small></div><h2>{schedule.procedureTitle}</h2><div className="operations-assigned-meta"><span><MapPin size={14}/>{schedule.location}</span><span><UserRound size={14}/>{schedule.owner}</span><span><CalendarClock size={14}/>Every {schedule.frequency.toLowerCase()}</span></div><p>{schedule.lastGeneratedAt ? `Last generated ${new Date(schedule.lastGeneratedAt).toLocaleString()}` : "No checklist generated yet."}</p><div className="operations-schedule-actions"><button className="btn btn-ghost" type="button" onClick={() => toggleStatus(schedule.id)}>{schedule.status === "Active" ? <><CirclePause size={15}/> Pause</> : <><Play size={15}/> Resume</>}</button><button className="btn btn-primary" disabled={schedule.status === "Paused"} type="button" onClick={() => generateChecklist(schedule)}><ClipboardPlus size={15}/> Generate now</button></div></article>)}</div> : <div className="card output empty"><div><CalendarClock size={28}/><h2>No recurring schedules</h2><p>Create the first schedule from an approved procedure.</p></div></div>}</section>
    </div>
  </div>;
}

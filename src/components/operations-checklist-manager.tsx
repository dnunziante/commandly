"use client";

import { AlertTriangle, CalendarDays, ClipboardCheck, LoaderCircle, MapPin, Plus, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import type { OperationsChecklistRecord } from "@/lib/operations/data";
import { formatOperationsDate, readOperationsChecklists, writeOperationsChecklists } from "@/lib/operations/storage";

export function OperationsChecklistManager() {
  const [checklists, setChecklists] = useState<OperationsChecklistRecord[] | null>(null);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("Charleston");
  const [owner, setOwner] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [stepsText, setStepsText] = useState("");

  useEffect(() => { const timer = window.setTimeout(() => { try { setChecklists(readOperationsChecklists()); } catch { setError("Saved checklists could not be loaded from this browser."); setChecklists([]); } }, 0); return () => window.clearTimeout(timer); }, []);

  function save(next: OperationsChecklistRecord[]) {
    try { writeOperationsChecklists(next); setChecklists(next); setError(""); }
    catch { setError("Checklist changes could not be saved in this browser."); }
  }

  function createChecklist(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const stepTitles = stepsText.split("\n").map((step) => step.trim()).filter(Boolean);
    if (title.trim().length < 2 || owner.trim().length < 2 || !dueDate || !stepTitles.length) { setError("Add a title, owner, due date, and at least one checklist step."); return; }
    const next: OperationsChecklistRecord = { id: crypto.randomUUID(), title: title.trim(), location, owner: owner.trim(), dueDate, createdAt: new Date().toISOString(), steps: stepTitles.map((stepTitle) => ({ id: crypto.randomUUID(), title: stepTitle, complete: false })) };
    save([next, ...(checklists ?? [])]); setTitle(""); setOwner(""); setDueDate(""); setStepsText("");
  }

  function toggleStep(checklistId: string, stepId: string) {
    if (!checklists) return;
    save(checklists.map((checklist) => checklist.id === checklistId ? { ...checklist, steps: checklist.steps.map((step) => step.id === stepId ? { ...step, complete: !step.complete } : step) } : checklist));
  }

  if (checklists === null && !error) return <div className="card operations-loading"><LoaderCircle className="spin" size={22}/><div><h2>Loading checklists</h2><p>Checking this browser for saved operations work.</p></div></div>;

  return <div className="operations-manager-layout">
    <section className="card operations-checklist-form"><div className="metric-row"><div><span className="badge blue">Local prototype</span><h2>Create a checklist</h2></div><span className="metric-icon"><Plus size={18}/></span></div><p>Assign a practical workflow to a location and owner. It will be saved only in this browser.</p>{error && <p className="form-error"><AlertTriangle size={14}/>{error}</p>}<form className="form-stack" onSubmit={createChecklist}><label><span className="label">Checklist title</span><input className="input" required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Example: Weekly demo-cart inspection"/></label><div className="grid grid-2"><label><span className="label">Location</span><select className="input" value={location} onChange={(event) => setLocation(event.target.value)}><option>Charleston</option><option>Summerville</option><option>All locations</option></select></label><label><span className="label">Owner</span><input className="input" required value={owner} onChange={(event) => setOwner(event.target.value)} placeholder="Person or team"/></label></div><label><span className="label">Due date</span><input className="input" required type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)}/></label><label><span className="label">Checklist steps</span><textarea className="input" required rows={6} value={stepsText} onChange={(event) => setStepsText(event.target.value)} placeholder={"Enter one step per line\nInspect tire pressure\nConfirm charge level"}/><small className="field-help">Enter one actionable step per line.</small></label><button className="btn btn-primary" type="submit"><Plus size={16}/> Create checklist</button></form></section>
    <section><div className="section-heading operations-list-heading"><div><h2>Assigned checklists</h2><p>{checklists?.length ?? 0} saved in this browser</p></div></div>{checklists?.length ? <div className="operations-assigned-list">{checklists.map((checklist) => { const completed = checklist.steps.filter((step) => step.complete).length; const progress = checklist.steps.length ? Math.round(completed / checklist.steps.length * 100) : 0; return <article className="card operations-assigned-card" key={checklist.id}><div className="metric-row"><span className={`badge ${progress === 100 ? "" : progress > 0 ? "blue" : "amber"}`}>{progress === 100 ? "Complete" : progress > 0 ? "In progress" : "Not started"}</span><strong>{progress}%</strong></div><h2>{checklist.title}</h2><div className="operations-assigned-meta"><span><MapPin size={14}/>{checklist.location}</span><span><UserRound size={14}/>{checklist.owner}</span><span><CalendarDays size={14}/>Due {formatOperationsDate(checklist.dueDate)}</span></div><div className="progress"><span style={{ width: `${progress}%` }}/></div><fieldset className="operations-step-list"><legend>{completed} of {checklist.steps.length} steps complete</legend>{checklist.steps.map((step) => <label className={step.complete ? "complete" : ""} key={step.id}><input type="checkbox" checked={step.complete} onChange={() => toggleStep(checklist.id, step.id)}/><span>{step.title}</span></label>)}</fieldset></article>; })}</div> : <div className="card output empty"><div><ClipboardCheck size={28}/><h2>No checklists assigned</h2><p>Create the first checklist to begin tracking operational work.</p></div></div>}</section>
  </div>;
}

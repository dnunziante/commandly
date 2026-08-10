"use client";

import { AlertTriangle, BookOpenCheck, CheckCircle2, FileEdit, LoaderCircle, Plus, Search, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { saveOperationsProcedure } from "@/app/operations/actions";
import type { OperationsProcedureRecord } from "@/lib/operations/data";
import type { OperationsPersistence } from "@/lib/operations/repository";
import { readOperationsProcedures, writeOperationsProcedures } from "@/lib/operations/storage";

const categories: Array<"All categories" | OperationsProcedureRecord["category"]> = ["All categories", "Delivery", "Sales floor", "Store operations", "Service", "Safety"];

export function OperationsProcedureManager({ initialProcedures = [], persistence = "demo", initialError = "" }: { initialProcedures?: OperationsProcedureRecord[]; persistence?: OperationsPersistence; initialError?: string }) {
  const [procedures, setProcedures] = useState<OperationsProcedureRecord[] | null>(persistence === "supabase" ? initialProcedures : null);
  const [error, setError] = useState(initialError);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<(typeof categories)[number]>("All categories");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<OperationsProcedureRecord["category"]>("Store operations");
  const [owner, setOwner] = useState("");
  const [summary, setSummary] = useState("");
  const [stepsText, setStepsText] = useState("");
  const [status, setStatus] = useState<OperationsProcedureRecord["status"]>("Draft");

  useEffect(() => { if (persistence === "supabase") return; const timer = window.setTimeout(() => { try { setProcedures(readOperationsProcedures()); } catch { setError("Saved procedures could not be loaded from this browser."); setProcedures([]); } }, 0); return () => window.clearTimeout(timer); }, [persistence]);
  const filtered = useMemo(() => (procedures ?? []).filter((procedure) => (categoryFilter === "All categories" || procedure.category === categoryFilter) && `${procedure.title} ${procedure.summary} ${procedure.owner}`.toLowerCase().includes(search.trim().toLowerCase())), [procedures, search, categoryFilter]);

  function saveLibrary(next: OperationsProcedureRecord[]) { try { writeOperationsProcedures(next); setProcedures(next); setError(""); } catch { setError("Procedure changes could not be saved in this browser."); } }
  function clearEditor() { setEditingId(null); setTitle(""); setCategory("Store operations"); setOwner(""); setSummary(""); setStepsText(""); setStatus("Draft"); }
  function editProcedure(procedure: OperationsProcedureRecord) { setEditingId(procedure.id); setTitle(procedure.title); setCategory(procedure.category); setOwner(procedure.owner); setSummary(procedure.summary); setStepsText(procedure.steps.join("\n")); setStatus(procedure.status); }
  async function saveProcedure(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const steps = stepsText.split("\n").map((step) => step.trim()).filter(Boolean);
    if (title.trim().length < 2 || owner.trim().length < 2 || summary.trim().length < 10 || !steps.length) { setError("Add a title, owner, useful summary, and at least one procedure step."); return; }
    const existing = procedures?.find((procedure) => procedure.id === editingId);
    let record: OperationsProcedureRecord = { id: existing?.id ?? `new-${crypto.randomUUID()}`, title: title.trim(), category, owner: owner.trim(), summary: summary.trim(), steps, status, version: existing ? existing.version + 1 : 1, updatedAt: new Date().toISOString() };
    if (persistence === "supabase") { const result = await saveOperationsProcedure(record); if (result.error || !result.record) { setError(result.error ?? "Procedure could not be saved."); return; } record = result.record; setProcedures([record, ...(procedures ?? []).filter((procedure) => procedure.id !== record.id && procedure.id !== existing?.id)]); }
    else saveLibrary([record, ...(procedures ?? []).filter((procedure) => procedure.id !== record.id)]);
    setEditingId(record.id); setError("");
  }

  if (procedures === null && !error) return <div className="card operations-loading"><LoaderCircle className="spin" size={22}/><div><h2>Loading procedure library</h2><p>Checking this browser for saved procedures.</p></div></div>;
  return <div className="operations-procedure-workspace">
    <section><div className="operations-procedure-toolbar"><label><span className="label">Search procedures</span><span className="operations-search-input"><Search size={16}/><input className="input" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search title, owner, or purpose"/></span></label><label><span className="label">Category</span><select className="input" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value as (typeof categories)[number])}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label><button className="btn btn-primary" type="button" onClick={clearEditor}><Plus size={16}/> New procedure</button></div>{error && <p className="form-error operations-procedure-error"><AlertTriangle size={14}/>{error}</p>}<div className="section-heading operations-list-heading"><div><h2>Procedure library</h2><p>{filtered.length} of {procedures?.length ?? 0} procedures</p></div></div>{filtered.length ? <div className="operations-procedure-cards">{filtered.map((procedure) => <button className={`card operations-procedure-card ${editingId === procedure.id ? "selected" : ""}`} key={procedure.id} type="button" onClick={() => editProcedure(procedure)}><div className="metric-row"><span className={`badge ${procedure.status === "Published" ? "" : "amber"}`}>{procedure.status}</span><small>Version {procedure.version}</small></div><span className="metric-icon"><BookOpenCheck size={18}/></span><h2>{procedure.title}</h2><p>{procedure.summary}</p><div className="operations-procedure-card-meta"><span>{procedure.category}</span><span><UserRound size={13}/>{procedure.owner}</span></div></button>)}</div> : <div className="card output empty"><div><BookOpenCheck size={28}/><h2>No matching procedures</h2><p>Change the filters or create a new procedure.</p></div></div>}</section>
    <aside className="card operations-procedure-editor"><div className="metric-row"><div><span className="badge blue">Local administrator editor</span><h2>{editingId ? "Edit procedure" : "Create a procedure"}</h2></div><span className="metric-icon"><FileEdit size={18}/></span></div><p>{editingId ? "Saving creates the next version while retaining the procedure identity." : "Document a repeatable workflow for the operations team."}</p><form className="form-stack" onSubmit={saveProcedure}><label><span className="label">Procedure title</span><input className="input" required value={title} onChange={(event) => setTitle(event.target.value)}/></label><div className="grid grid-2"><label><span className="label">Category</span><select className="input" value={category} onChange={(event) => setCategory(event.target.value as OperationsProcedureRecord["category"])}>{categories.slice(1).map((item) => <option key={item}>{item}</option>)}</select></label><label><span className="label">Owner</span><input className="input" required value={owner} onChange={(event) => setOwner(event.target.value)} placeholder="Person or role"/></label></div><label><span className="label">Purpose and scope</span><textarea className="input" required rows={3} value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="Explain when and why the team uses this procedure."/></label><label><span className="label">Procedure steps</span><textarea className="input" required rows={7} value={stepsText} onChange={(event) => setStepsText(event.target.value)} placeholder={"Enter one step per line\nConfirm the work order\nComplete the inspection"}/><small className="field-help">Enter steps in the order they should be completed.</small></label><label><span className="label">Publishing status</span><select className="input" value={status} onChange={(event) => setStatus(event.target.value as OperationsProcedureRecord["status"])}><option>Draft</option><option>Published</option></select></label><button className="btn btn-primary" type="submit"><CheckCircle2 size={16}/> {editingId ? "Save next version" : "Create procedure"}</button></form>{editingId && <button className="text-button operations-editor-cancel" type="button" onClick={clearEditor}>Cancel editing</button>}</aside>
  </div>;
}

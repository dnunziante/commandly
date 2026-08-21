"use client";

import { useActionState, useState } from "react";
import { Save, Plus, Pencil } from "lucide-react";
import { saveSalesContent, type ContentActionState } from "@/app/admin/content/actions";

export type SalesContentItem = { id: string; title: string; body: string; status: "draft" | "published" | "archived"; updatedAt: string };
const initialState: ContentActionState = { error: "", success: "" };

export function SalesContentManager({ contentType, label, items, canManage }: { contentType: string; label: string; items: SalesContentItem[]; canManage: boolean }) {
  const [selected, setSelected] = useState<SalesContentItem | null>(null);
  const [state, action, pending] = useActionState(saveSalesContent, initialState);
  const beginNew = () => setSelected(null);
  return <div className="sales-content-workspace">
    <section className="card sales-content-editor">
      <div className="metric-row"><div><span className="badge blue">Shared workspace</span><h2>{selected ? "Edit content" : `New ${label.toLowerCase()}`}</h2></div><button className="btn btn-secondary" type="button" onClick={beginNew}><Plus size={16}/> New</button></div>
      {!canManage ? <p className="form-error">Sign in as a tenant administrator to add or edit shared content.</p> : <form key={selected?.id || "new"} className="form-stack sales-content-form" action={action}>
        <input type="hidden" name="id" value={selected?.id || ""}/><input type="hidden" name="contentType" value={contentType}/>
        <label><span className="label">Title</span><input className="input" name="title" required minLength={2} maxLength={160} defaultValue={selected?.title || ""} placeholder={`e.g. ${label} for first-time buyers`}/></label>
        <label><span className="label">Content</span><textarea className="input" name="body" required rows={12} minLength={2} maxLength={12000} defaultValue={selected?.body || ""} placeholder="Add the approved wording your team should use."/></label>
        <label><span className="label">Status</span><select className="input" name="status" defaultValue={selected?.status || "draft"}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label>
        {state.error && <p className="form-error" role="alert">{state.error}</p>}{state.success && <p className="form-success" role="status">{state.success}</p>}
        <button className="btn btn-primary" disabled={pending}><Save size={16}/>{pending ? "Saving…" : "Save shared content"}</button>
      </form>}
    </section>
    <section className="card sales-content-library"><div className="metric-row sales-content-library-heading"><div><h2>Saved {label.toLowerCase()}</h2><p>{items.length} item{items.length === 1 ? "" : "s"} in this BGC workspace.</p></div></div>
      {items.length ? <div className="form-stack sales-content-list">{items.map((item) => <button className="card" style={{ textAlign: "left" }} type="button" key={item.id} onClick={() => setSelected(item)}><div className="metric-row"><strong>{item.title}</strong><span className={`badge ${item.status === "published" ? "blue" : item.status === "draft" ? "amber" : ""}`}>{item.status}</span></div><p>{item.body.length > 180 ? `${item.body.slice(0, 180)}…` : item.body}</p><small><Pencil size={13}/> Edit shared content</small></button>)}</div> : <div className="output empty"><div><h3>No {label.toLowerCase()} yet</h3><p>Add the approved material you want available before AI testing.</p></div></div>}
    </section>
  </div>;
}

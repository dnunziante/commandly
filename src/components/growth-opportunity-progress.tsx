"use client";
import { useState } from "react";
import { Save } from "lucide-react";
import { updateGrowthOpportunityProgress } from "@/app/growth/actions";

export function GrowthOpportunityProgress({ slug, initialStatus = "idea", initialProgress = 0, canManage }: { slug: string; initialStatus?: string; initialProgress?: number; canManage: boolean }) {
  const [status, setStatus] = useState(initialStatus); const [progress, setProgress] = useState(initialProgress); const [note, setNote] = useState(""); const [message, setMessage] = useState("");
  if (!canManage) return <div className="card"><h2>Progress</h2><strong>{progress}%</strong><p>{status.replaceAll("_", " ")}</p></div>;
  async function save() { const result = await updateGrowthOpportunityProgress({ slug, lifecycleStatus: status, progress, note }); setMessage(result.error || "Progress updated."); if (!result.error) setNote(""); }
  return <section className="card form-stack"><h2>Manage opportunity</h2><label><span className="label">Status</span><select className="input" value={status} onChange={(event) => setStatus(event.target.value)}>{["idea","under_review","approved","planned","in_progress","blocked","completed","validated","not_pursuing","archived"].map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}</select></label><label><span className="label">Progress</span><input className="input" type="number" min="0" max="100" value={progress} onChange={(event) => setProgress(Number(event.target.value))}/></label><label><span className="label">Progress update</span><textarea className="input" rows={3} value={note} onChange={(event) => setNote(event.target.value)} placeholder="What changed?"/></label><button className="btn btn-primary" type="button" onClick={save}><Save size={16}/> Save update</button>{message && <p className={message.includes("updated") ? "form-success" : "form-error"}>{message}</p>}</section>;
}

"use client";

import { useState } from "react";
import { LoaderCircle, Upload } from "lucide-react";

export function CommunicationExamplesManager({ canManage, examples }: { canManage: boolean; examples: Array<{ id: string; title: string; original_filename: string; status: string; created_at: string }> }) {
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  async function upload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUploading(true); setMessage("");
    const response = await fetch("/api/knowledge/documents", { method: "POST", body: new FormData(event.currentTarget) });
    const result = await response.json().catch(() => ({ error: "The example could not be uploaded." }));
    setUploading(false);
    setMessage(response.ok ? "Communication example uploaded and indexed separately from factual knowledge." : result.error || "The example could not be uploaded.");
    if (response.ok) window.location.reload();
  }
  return <section className="card form-stack"><div><span className="eyebrow">AI Communication Standards</span><h2>Communication Examples</h2><p>Upload preferred emails, texts, follow-ups, objection responses, and service messages. These examples shape tone and structure only—they are never used as company facts.</p></div>{canManage ? <form className="form-stack" onSubmit={upload}><input type="hidden" name="contextType" value="communication_example"/><input type="hidden" name="collection" value="Sales process"/><label><span className="label">Example title</span><input className="input" name="title" required maxLength={140} placeholder="Appointment-setting email examples"/></label><label><span className="label">Example document</span><input className="input file-input" name="file" type="file" required accept=".pdf,.docx,.md,.txt,application/pdf,text/plain,text/markdown,application/vnd.openxmlformats-officedocument.wordprocessingml.document"/><small className="field-help">PDF, DOCX, Markdown, or text · maximum 4 MB</small></label><button className="btn btn-primary" disabled={uploading}>{uploading ? <><LoaderCircle className="spin" size={16}/> Uploading…</> : <><Upload size={16}/> Upload communication example</>}</button></form> : <p className="demo-note">Tenant administrator access is required to manage communication examples.</p>}{message && <p className={message.includes("separately") ? "form-success" : "form-error"}>{message}</p>}<div><h3>Indexed communication examples</h3>{examples.length ? <ul>{examples.map((example) => <li key={example.id}><strong>{example.title}</strong> — {example.original_filename} · {example.status}</li>)}</ul> : <p>No communication examples yet.</p>}</div></section>;
}

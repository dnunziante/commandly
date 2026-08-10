"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, LoaderCircle, Search, Trash2, Upload } from "lucide-react";
import { deleteKnowledgeDocument } from "@/app/knowledge-base/actions";
import type { KnowledgeDocumentDTO } from "@/lib/knowledge/types";

function formatBytes(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function KnowledgeManager({ documents, canManage }: { documents: KnowledgeDocumentDTO[]; canManage: boolean }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [query, setQuery] = useState("");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const shown = useMemo(() => documents.filter((document) => `${document.title} ${document.filename} ${document.collection}`.toLowerCase().includes(query.toLowerCase())), [documents, query]);

  async function uploadDocument(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUploading(true);
    setMessage(null);
    const response = await fetch("/api/knowledge/documents", { method: "POST", body: new FormData(event.currentTarget) });
    const result = await response.json().catch(() => ({ error: "The upload could not be completed." }));
    setUploading(false);
    if (!response.ok) {
      setMessage({ type: "error", text: result.error || "The upload could not be completed." });
      return;
    }
    formRef.current?.reset();
    setMessage({ type: "success", text: "Document uploaded securely." });
    router.refresh();
  }

  return <>
    {canManage && <form className="card knowledge-upload" ref={formRef} onSubmit={uploadDocument}>
      <div><h2>Upload a document</h2><p>Private files are available only to members of this organization. AI indexing will be added later.</p></div>
      <div><label className="label" htmlFor="document-title">Title</label><input className="input" id="document-title" name="title" required maxLength={140} placeholder="2026 product guide"/></div>
      <div><label className="label" htmlFor="document-collection">Collection</label><select className="input" id="document-collection" name="collection"><option>General</option><option>Product knowledge</option><option>Policies</option><option>Sales process</option><option>Operations</option></select></div>
      <div><label className="label" htmlFor="document-file">File</label><input className="input file-input" id="document-file" name="file" type="file" required accept=".pdf,.docx,.md,.txt,application/pdf,text/plain,text/markdown,application/vnd.openxmlformats-officedocument.wordprocessingml.document"/><small className="field-help">PDF, DOCX, Markdown, or text · maximum 4 MB</small></div>
      <button className="btn btn-primary" disabled={uploading} type="submit">{uploading ? <><LoaderCircle className="spin" size={16}/> Uploading…</> : <><Upload size={16}/> Upload securely</>}</button>
      {message && <p className={message.type === "error" ? "form-error" : "form-success"} role="status">{message.text}</p>}
    </form>}
    <div className="card" style={{marginTop:18}}>
      <div className="metric-row knowledge-table-head"><div><h2>Documents</h2><p style={{fontSize:12,margin:0}}>Stored privately in the active workspace.</p></div><div style={{position:"relative",width:300,maxWidth:"100%"}}><Search size={15} style={{position:"absolute",left:11,top:12,color:"#68738a"}}/><input className="input" style={{paddingLeft:34}} value={query} onChange={(event)=>setQuery(event.target.value)} placeholder="Search knowledge"/></div></div>
      {shown.length ? <div className="table-wrap"><table className="table"><thead><tr><th>Name</th><th>Collection</th><th>Size</th><th>Uploaded</th><th>Status</th>{canManage && <th>Action</th>}</tr></thead><tbody>{shown.map((document)=><tr key={document.id}><td><span className="document-name"><FileText size={16}/><span><strong>{document.title}</strong><small>{document.filename}</small></span></span></td><td>{document.collection}</td><td>{formatBytes(document.sizeBytes)}</td><td>{new Intl.DateTimeFormat("en-US", { month:"short", day:"numeric", year:"numeric" }).format(new Date(document.createdAt))}</td><td><span className={`badge ${document.status === "Error" ? "amber" : ""}`}>{document.status}</span></td>{canManage && <td><form action={deleteKnowledgeDocument}><input type="hidden" name="documentId" value={document.id}/><button className="btn btn-ghost danger-button" type="submit" aria-label={`Delete ${document.title}`}><Trash2 size={14}/> Delete</button></form></td>}</tr>)}</tbody></table></div> : <div className="output empty"><div><FileText size={30}/><h2>{documents.length ? "No documents match" : "No documents yet"}</h2><p>{documents.length ? "Try a different search." : canManage ? "Upload the first approved document for this workspace." : "A tenant administrator has not uploaded any documents."}</p>{query && <button className="btn btn-secondary" onClick={()=>setQuery("")}>Clear search</button>}</div></div>}
    </div>
  </>;
}

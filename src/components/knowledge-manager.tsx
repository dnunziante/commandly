"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BookOpenCheck, FileText, LoaderCircle, RefreshCw, Search, Trash2, Upload } from "lucide-react";
import { createTrainingLesson, deleteKnowledgeDocument, reindexKnowledgeDocument, updateKnowledgeDocumentCollection } from "@/app/knowledge-base/actions";
import { KNOWLEDGE_COLLECTIONS } from "@/lib/knowledge/collections";
import type { KnowledgeDocumentDTO } from "@/lib/knowledge/types";

function formatBytes(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function KnowledgeManager({ documents, canManage, locations = [], products = [] }: { documents: KnowledgeDocumentDTO[]; canManage: boolean; locations?: { id: string; name: string }[]; products?: { id: string; name: string }[] }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [query, setQuery] = useState("");
  const [collectionFilter, setCollectionFilter] = useState("All Collections");
  const [uploading, setUploading] = useState(false);
  const [savingDocumentId, setSavingDocumentId] = useState<string | null>(null);
  const [isCollectionPending, startCollectionTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const shown = useMemo(() => documents.filter((document) => `${document.title} ${document.filename} ${document.collection}`.toLowerCase().includes(query.toLowerCase()) && (collectionFilter === "All Collections" || document.collection === collectionFilter)), [documents, query, collectionFilter]);

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
    setMessage({ type: result.indexed === false ? "error" : "success", text: result.indexed === false ? `Document saved, but indexing failed: ${result.error}` : (result.addedToTraining ? "Document uploaded, indexed, and added to Training." : "Document uploaded and indexed securely.") });
    router.refresh();
  }

  function changeCollection(documentId: string, collection: string) {
    setSavingDocumentId(documentId);
    setMessage(null);
    startCollectionTransition(async () => {
      const result = await updateKnowledgeDocumentCollection(documentId, collection);
      setMessage({ type: result.error ? "error" : "success", text: result.error || result.success });
      setSavingDocumentId(null);
      if (!result.error) router.refresh();
    });
  }

  function reindex(documentId: string) {
    setSavingDocumentId(documentId);
    setMessage(null);
    startCollectionTransition(async () => {
      const result = await reindexKnowledgeDocument(documentId);
      setMessage({ type: result.error ? "error" : "success", text: result.error || result.success });
      setSavingDocumentId(null);
      router.refresh();
    });
  }

  return <>
    {canManage && <form className="card knowledge-upload" ref={formRef} onSubmit={uploadDocument}>
      <div><h2>Upload a document</h2><p>Original files stay private. Supported documents are indexed for grounded Sales Assistant answers.</p></div>
      <div><label className="label" htmlFor="document-title">Title</label><input className="input" id="document-title" name="title" required maxLength={140} placeholder="2026 product guide"/></div>
      <div><label className="label" htmlFor="document-collection">Collection</label><select className="input" id="document-collection" name="collection">{KNOWLEDGE_COLLECTIONS.map((collection) => <option key={collection}>{collection}</option>)}</select></div>
      <div><label className="label" htmlFor="document-product">Product <small>(optional)</small></label><select className="input" id="document-product" name="productId"><option value="">All products / general knowledge</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></div>
      <div><label className="label" htmlFor="document-location">Location <small>(optional)</small></label><select className="input" id="document-location" name="locationId"><option value="">All locations</option>{locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select></div>
      <div><label className="label" htmlFor="document-file">File</label><input className="input file-input" id="document-file" name="file" type="file" required accept=".pdf,.docx,.md,.txt,application/pdf,text/plain,text/markdown,application/vnd.openxmlformats-officedocument.wordprocessingml.document"/><small className="field-help">PDF, DOCX, Markdown, or text · maximum 4 MB</small></div>
      <label className="knowledge-training-option"><input defaultChecked name="addToTraining" type="checkbox"/><span><strong>Add to Training</strong><small>Create a published 10-minute lesson linked to this document.</small></span></label>
      <button className="btn btn-primary" disabled={uploading} type="submit">{uploading ? <><LoaderCircle className="spin" size={16}/> Uploading…</> : <><Upload size={16}/> Upload securely</>}</button>
      {message && <p className={message.type === "error" ? "form-error" : "form-success"} role="status">{message.text}</p>}
    </form>}
    <div className="card" style={{marginTop:18}}>
      <div className="metric-row knowledge-table-head"><div><h2>Documents</h2><p style={{fontSize:12,margin:0}}>Stored privately in the active workspace.</p></div><div className="knowledge-list-controls"><label className="knowledge-filter"><span>Collection</span><select className="input" value={collectionFilter} onChange={(event) => setCollectionFilter(event.target.value)}><option>All Collections</option>{KNOWLEDGE_COLLECTIONS.map((collection) => <option key={collection}>{collection}</option>)}</select></label><div style={{position:"relative",width:300,maxWidth:"100%"}}><Search size={15} style={{position:"absolute",left:11,top:12,color:"#68738a"}}/><input className="input" style={{paddingLeft:34}} value={query} onChange={(event)=>setQuery(event.target.value)} placeholder="Search knowledge"/></div></div></div>
      {shown.length ? <div className="table-wrap"><table className="table"><thead><tr><th>Name</th><th>Collection</th><th>Size</th><th>Uploaded</th><th>Status</th>{canManage && <th>Actions</th>}</tr></thead><tbody>{shown.map((document)=><tr key={document.id}><td><span className="document-name"><FileText size={16}/><span><strong>{document.title}</strong><small>{document.filename}</small></span></span></td><td>{canManage ? <select aria-label={`Collection for ${document.title}`} className="input knowledge-collection-select" value={document.collection} disabled={isCollectionPending && savingDocumentId === document.id} onChange={(event) => changeCollection(document.id, event.target.value)}>{KNOWLEDGE_COLLECTIONS.map((collection) => <option key={collection}>{collection}</option>)}</select> : document.collection}</td><td>{formatBytes(document.sizeBytes)}</td><td>{new Intl.DateTimeFormat("en-US", { month:"short", day:"numeric", year:"numeric" }).format(new Date(document.createdAt))}</td><td><span className={`badge ${["Error", "Failed"].includes(document.status) ? "amber" : document.status === "Ready" ? "blue" : ""}`}>{document.status === "Ready" ? `${document.chunkCount} chunks` : document.status}</span>{document.trainingLessonId ? <small style={{display:"block",marginTop:6}}>In Training</small> : null}</td>{canManage && <td><div className="knowledge-row-actions"><button className="btn btn-secondary" type="button" disabled={isCollectionPending && savingDocumentId === document.id} onClick={() => reindex(document.id)}><RefreshCw className={isCollectionPending && savingDocumentId === document.id ? "spin" : ""} size={14}/> {document.chunkCount ? "Re-index" : "Index"}</button>{!document.trainingLessonId && <form action={createTrainingLesson}><input type="hidden" name="documentId" value={document.id}/><button className="btn btn-secondary" type="submit"><BookOpenCheck size={14}/> Add to training</button></form>}<form action={deleteKnowledgeDocument}><input type="hidden" name="documentId" value={document.id}/><button className="btn btn-ghost danger-button" type="submit" aria-label={`Delete ${document.title}`}><Trash2 size={14}/> Delete</button></form></div></td>}</tr>)}</tbody></table></div> : <div className="output empty"><div><FileText size={30}/><h2>{documents.length ? "No documents match" : "No documents yet"}</h2><p>{documents.length ? "Try a different search." : canManage ? "Upload the first approved document for this workspace." : "A tenant administrator has not uploaded any documents."}</p>{query && <button className="btn btn-secondary" onClick={()=>setQuery("")}>Clear search</button>}</div></div>}
    </div>
  </>;
}

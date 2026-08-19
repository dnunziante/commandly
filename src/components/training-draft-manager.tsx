"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Edit3, LoaderCircle, Trash2 } from "lucide-react";
import { deleteTrainingDraft, type TrainingDraftActionState } from "@/app/admin/training/actions";
import type { TrainingLessonDTO } from "@/lib/training/types";

const initialState: TrainingDraftActionState = { error: "", success: "" };

function DeleteDraftButton({ lessonId, title }: { lessonId: string; title: string }) {
  const [state, action, pending] = useActionState(deleteTrainingDraft, initialState);
  return <form action={action} className="training-draft-actions">
    <input name="lessonId" type="hidden" value={lessonId}/>
    <button className="btn btn-secondary danger-button" type="submit" disabled={pending} aria-label={`Delete draft ${title}`} onClick={(event) => {
      if (!window.confirm(`Delete the draft “${title}”? Its original Knowledge Base upload will be kept.`)) event.preventDefault();
    }}>
      {pending ? <><LoaderCircle className="spin" size={15}/> Deleting...</> : <><Trash2 size={15}/> Delete draft</>}
    </button>
    {state.error ? <p className="form-error" role="alert">{state.error}</p> : null}
    {state.success ? <p className="form-success" role="status">{state.success}</p> : null}
  </form>;
}

export function TrainingDraftManager({ drafts }: { drafts: TrainingLessonDTO[] }) {
  return <section className="card training-module-existing" aria-labelledby="training-drafts-heading">
    <div className="section-heading"><div><h2 id="training-drafts-heading">Unpublished drafts</h2><p>Edit a lesson before publishing it, or remove a draft without deleting its original Knowledge Base upload.</p></div><span className="badge amber">{drafts.length} draft{drafts.length === 1 ? "" : "s"}</span></div>
    {drafts.length ? <div className="training-module-lessons">{drafts.map((draft) => <div className="training-module-lesson training-draft-row" key={draft.id}><span><strong>{draft.title}</strong><small>{draft.estimatedMinutes} min · {draft.sourceFilename}</small></span><div className="training-draft-buttons"><Link className="btn btn-secondary" href={`/training/${draft.id}/review`}><Edit3 size={15}/> Edit draft</Link><DeleteDraftButton lessonId={draft.id} title={draft.title}/></div></div>)}</div> : <p className="field-help">There are no unpublished training drafts.</p>}
  </section>;
}

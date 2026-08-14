"use client";

import { CheckCircle2, Printer } from "lucide-react";
import { useActionState } from "react";
import { completeMonthlyLeadershipReview, type ReviewCompletionState } from "@/app/executive/review/actions";

export function MonthlyReviewControls({ period, initial }: { period: string; initial: ReviewCompletionState }) {
  const [state, action, pending] = useActionState(completeMonthlyLeadershipReview, initial);
  return <section className="card monthly-review-controls print-hide">
    <div><span className={`badge ${state.completedAt ? "blue" : "amber"}`}>{state.completedAt ? "Review completed" : "Completion pending"}</span><h2>Close the leadership review</h2><p>{state.completedAt ? `Completed by ${state.completedBy} on ${new Date(state.completedAt).toLocaleString()}.` : "Record completion after the leadership team has reviewed the agenda, accountability items, and decisions."}</p></div>
    <form action={action}><input type="hidden" name="period" value={period}/><label><span className="label">Review notes <small>Optional</small></span><textarea className="input" name="notes" rows={3} maxLength={2000} defaultValue={state.notes} placeholder="Record agreements, follow-up context, or meeting notes."/></label>{state.error && <p className="form-error">{state.error}</p>}<div className="monthly-review-actions"><button className="btn btn-primary" type="submit" disabled={pending}><CheckCircle2 size={16}/>{pending ? "Saving…" : state.completedAt ? "Update completion" : "Mark review complete"}</button><button className="btn btn-secondary" type="button" onClick={() => window.print()}><Printer size={16}/> Print review</button></div></form>
  </section>;
}

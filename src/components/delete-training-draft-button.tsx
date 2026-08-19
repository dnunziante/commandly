"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Trash2 } from "lucide-react";
import { deleteTrainingDraft } from "@/app/admin/training/actions";

export function DeleteTrainingDraftButton({ lessonId, title, redirectTo }: { lessonId: string; title: string; redirectTo?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function removeDraft() {
    if (!window.confirm(`Delete the draft “${title}”? Its original Knowledge Base upload will be kept.`)) return;
    setError("");
    startTransition(async () => {
      const formData = new FormData();
      formData.set("lessonId", lessonId);
      const result = await deleteTrainingDraft({ error: "", success: "" }, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (redirectTo) router.replace(redirectTo);
      else router.refresh();
    });
  }

  return <span className="training-delete-control"><button className="btn btn-secondary danger-button" type="button" disabled={pending} onClick={removeDraft}>{pending ? <><LoaderCircle className="spin" size={15}/> Deleting...</> : <><Trash2 size={15}/> Delete draft</>}</button>{error ? <small className="form-error" role="alert">{error}</small> : null}</span>;
}

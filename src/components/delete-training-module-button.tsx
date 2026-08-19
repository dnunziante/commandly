"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Trash2 } from "lucide-react";
import { deleteTrainingModule } from "@/app/admin/training/actions";

export function DeleteTrainingModuleButton({ moduleId, title }: { moduleId: string; title: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function deleteModule() {
    if (!window.confirm(`Delete the module “${title}”? Its lessons and Knowledge Base uploads will be kept.`)) return;
    setError("");
    startTransition(async () => {
      const formData = new FormData();
      formData.set("moduleId", moduleId);
      const result = await deleteTrainingModule({ error: "", success: "" }, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return <span className="training-delete-control"><button className="btn btn-ghost danger-button" type="button" disabled={isPending} onClick={deleteModule}>{isPending ? <><LoaderCircle className="spin" size={14}/> Deleting...</> : <><Trash2 size={14}/> Delete module</>}</button>{error ? <small className="form-error" role="alert">{error}</small> : null}</span>;
}

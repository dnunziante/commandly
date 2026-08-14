"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, LoaderCircle, Save } from "lucide-react";
import { saveTrainingModule, type TrainingModuleActionState } from "@/app/admin/training/actions";
import type { TrainingLessonDTO, TrainingModuleDTO } from "@/lib/training/types";

const initialState: TrainingModuleActionState = { error: "", success: "" };

function SaveButton({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus();
  return <button className="btn btn-primary" disabled={pending} type="submit">{pending ? <><LoaderCircle className="spin" size={16}/> Saving...</> : <><Save size={16}/> {editing ? "Save module" : "Create module"}</>}</button>;
}

export function TrainingModuleEditor({ lessons, module }: { lessons: TrainingLessonDTO[]; module?: TrainingModuleDTO }) {
  const [state, action] = useActionState(saveTrainingModule, initialState);
  const selectedOrder = new Map(module?.lessons.map((lesson, index) => [lesson.id, index + 1]));

  return <form className="card form-stack training-module-editor" action={action}>
    {module ? <input type="hidden" name="moduleId" value={module.id}/> : null}
    <div className="metric-row"><div><h2>{module ? module.title : "Create a training module"}</h2><p>{module ? "Edit its details, lessons, and order." : "Group existing knowledge-based lessons into one learning path."}</p></div>{module ? <span className={`badge ${module.isPublished ? "blue" : "amber"}`}>{module.isPublished ? "Published" : "Draft"}</span> : null}</div>
    <div><label className="label" htmlFor={`module-title-${module?.id ?? "new"}`}>Module title</label><input className="input" id={`module-title-${module?.id ?? "new"}`} name="title" defaultValue={module?.title} required placeholder="BGC Sales Foundations"/></div>
    <div><label className="label" htmlFor={`module-description-${module?.id ?? "new"}`}>Description</label><textarea className="input" id={`module-description-${module?.id ?? "new"}`} name="description" defaultValue={module?.description} rows={3} placeholder="What the team will learn in this module."/></div>
    <fieldset className="rubric-fields"><legend>Lessons and order</legend><div className="training-module-lessons">{lessons.map((lesson, index) => {
      const order = selectedOrder.get(lesson.id);
      return <label className="training-module-lesson" key={lesson.id}><input name="lessonId" type="checkbox" value={lesson.id} defaultChecked={Boolean(order)}/><span><strong>{lesson.title}</strong><small>{lesson.estimatedMinutes} min · {lesson.sourceFilename}</small></span><input aria-label={`Order for ${lesson.title}`} className="input module-order" name={`order-${lesson.id}`} type="number" min="1" max="999" defaultValue={order ?? index + 1}/></label>;
    })}</div><small className="field-help">Check the lessons to include. Lower order numbers appear first.</small></fieldset>
    <label className="knowledge-training-option"><input name="isPublished" type="checkbox" defaultChecked={module?.isPublished}/><span><strong><CheckCircle2 size={15}/> Publish this module</strong><small>Published modules appear on the Training page for BGC team members.</small></span></label>
    {state.error ? <p className="form-error" role="alert">{state.error}</p> : null}{state.success ? <p className="form-success" role="status">{state.success}</p> : null}
    <SaveButton editing={Boolean(module)}/>
  </form>;
}

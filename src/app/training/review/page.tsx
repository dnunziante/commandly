import { AlertTriangle, BookOpenCheck, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { DeleteTrainingDraftButton } from "@/components/delete-training-draft-button";
import { PageHeader } from "@/components/page-header";
import { getTrainingLessonsForReview } from "@/lib/training/data";

export default async function TrainingReviewPage() {
  const result = await getTrainingLessonsForReview();
  return <AppShell title="Training"><PageHeader eyebrow="Manager workspace" title="Training review queue" description="Review AI-generated drafts and source updates before publishing." action={<Link className="btn btn-secondary" href="/training">Employee training view</Link>}/>{result.error ? <div className="card error-card"><h2>Review queue unavailable</h2><p>{result.error}</p></div> : <div className="training-review-grid">{result.lessons.map((lesson) => <article className="card training-review-card" key={lesson.id}><Link className="training-review-link" href={`/training/${lesson.id}/review`}><span className={`badge ${lesson.sourceReviewRequired || lesson.generationStatus === "failed" ? "amber" : lesson.isPublished ? "blue" : ""}`}>{lesson.generationStatus === "failed" ? "Generation failed" : lesson.sourceReviewRequired ? "Source updated" : lesson.isPublished ? "Published" : "AI Generated — Draft"}</span><h2>{lesson.title}</h2><p>{lesson.description}</p><small>{lesson.sourceFilename} · {lesson.estimatedMinutes} minutes</small><span className="text-button">{lesson.sourceReviewRequired ? <AlertTriangle size={15}/> : lesson.isPublished ? <CheckCircle2 size={15}/> : <BookOpenCheck size={15}/>} Review lesson</span></Link>{!lesson.isPublished ? <DeleteTrainingDraftButton lessonId={lesson.id} title={lesson.title}/> : null}</article>)}</div>}</AppShell>;
}

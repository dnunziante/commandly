import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { TrainingLessonEditor } from "@/components/training-lesson-editor";
import { getTrainingLessonForReview } from "@/lib/training/data";

export default async function TrainingLessonReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lesson = await getTrainingLessonForReview(id);
  if (!lesson) notFound();
  return <AppShell title="Training"><PageHeader eyebrow="Training review" title={lesson.title} description="Review, edit, and approve this grounded lesson before employees can see it."/><Link className="text-button training-back-link" href="/training/review"><ArrowLeft size={15}/> Back to review queue</Link><TrainingLessonEditor lesson={lesson}/></AppShell>;
}

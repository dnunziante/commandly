import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { TrainingLessonContent } from "@/components/training-lesson-content";
import { getTrainingLessonForReview } from "@/lib/training/data";

export default async function TrainingLessonPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lesson = await getTrainingLessonForReview(id);
  if (!lesson) notFound();
  return <AppShell title="Training"><PageHeader eyebrow="Employee preview" title={lesson.title} description={lesson.description}/><Link className="text-button training-back-link" href={`/training/${lesson.id}/review`}><ArrowLeft size={15}/> Back to editor</Link><TrainingLessonContent lesson={lesson} reviewer/></AppShell>;
}

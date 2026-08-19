import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { TrainingLessonContent } from "@/components/training-lesson-content";
import { getTrainingLesson, getTrainingLessonCompleted, getTrainingModuleProgress } from "@/lib/training/data";

export default async function TrainingLessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [lesson, moduleProgress, completed] = await Promise.all([getTrainingLesson(id), getTrainingModuleProgress(id), getTrainingLessonCompleted(id)]);
  if (!lesson) notFound();

  return <AppShell title="Training">
    <PageHeader eyebrow="Knowledge-based lesson" title={lesson.title} description={lesson.description}/>
    <Link className="text-button training-back-link" href="/training"><ArrowLeft size={15}/> Back to Training</Link>
    <TrainingLessonContent lesson={lesson} completed={completed} moduleProgress={moduleProgress}/>
  </AppShell>;
}

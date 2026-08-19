import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { TrainingLessonContent } from "@/components/training-lesson-content";
import { getTrainingLesson } from "@/lib/training/data";

export default async function TrainingLessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lesson = await getTrainingLesson(id);
  if (!lesson) notFound();

  return <AppShell title="Training">
    <PageHeader eyebrow="Knowledge-based lesson" title={lesson.title} description={lesson.description}/>
    <Link className="text-button training-back-link" href="/training"><ArrowLeft size={15}/> Back to Training</Link>
    <TrainingLessonContent lesson={lesson}/>
  </AppShell>;
}

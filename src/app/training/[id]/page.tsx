import { ArrowLeft, BookOpenCheck, Clock, ExternalLink, FileText, ShieldCheck } from "lucide-react";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { getTrainingLesson } from "@/lib/training/data";

export default async function TrainingLessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lesson = await getTrainingLesson(id);
  if (!lesson) notFound();

  return <AppShell title="Training">
    <PageHeader eyebrow="Knowledge-based lesson" title={lesson.title} description={lesson.description}/>
    <form action="/training" method="get"><button className="text-button training-back-link" type="submit"><ArrowLeft size={15}/> Back to Training</button></form>
    <div className="training-detail-layout">
      <article className="card training-detail-card">
        <span className="metric-icon"><BookOpenCheck size={20}/></span>
        <h2>Approved BGC learning material</h2>
        <p>This lesson is grounded in the source document below. Open the document to review the complete training content.</p>
        <div className="training-detail-meta">
          <span><FileText size={16}/><span><small>Source document</small><strong>{lesson.sourceFilename}</strong></span></span>
          <span><Clock size={16}/><span><small>Estimated time</small><strong>{lesson.estimatedMinutes} minutes</strong></span></span>
          <span><ShieldCheck size={16}/><span><small>Collection</small><strong>{lesson.collection}</strong></span></span>
        </div>
        <a className="btn btn-primary" href={`/api/knowledge/documents/${lesson.knowledgeDocumentId}/open`} target="_blank" rel="noreferrer"><ExternalLink size={16}/> Open source document</a>
      </article>
      <aside className="card training-source-note"><ShieldCheck size={22}/><div><h2>Private BGC source</h2><p>The document link is created securely for your signed-in account and expires automatically.</p></div></aside>
    </div>
  </AppShell>;
}

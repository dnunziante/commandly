import { BookOpenCheck, CheckCircle2, Clock, ExternalLink, FileText, Lightbulb, ShieldCheck } from "lucide-react";
import type { TrainingLessonDTO } from "@/lib/training/types";

export function TrainingLessonContent({ lesson, reviewer = false }: { lesson: TrainingLessonDTO; reviewer?: boolean }) {
  const hasGeneratedContent = lesson.content.sections.length > 0;
  return <div className="training-detail-layout">
    <article className="card training-detail-card">
      <div className="training-source-summary"><span><FileText size={16}/><span><small>Source</small><strong>{lesson.sourceFilename}</strong></span></span><span><Clock size={16}/><span><small>Estimated Time</small><strong>{lesson.estimatedMinutes} minutes</strong></span></span><span><ShieldCheck size={16}/><span><small>Collection</small><strong>{lesson.collection}</strong></span></span></div>
      {hasGeneratedContent ? <>
        <section className="training-content-section"><h2>Learning Objectives</h2><ul>{lesson.content.learningObjectives.map((objective, index) => <li key={index}>{objective}</li>)}</ul></section>
        {lesson.content.sections.map((section, sectionIndex) => <section className="training-content-section" key={sectionIndex}><h2>{section.title}</h2>{section.content.split(/\n+/).filter(Boolean).map((paragraph, paragraphIndex) => <p key={paragraphIndex}>{paragraph}</p>)}</section>)}
        <section className="training-content-section"><h2>Key Takeaways</h2><ul>{lesson.content.keyTakeaways.map((takeaway, index) => <li key={index}><CheckCircle2 size={15}/>{takeaway}</li>)}</ul></section>
        {lesson.content.practicalApplication && <section className="training-content-section"><h2>Practical Application</h2><p>{lesson.content.practicalApplication}</p></section>}
        {lesson.content.scenario && <section className="training-content-section training-scenario"><h2>{lesson.content.scenario.title}</h2><p>{lesson.content.scenario.situation}</p><h3>Recommended approach</h3><p>{lesson.content.scenario.recommendedApproach}</p></section>}
        {lesson.content.knowledgeCheck.length > 0 && <section className="training-content-section"><h2>Knowledge Check</h2><div className="training-quiz">{lesson.content.knowledgeCheck.map((question, index) => <details key={question.id}><summary>{index + 1}. {question.question}</summary><ul>{question.options.map((option, optionIndex) => <li key={optionIndex}>{option}</li>)}</ul><p><strong>Correct answer:</strong> {question.correctAnswer}</p><p>{question.explanation}</p>{reviewer && <small><strong>Source evidence:</strong> {question.sourceEvidence}</small>}</details>)}</div></section>}
      </> : <section className="training-content-section"><span className="metric-icon"><BookOpenCheck size={20}/></span><h2>Approved learning material</h2><p>This existing lesson uses its linked source document as the training content.</p></section>}
      <a className="btn btn-secondary" href={`/api/knowledge/documents/${lesson.knowledgeDocumentId}/open`} target="_blank" rel="noreferrer"><ExternalLink size={16}/> Open source document</a>
    </article>
    <aside className="card training-source-note"><Lightbulb size={22}/><div><h2>Grounded source</h2><p>This lesson was generated from the linked private document. Review the source whenever exact wording matters.</p></div></aside>
  </div>;
}

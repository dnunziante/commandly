import { Award, BookOpen, BookOpenCheck, Clock, FileText, PlayCircle } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { getViewer } from "@/lib/auth/viewer";
import { getTrainingModules } from "@/lib/training/data";

export default async function Training() {
  const [viewer, result] = await Promise.all([getViewer(), getTrainingModules()]);
  const canManage = Boolean(viewer?.organizationId && ["tenant_admin", "platform_owner"].includes(viewer.role));
  const totalMinutes = result.lessons.reduce((total, lesson) => total + lesson.estimatedMinutes, 0);

  return <AppShell title="Training">
    <PageHeader eyebrow="Learning center" title="Small lessons. Stronger conversations." description="Build practical product and sales skills from approved BGC knowledge." action={canManage ? <Link className="btn btn-primary" href="/admin/training">Manage modules</Link> : null}/>
    <div className="grid grid-3">
      <div className="card"><div className="metric-icon"><BookOpen size={19}/></div><div className="metric">{result.lessons.length}</div><p>Knowledge-based lessons</p></div>
      <div className="card"><div className="metric-icon"><Clock size={19}/></div><div className="metric">{totalMinutes}m</div><p>Assigned learning time</p></div>
      <div className="card"><div className="metric-icon"><Award size={19}/></div><div className="metric">BGC</div><p>Private workspace training</p></div>
    </div>

    {result.modules.length ? <><div className="section-heading"><div><h2>Training modules</h2><p>Follow each BGC learning path in order.</p></div><span className="badge blue">{result.modules.length} published</span></div><div className="training-module-grid">{result.modules.map((module) => <section className="card training-module-card" key={module.id}><div className="metric-row"><span className="badge blue">{module.category}</span><span className="training-duration"><Clock size={13}/>{module.lessons.reduce((sum, lesson) => sum + lesson.estimatedMinutes, 0)} min</span></div><h2>{module.title}</h2><p>{module.description}</p><div className="training-module-path">{module.lessons.map((lesson, index) => <Link href={`/training/${lesson.id}`} key={lesson.id}><span>{index + 1}</span><span><strong>{lesson.title}</strong><small>{lesson.estimatedMinutes} min · {lesson.collection}</small></span><PlayCircle size={17}/></Link>)}</div></section>)}</div></> : null}

    <div className="section-heading"><div><h2>All training lessons</h2><p>Published lessons stay linked to their approved source documents.</p></div><span className="badge blue"><BookOpenCheck size={13}/> Supabase saved</span></div>
    {result.error ? <div className="card error-card"><h2>Training unavailable</h2><p>{result.error}</p></div> : result.lessons.length ? <div className="training-lesson-grid">{result.lessons.map((lesson) => <Link className="card training-source-card" href={`/training/${lesson.id}`} key={lesson.id}>
      <div className="metric-row"><span className="badge blue">{lesson.collection}</span><span className="training-duration"><Clock size={13}/>{lesson.estimatedMinutes} min</span></div>
      <div className="metric-icon"><FileText size={19}/></div>
      <h2>{lesson.title}</h2>
      <p>{lesson.description}</p>
      <small>Source: {lesson.sourceFilename}</small>
      <span className="btn btn-primary"><PlayCircle size={16}/> Open lesson</span>
    </Link>)}</div> : <div className="card output empty"><div><BookOpenCheck size={30}/><h2>No knowledge-based lessons yet</h2><p>Upload a document in Knowledge Base and keep “Add to Training” selected.</p></div></div>}
  </AppShell>;
}

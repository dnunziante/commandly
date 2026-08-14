import { Award, BookOpen, BookOpenCheck, CheckCircle2, Clock, FileText, PlayCircle } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { getTrainingLessons } from "@/lib/training/data";

const sampleLessons = [
  ["BGC product foundations", "12 min", "100%"],
  ["Discovery that earns trust", "9 min", "65%"],
  ["Selling value over price", "14 min", "20%"],
  ["A confident delivery handoff", "8 min", "0%"],
];

export default async function Training() {
  const result = await getTrainingLessons();
  const totalMinutes = result.lessons.reduce((total, lesson) => total + lesson.estimatedMinutes, 0);

  return <AppShell title="Training">
    <PageHeader eyebrow="Learning center" title="Small lessons. Stronger conversations." description="Build practical product and sales skills from approved BGC knowledge."/>
    <div className="grid grid-3">
      <div className="card"><div className="metric-icon"><BookOpen size={19}/></div><div className="metric">{result.lessons.length}</div><p>Knowledge-based lessons</p></div>
      <div className="card"><div className="metric-icon"><Clock size={19}/></div><div className="metric">{totalMinutes}m</div><p>Assigned learning time</p></div>
      <div className="card"><div className="metric-icon"><Award size={19}/></div><div className="metric">BGC</div><p>Private workspace training</p></div>
    </div>

    <div className="section-heading"><div><h2>Training from your Knowledge Base</h2><p>Published lessons stay linked to their approved source documents.</p></div><span className="badge blue"><BookOpenCheck size={13}/> Supabase saved</span></div>
    {result.error ? <div className="card error-card"><h2>Training unavailable</h2><p>{result.error}</p></div> : result.lessons.length ? <div className="training-lesson-grid">{result.lessons.map((lesson) => <article className="card training-source-card" key={lesson.id}>
      <div className="metric-row"><span className="badge blue">{lesson.collection}</span><span className="training-duration"><Clock size={13}/>{lesson.estimatedMinutes} min</span></div>
      <div className="metric-icon"><FileText size={19}/></div>
      <h2>{lesson.title}</h2>
      <p>{lesson.description}</p>
      <small>Source: {lesson.sourceFilename}</small>
      <Link className="btn btn-primary" href="/knowledge-base"><FileText size={16}/> View approved source</Link>
    </article>)}</div> : <div className="card output empty"><div><BookOpenCheck size={30}/><h2>No knowledge-based lessons yet</h2><p>Upload a document in Knowledge Base and keep “Add to Training” selected.</p></div></div>}

    <div className="section-heading"><h2>Sample learning path</h2><span className="badge">BGC Sales Foundations</span></div>
    <div className="card">{sampleLessons.map(([name,time,progress],i)=><div className="activity-row" key={name}>{progress==="100%"?<CheckCircle2 color="#16825d"/>:<PlayCircle color="#376fe8"/>}<div style={{flex:1}}><strong>{i+1}. {name}</strong><small style={{display:"block",marginTop:4}}>{time}</small></div><div style={{width:130}}><div className="progress"><span style={{width:progress}}/></div><small>{progress}</small></div></div>)}</div>
  </AppShell>;
}

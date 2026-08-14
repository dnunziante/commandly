import { Award, BookOpen, Clock } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { TrainingBrowser } from "@/components/training-browser";
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

    {result.error ? <div className="card error-card"><h2>Training unavailable</h2><p>{result.error}</p></div> : result.lessons.length ? <TrainingBrowser lessons={result.lessons} modules={result.modules}/> : <div className="card output empty"><div><h2>No knowledge-based lessons yet</h2><p>Upload a document in Knowledge Base and keep “Add to Training” selected.</p></div></div>}
  </AppShell>;
}

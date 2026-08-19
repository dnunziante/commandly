import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { TrainingDraftManager } from "@/components/training-draft-manager";
import { TrainingModuleEditor } from "@/components/training-module-editor";
import { getViewer } from "@/lib/auth/viewer";
import { getTrainingModules } from "@/lib/training/data";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function AdminTrainingPage({ searchParams }: { searchParams: Promise<{ lessonIds?: string }> }) {
  const { lessonIds } = await searchParams;
  const [viewer, result] = await Promise.all([getViewer(), getTrainingModules({ includeDrafts: true })]);
  const canManage = Boolean(viewer?.organizationId && ["tenant_admin", "platform_owner"].includes(viewer.role));
  const drafts = result.lessons.filter((lesson) => !lesson.isPublished);
  const initiallySelectedLessonIds = [...new Set((lessonIds || "").split(",").filter((id) => uuidPattern.test(id)))];

  return <AppShell title="Admin · Training modules">
    <PageHeader eyebrow="BGC learning paths" title="Training modules" description="Edit or remove unpublished drafts, then combine one or more knowledge uploads into an ordered module."/>
    {!canManage ? <div className="card error-card"><h2>Administrator access required</h2><p>Only BGC administrators can create or edit training modules.</p></div> : result.error ? <div className="card error-card"><h2>Modules unavailable</h2><p>{result.error}</p></div> : result.lessons.length === 0 ? <div className="card output empty"><div><h2>No lessons available yet</h2><p>Add documents to Training from the Knowledge Base first, then return here to build a module.</p></div></div> : <div className="training-module-admin-layout">
      <TrainingDraftManager drafts={drafts}/>
      <TrainingModuleEditor lessons={result.lessons} initialLessonIds={initiallySelectedLessonIds}/>
      <div className="training-module-existing"><div className="section-heading"><div><h2>Existing modules</h2><p>Edit the lessons, order, or publishing status at any time.</p></div><span className="badge blue">{result.modules.length} total</span></div>{result.modules.length ? result.modules.map((module) => <TrainingModuleEditor key={module.id} lessons={result.lessons} module={module}/>) : <div className="card output empty"><div><h3>No modules yet</h3><p>Create the first BGC training module.</p></div></div>}</div>
    </div>}
  </AppShell>;
}

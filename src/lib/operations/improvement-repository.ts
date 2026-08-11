import "server-only";

import { canManageOperations } from "@/lib/auth/permissions";
import { getViewer } from "@/lib/auth/viewer";
import { processImprovements, type ProcessImprovement } from "@/lib/operations/improvements";
import { createClient } from "@/lib/supabase/server";

const titleCase = (value: string) => value.split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");

export async function getImprovementWorkspace() {
  const viewer = await getViewer();
  if (!viewer || viewer.demo) return { persistence: "demo" as const, items: processImprovements, canManage: true, error: "" };
  const supabase = await createClient();
  const { data, error } = await supabase.from("operations_improvements").select("id,kind,title,description,department,location_name,frequency,impact,urgency,status,manager_decision,manager_note,owner_name,due_date,lean_waste,project_method,dmaic_phase,results,lessons_learned,created_at,profiles!operations_improvements_submitted_by_fkey(full_name),operations_improvement_whys(id,position,answer),operations_improvement_actions(id,description,owner_name,due_date,status),operations_improvement_measurements(id,phase,metric,value,unit,measured_at,verified_at)").eq("organization_id", viewer.organizationId).order("created_at", { ascending: false });
  if (error) return { persistence: "supabase" as const, items: [] as ProcessImprovement[], canManage: canManageOperations(viewer.role), error: error.message };
  const items: ProcessImprovement[] = (data ?? []).map((row) => {
    const action = (row.operations_improvement_actions as unknown as Array<{ description: string }> | null)?.[0];
    const profile = row.profiles as unknown as { full_name: string } | null;
    return {
      id: row.id, kind: titleCase(row.kind) as ProcessImprovement["kind"], title: row.title, description: row.description,
      department: titleCase(row.department), location: row.location_name, frequency: titleCase(row.frequency) as ProcessImprovement["frequency"],
      impact: titleCase(row.impact) as ProcessImprovement["impact"], urgency: titleCase(row.urgency) as ProcessImprovement["urgency"],
      status: titleCase(row.status) as ProcessImprovement["status"], submittedBy: profile?.full_name ?? "Organization member", submittedAt: row.created_at,
      waste: row.lean_waste ? titleCase(row.lean_waste) as ProcessImprovement["waste"] : null,
      managerDecision: titleCase(row.manager_decision) as ProcessImprovement["managerDecision"], managerNote: row.manager_note,
      owner: row.owner_name, dueDate: row.due_date ?? "",
      whys: [...((row.operations_improvement_whys ?? []) as Array<{ position: number; answer: string }>)].sort((a,b)=>a.position-b.position).map((item)=>item.answer),
      correctiveAction: action?.description ?? "",
      measurements: ((row.operations_improvement_measurements ?? []) as Array<{ id:string; phase:string; metric:string; value:number|string; unit:string; measured_at:string; verified_at:string|null }>).map((item)=>({ id:item.id, phase:titleCase(item.phase) as ProcessImprovement["measurements"][number]["phase"], metric:item.metric, value:Number(item.value), unit:item.unit, measuredAt:item.measured_at, verified:Boolean(item.verified_at) })),
      results: row.results, lessonsLearned: row.lessons_learned,
      projectMethod: titleCase(row.project_method) as ProcessImprovement["projectMethod"], dmaicPhase: row.dmaic_phase ? titleCase(row.dmaic_phase) as NonNullable<ProcessImprovement["dmaicPhase"]> : null,
    };
  });
  return { persistence: "supabase" as const, items, canManage: canManageOperations(viewer.role), error: "" };
}

export async function getImprovement(id: string) {
  const workspace = await getImprovementWorkspace();
  return { ...workspace, item: workspace.items.find((item) => item.id === id) };
}

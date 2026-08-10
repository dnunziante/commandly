import type { OperationsAlertRecord, OperationsChecklistRecord } from "@/lib/operations/data";

export type OperationsLocationPerformance = { location: string; completedSteps: number; totalSteps: number; completion: number; activeAlerts: number; overdueItems: number };

function isPastDue(dueDate: string, today: string) { return Boolean(dueDate) && dueDate < today; }

export function calculateOperationsPerformance(checklists: OperationsChecklistRecord[], alerts: OperationsAlertRecord[], today: string) {
  const completedSteps = checklists.reduce((sum, item) => sum + item.steps.filter((step) => step.complete).length, 0);
  const totalSteps = checklists.reduce((sum, item) => sum + item.steps.length, 0);
  const activeAlerts = alerts.filter((item) => item.status !== "Resolved");
  const resolvedAlerts = alerts.filter((item) => item.status === "Resolved");
  const resolutionHours = resolvedAlerts.flatMap((alert) => { const resolved = alert.history.findLast((entry) => entry.status === "Resolved"); return resolved ? [(new Date(resolved.changedAt).getTime() - new Date(alert.createdAt).getTime()) / 3_600_000] : []; }).filter((hours) => Number.isFinite(hours) && hours >= 0);
  const locations = [...new Set([...checklists.map((item) => item.location), ...alerts.map((item) => item.location)])].filter((item) => item !== "All locations");
  const byLocation: OperationsLocationPerformance[] = locations.map((location) => {
    const scopedChecklists = checklists.filter((item) => item.location === location || item.location === "All locations");
    const scopedAlerts = alerts.filter((item) => item.location === location || item.location === "All locations");
    const locationCompleted = scopedChecklists.reduce((sum, item) => sum + item.steps.filter((step) => step.complete).length, 0);
    const locationTotal = scopedChecklists.reduce((sum, item) => sum + item.steps.length, 0);
    const locationActiveAlerts = scopedAlerts.filter((item) => item.status !== "Resolved");
    return { location, completedSteps: locationCompleted, totalSteps: locationTotal, completion: locationTotal ? Math.round(locationCompleted / locationTotal * 100) : 0, activeAlerts: locationActiveAlerts.length, overdueItems: scopedChecklists.filter((item) => item.steps.some((step) => !step.complete) && isPastDue(item.dueDate, today)).length + locationActiveAlerts.filter((item) => isPastDue(item.dueDate, today)).length };
  });
  const overdueItems = checklists.filter((item) => item.steps.some((step) => !step.complete) && isPastDue(item.dueDate, today)).length + activeAlerts.filter((item) => isPastDue(item.dueDate, today)).length;
  return { completedSteps, totalSteps, completion: totalSteps ? Math.round(completedSteps / totalSteps * 100) : 0, activeAlerts: activeAlerts.length, resolvedAlerts: resolvedAlerts.length, overdueItems, averageResolutionHours: resolutionHours.length ? Math.round(resolutionHours.reduce((sum, hours) => sum + hours, 0) / resolutionHours.length * 10) / 10 : null, byLocation };
}

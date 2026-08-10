import type { GrowthPlan } from "@/lib/growth/data";

export type GrowthPlanPerformance = { plan: GrowthPlan; completedTasks: number; totalTasks: number; progress: number; overdue: boolean };
export type GrowthPerformance = { totalPlans: number; activePlans: number; completedPlans: number; overduePlans: number; onTrackPlans: number; completedTasks: number; totalTasks: number; taskCompletion: number; notStartedPlans: number; inProgressPlans: number; outcomeEntries: number; leads: number; appointments: number; revenue: number; cost: number; roi: number | null; planPerformance: GrowthPlanPerformance[] };

function isOverdue(plan: GrowthPlan, today: Date) {
  if (plan.status === "Complete" || !/^\d{4}-\d{2}-\d{2}$/.test(plan.targetDate)) return false;
  const [year, month, day] = plan.targetDate.split("-").map(Number);
  const target = new Date(year, month - 1, day);
  const current = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return target < current;
}

export function calculateGrowthPerformance(plans: GrowthPlan[], today = new Date()): GrowthPerformance {
  const planPerformance = plans.map((plan) => {
    const completedTasks = plan.tasks.filter((task) => task.complete).length;
    const totalTasks = plan.tasks.length;
    return { plan, completedTasks, totalTasks, progress: totalTasks ? Math.round(completedTasks / totalTasks * 100) : 0, overdue: isOverdue(plan, today) };
  });
  const totalTasks = planPerformance.reduce((total, item) => total + item.totalTasks, 0);
  const completedTasks = planPerformance.reduce((total, item) => total + item.completedTasks, 0);
  const activePlans = plans.filter((plan) => plan.status !== "Complete").length;
  const overduePlans = planPerformance.filter((item) => item.overdue).length;
  const outcomes = plans.flatMap((plan) => plan.outcomes ?? []);
  const leads = outcomes.reduce((total, outcome) => total + outcome.leads, 0);
  const appointments = outcomes.reduce((total, outcome) => total + outcome.appointments, 0);
  const revenue = outcomes.reduce((total, outcome) => total + outcome.revenue, 0);
  const cost = outcomes.reduce((total, outcome) => total + outcome.cost, 0);
  return { totalPlans: plans.length, activePlans, completedPlans: plans.filter((plan) => plan.status === "Complete").length, overduePlans, onTrackPlans: Math.max(0, activePlans - overduePlans), completedTasks, totalTasks, taskCompletion: totalTasks ? Math.round(completedTasks / totalTasks * 100) : 0, notStartedPlans: plans.filter((plan) => plan.status === "Not started").length, inProgressPlans: plans.filter((plan) => plan.status === "In progress").length, outcomeEntries: outcomes.length, leads, appointments, revenue, cost, roi: cost > 0 ? Math.round((revenue - cost) / cost * 100) : null, planPerformance };
}

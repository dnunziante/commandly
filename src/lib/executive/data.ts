export type ExecutiveMetric = {
  label: string;
  value: string;
  context: string;
  tone: "positive" | "attention" | "neutral";
};

export type ExecutivePriority = {
  id: string;
  rank: number;
  title: string;
  area: "Sales" | "People" | "Growth" | "Operations";
  reason: string;
  action: string;
  href: string;
  urgency: "Act now" | "This week" | "Monitor";
};

export type ExecutivePriorityReviewStatus = "open" | "acknowledged" | "in_progress" | "completed" | "dismissed";
export type ExecutivePriorityReview = { id: string; priorityKey: string; reportingPeriod: string; status: ExecutivePriorityReviewStatus; ownerName: string; dueDate: string; reviewNote: string; updatedAt: string };

export type LocationSummary = {
  location: string;
  salesPace: number | null;
  coachingCompletion: number | null;
  growthCompletion: number | null;
  operationsCompletion: number | null;
  openRisks: number;
  signal: "Leading" | "Stable" | "Needs attention" | "No data";
};

export type ExecutiveTargets = {
  salesPace: number;
  coachingCompletion: number;
  growthCompletion: number;
  operationsCompletion: number;
  highRiskLimit: number;
};

export const defaultExecutiveTargets: ExecutiveTargets = {
  salesPace: 100,
  coachingCompletion: 90,
  growthCompletion: 80,
  operationsCompletion: 95,
  highRiskLimit: 0,
};

export type ExecutiveSignal = {
  label: string;
  value: number;
  target: number;
  unit: "%" | "plans" | "items";
  href: string;
};

export const executiveMetrics: ExecutiveMetric[] = [
  { label: "Sales pace", value: "94%", context: "of sample monthly target", tone: "attention" },
  { label: "Team development", value: "82%", context: "training completion", tone: "positive" },
  { label: "Growth execution", value: "71%", context: "action-plan tasks complete", tone: "attention" },
  { label: "Operations execution", value: "88%", context: "checklist steps complete", tone: "positive" },
];

export const executiveSignals: ExecutiveSignal[] = [
  { label: "Sales target progress", value: 94, target: 100, unit: "%", href: "/analytics" },
  { label: "Coaching completion", value: 82, target: 90, unit: "%", href: "/coach" },
  { label: "Growth plan completion", value: 71, target: 80, unit: "%", href: "/growth/performance" },
  { label: "Operations completion", value: 88, target: 95, unit: "%", href: "/operations/performance" },
];

export const executiveLocations: LocationSummary[] = [
  { location: "Charleston", salesPace: 97, coachingCompletion: 86, growthCompletion: 72, operationsCompletion: 83, openRisks: 2, signal: "Stable" },
  { location: "Summerville", salesPace: 91, coachingCompletion: 78, growthCompletion: 68, operationsCompletion: 96, openRisks: 1, signal: "Needs attention" },
];

const priorityInputs = [
  { id: "delivery-readiness", score: 92, title: "Close the delivery-readiness gap", area: "Operations", reason: "Charleston has an incomplete delivery checklist and a high-severity operational alert.", action: "Confirm ownership and complete the remaining preparation steps before the next pickup.", href: "/operations/alerts", urgency: "Act now" },
  { id: "coaching-completion", score: 78, title: "Raise coaching completion in Summerville", area: "People", reason: "Sample coaching completion is 12 points below the 90% leadership target.", action: "Schedule focused practice for the team members who have not completed this week’s assignment.", href: "/coach/review", urgency: "This week" },
  { id: "growth-plan", score: 72, title: "Advance the highest-priority growth plan", area: "Growth", reason: "Growth-plan execution is 9 points below its sample target and has unfinished owner actions.", action: "Review the plan owner, next task, and measurement date before adding another initiative.", href: "/growth/plans", urgency: "This week" },
  { id: "sales-pace", score: 54, title: "Monitor monthly sales pace", area: "Sales", reason: "Sales pace is close to target but remains six points short in the sample rollup.", action: "Review the location pipeline and follow-up activity at the next leadership check-in.", href: "/analytics", urgency: "Monitor" },
] as const;

export function rankExecutivePriorities(): ExecutivePriority[] {
  return [...priorityInputs]
    .sort((a, b) => b.score - a.score)
    .map((item, index) => ({ id: item.id, title: item.title, area: item.area, reason: item.reason, action: item.action, href: item.href, urgency: item.urgency, rank: index + 1 })) as ExecutivePriority[];
}

export const executiveRisks = [
  { title: "Delivery exception remains open", owner: "Delivery Team", due: "Today", href: "/operations/alerts" },
  { title: "One growth plan is behind target", owner: "Growth plan owner", due: "This week", href: "/growth/performance" },
  { title: "Coaching completion below goal", owner: "Sales Manager", due: "This week", href: "/coach/review" },
] as const;

export const executiveWins = [
  "Summerville operational completion is above the sample 95% target.",
  "Two improvement submissions have moved beyond initial review.",
  "Team confidence is trending upward in the sample sales workspace.",
] as const;

export type ImprovementKind = "Problem" | "Improvement";
export type ImprovementLevel = "Low" | "Medium" | "High" | "Critical";
export type ImprovementStatus = "Submitted" | "Under review" | "Approved" | "In progress" | "Measuring" | "Verified" | "Closed";
export type LeanWaste = "Defects" | "Overproduction" | "Waiting" | "Unused talent" | "Transportation" | "Inventory" | "Motion" | "Extra processing";

export type ImprovementMeasurement = {
  id: string;
  phase: "Before" | "After" | "Follow-up";
  metric: string;
  value: number;
  unit: string;
  measuredAt: string;
  verified: boolean;
};

export type ProcessImprovement = {
  id: string;
  kind: ImprovementKind;
  title: string;
  description: string;
  department: string;
  location: string;
  frequency: "One time" | "Occasional" | "Weekly" | "Daily" | "Multiple times daily";
  impact: ImprovementLevel;
  urgency: ImprovementLevel;
  status: ImprovementStatus;
  submittedBy: string;
  submittedAt: string;
  waste: LeanWaste | null;
  managerDecision: "Pending" | "Approved" | "More information" | "Not approved";
  managerNote: string;
  owner: string;
  dueDate: string;
  whys: string[];
  correctiveAction: string;
  measurements: ImprovementMeasurement[];
  results: string;
  lessonsLearned: string;
  // Reserved for later migrations; these concepts are intentionally hidden in V1.
  projectMethod: "Rapid improvement" | "DMAIC";
  dmaicPhase: "Define" | "Measure" | "Analyze" | "Improve" | "Control" | null;
};

export const processImprovements: ProcessImprovement[] = [
  {
    id: "delivery-photo-rework",
    kind: "Problem",
    title: "Delivery photos are being retaken",
    description: "Delivery photos are sometimes missing the required angles, so the delivery team has to move the cart and take the photos again before the customer arrives.",
    department: "Delivery",
    location: "Charleston",
    frequency: "Weekly",
    impact: "Medium",
    urgency: "Medium",
    status: "In progress",
    submittedBy: "Jordan Lee",
    submittedAt: "2026-08-06T14:30:00.000Z",
    waste: "Defects",
    managerDecision: "Approved",
    managerNote: "Good rapid-improvement candidate. Test a visual photo standard for two weeks.",
    owner: "Delivery Manager",
    dueDate: "2026-08-21",
    whys: ["Required photo angles are missing.", "The photographer relies on memory.", "The checklist names photos but does not show the angles.", "The standard was written before the current delivery process.", "Procedure updates are not triggered by repeat rework."],
    correctiveAction: "Add a four-angle visual guide to the delivery checklist and review it during the morning handoff.",
    measurements: [
      { id: "photo-before", phase: "Before", metric: "Deliveries requiring photo rework", value: 6, unit: "per week", measuredAt: "2026-08-05", verified: true },
      { id: "photo-after", phase: "After", metric: "Deliveries requiring photo rework", value: 2, unit: "per week", measuredAt: "2026-08-19", verified: false },
    ],
    results: "Early results show fewer retakes; the after measurement still needs manager verification.",
    lessonsLearned: "A visual standard is easier to follow than a text-only reminder at the point of work.",
    projectMethod: "Rapid improvement",
    dmaicPhase: null,
  },
  {
    id: "parts-counter-labels",
    kind: "Improvement",
    title: "Label high-use accessory bins",
    description: "The delivery and service teams spend time checking several bins for common accessory hardware. Clear labels could reduce searching and incorrect picks.",
    department: "Service",
    location: "Summerville",
    frequency: "Daily",
    impact: "Medium",
    urgency: "Low",
    status: "Under review",
    submittedBy: "Alex Morgan",
    submittedAt: "2026-08-08T10:15:00.000Z",
    waste: "Motion",
    managerDecision: "Pending",
    managerNote: "",
    owner: "Unassigned",
    dueDate: "",
    whys: [],
    correctiveAction: "",
    measurements: [{ id: "parts-before", phase: "Before", metric: "Average hardware search time", value: 4.5, unit: "minutes", measuredAt: "2026-08-08", verified: false }],
    results: "",
    lessonsLearned: "",
    projectMethod: "Rapid improvement",
    dmaicPhase: null,
  },
  {
    id: "morning-demo-keys",
    kind: "Problem",
    title: "Demo-cart keys are not always ready at opening",
    description: "Sales representatives occasionally have to locate demo-cart keys after a customer arrives because the key board was not checked during opening.",
    department: "Sales",
    location: "All locations",
    frequency: "Occasional",
    impact: "High",
    urgency: "High",
    status: "Submitted",
    submittedBy: "Taylor Reed",
    submittedAt: "2026-08-09T08:40:00.000Z",
    waste: null,
    managerDecision: "Pending",
    managerNote: "",
    owner: "Unassigned",
    dueDate: "",
    whys: [],
    correctiveAction: "",
    measurements: [],
    results: "",
    lessonsLearned: "",
    projectMethod: "Rapid improvement",
    dmaicPhase: null,
  },
];

export function getProcessImprovement(id: string) {
  return processImprovements.find((item) => item.id === id);
}

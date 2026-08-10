import type { CoachScenario, CoachSessionSummary } from "./types";

const sharedResponses = [
  "That makes sense. Before we compare numbers, what matters most to you in the cart you choose?",
  "This model has a lot of value, so I think it is worth the difference.",
  "What outcome are you hoping for, and which features matter most to you?",
];

const demoCoachScenarioBase: Array<Omit<CoachScenario, "rubricWeights" | "rounds">> = [
  { id: "price-objection", slug: "price-objection", title: "The price feels high", category: "Objection handling", difficulty: "Foundational", durationMinutes: 6, duration: "6 min", customer: "A value-conscious family comparing several carts", goal: "Acknowledge the concern, uncover priorities, and explain value without inventing pricing.", opening: "I like the Nexus, but this is more than I planned to spend.", skills: ["Listen", "Clarify", "Value framing"], responseOptions: sharedResponses, preferredOptionIndices: [0, 2], status: "Published" },
  { id: "competitor-comparison", slug: "competitor-comparison", title: "Comparing another dealership", category: "Competitive conversation", difficulty: "Intermediate", durationMinutes: 8, duration: "8 min", customer: "A shopper who has visited a competing dealership", goal: "Explore the customer's comparison criteria before positioning an approved BGC product.", opening: "The other dealership says their cart gives me the same thing for less.", skills: ["Discovery", "Comparison", "Trust"], responseOptions: sharedResponses, preferredOptionIndices: [0, 2], status: "Published" },
  { id: "product-fit", slug: "product-fit", title: "Finding the right cart", category: "Product recommendation", difficulty: "Foundational", durationMinutes: 7, duration: "7 min", customer: "A first-time buyer unsure which model fits", goal: "Use discovery questions to distinguish Nexus, Beyond, and ActivEV Pulse needs.", opening: "There are so many options. I'm not sure what I actually need.", skills: ["Discovery", "Product fit", "Summarizing"], responseOptions: sharedResponses, preferredOptionIndices: [0, 2], status: "Published" },
  { id: "financing", slug: "financing", title: "Making the purchase manageable", category: "Financing discussion", difficulty: "Intermediate", durationMinutes: 7, duration: "7 min", customer: "A qualified shopper concerned about the total purchase", goal: "Discuss next steps clearly without promising unapproved terms or rates.", opening: "I may need financing, but I don't want the payment to get out of hand.", skills: ["Empathy", "Boundaries", "Next steps"], responseOptions: sharedResponses, preferredOptionIndices: [0, 2], status: "Published" },
  { id: "follow-up", slug: "follow-up", title: "Re-engaging a quiet lead", category: "Follow-up", difficulty: "Intermediate", durationMinutes: 5, duration: "5 min", customer: "A shopper who has not replied in one week", goal: "Create a useful, low-pressure reason to continue the conversation.", opening: "I'm still thinking about it. I'll reach out when I'm ready.", skills: ["Relevance", "Permission", "Follow-up"], responseOptions: sharedResponses, preferredOptionIndices: [0, 2], status: "Published" },
  { id: "close", slug: "close", title: "Asking for the next step", category: "Closing conversation", difficulty: "Advanced", durationMinutes: 9, duration: "9 min", customer: "An informed shopper showing strong buying signals", goal: "Summarize the fit and confidently invite a clear next step.", opening: "The Beyond seems to check most of my boxes. I just need to decide.", skills: ["Summarizing", "Confidence", "Commitment"], responseOptions: sharedResponses, preferredOptionIndices: [0, 2], status: "Published" },
];

const rubricWeights = { Clarify: 20, Listen: 20, Open: 15, Solve: 15, Explain: 15, Recommend: 15 };

export const demoCoachScenarios: CoachScenario[] = demoCoachScenarioBase.map((scenario) => ({
  ...scenario,
  rubricWeights,
  rounds: [
    { id: `${scenario.id}-1`, roundNumber: 1, customerPrompt: scenario.opening, responseOptions: scenario.responseOptions, preferredOptionIndices: scenario.preferredOptionIndices, skillImpacts: ["Clarify", "Listen"] },
    { id: `${scenario.id}-2`, roundNumber: 2, customerPrompt: "That makes sense. Based on what I have told you, how would you help me narrow this down?", responseOptions: ["Let me summarize what I heard first, then we can compare the choices that fit those priorities.", "I would choose the most popular option because it works for most customers.", "Before I recommend anything, which of those priorities would be hardest for you to compromise on?"], preferredOptionIndices: [0, 2], skillImpacts: ["Open", "Solve", "Explain"] },
    { id: `${scenario.id}-3`, roundNumber: 3, customerPrompt: "I understand the fit better now. What would you suggest as the next step?", responseOptions: ["Based on your priorities, I can recommend a clear next step and explain why it fits.", "You should make the decision today before the opportunity is gone.", "Would you like to review the best-fit option together and decide what next step feels right?"], preferredOptionIndices: [0, 2], skillImpacts: ["Explain", "Recommend"] },
  ],
}));

export const demoCloserScores: Array<[string, number]> = [
  ["Clarify", 82], ["Listen", 88], ["Open", 76], ["Solve", 79], ["Explain", 84], ["Recommend", 72],
];

export const demoCoachReview: CoachSessionSummary = {
  id: "demo-review",
  scenarioTitle: "The price feels high",
  scenarioSlug: "price-objection",
  category: "Objection handling",
  difficulty: "Foundational",
  score: 84,
  closerScores: demoCloserScores,
  summary: "You acknowledged the concern, asked useful questions, and avoided unsupported product or pricing claims.",
  strength: "You used a focused discovery question before explaining value.",
  improvement: "Summarize the customer's top two priorities before recommending a product or next step.",
  completedAt: new Date().toISOString(),
};

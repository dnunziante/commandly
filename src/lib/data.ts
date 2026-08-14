import type { ProductDTO } from "@/lib/products/types";

export type Product = ProductDTO;

export const products: Product[] = [
  { id: "demo-nexus", familyId: "demo-bintelli-nexus", slug: "nexus-4-passenger-forward", name: "Nexus", model: "4 Passenger Forward", price: 15995, status: "Published", description: "Premium 72V performance with upscale comfort and connected technology.", range: "Aluminum", seats: "4 Passenger", powertrain: "72V", highlights: ["72V lithium", "Power steering", "10.1-in touchscreen"], color: "navy", imageUrl: null, imageUrls: [], imagePaths: [], salesGuide: { bestFitCustomer: "", sellingPoints: [], discoveryQuestions: [], demonstrationSteps: [], objectionResponses: [], accessoryOpportunities: [], followUpNotes: "", disclaimers: "" } },
  { id: "demo-beyond", familyId: "demo-bintelli-beyond", slug: "beyond-4-passenger-forward", name: "Beyond", model: "4 Passenger Forward", price: 13495, status: "Published", description: "A refined everyday cart with practical premium features included.", range: "Aluminum", seats: "4 Passenger", powertrain: "48V", highlights: ["48V lithium", "Aluminum frame", "Premium audio"], color: "blue", imageUrl: null, imageUrls: [], imagePaths: [], salesGuide: { bestFitCustomer: "", sellingPoints: [], discoveryQuestions: [], demonstrationSteps: [], objectionResponses: [], accessoryOpportunities: [], followUpNotes: "", disclaimers: "" } },
  { id: "demo-pulse", familyId: "demo-activev-pulse", slug: "activev-pulse-6-passenger", name: "ActivEV Pulse", model: "6 Passenger", price: 10995, status: "Published", description: "Flexible six-passenger seating and approachable electric performance.", range: "Powder Coated Steel", seats: "6 Passengers", powertrain: "48V", highlights: ["Lithium power", "Digital display", "Extended seating"], color: "green", imageUrl: null, imageUrls: [], imagePaths: [], salesGuide: { bestFitCustomer: "", sellingPoints: [], discoveryQuestions: [], demonstrationSteps: [], objectionResponses: [], accessoryOpportunities: [], followUpNotes: "", disclaimers: "" } },
];

/*
  The remainder of this file contains non-product prototype data. Product records
  above are used only when Supabase is not configured.
*/
/*
type LegacyProductShape = {
  id: number;
  name: string;
  model: string;
  price: number;
  status: "Published" | "Draft";
  description: string;
  range: string;
  seats: string;
  highlights: string[];
  color: string;
};
*/

export const objections = [
  { title: "I need to think about it", type: "Timing", response: "That makes sense. Usually when someone needs time, there is one part that still feels uncertain. Is it the cart, the price, or the timing?", followUp: "What information would make the decision easier?" },
  { title: "Your price is higher", type: "Price", response: "Let’s compare what is included, not only the sticker price. Which features and long-term ownership costs matter most to you?", followUp: "Would it help to compare the included equipment side by side?" },
  { title: "I need to talk to my spouse", type: "Decision maker", response: "Absolutely. What do you think will be most important to them so I can make sure you have the right information?", followUp: "Would a short feature and pricing summary help that conversation?" },
];

export const recentActivity = [
  ["Maya generated a Nexus follow-up", "2 min ago"],
  ["Jordan completed Price Comparison role play", "18 min ago"],
  ["Beyond product guide was updated", "1 hr ago"],
];

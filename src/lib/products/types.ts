export type ProductStatus = "Draft" | "Published" | "Archived";

export type SalesGuideDTO = {
  bestFitCustomer: string;
  sellingPoints: string[];
  discoveryQuestions: string[];
  demonstrationSteps: string[];
  objectionResponses: string[];
  accessoryOpportunities: string[];
  followUpNotes: string;
  disclaimers: string;
};

export type ProductDTO = {
  id: string;
  familyId: string | null;
  name: string;
  slug: string;
  model: string;
  description: string;
  price: number;
  range: string;
  seats: string;
  powertrain: string;
  dimensions: string;
  runningDistance: string;
  turningRadius: string;
  maxLoadCapacity: string;
  sortOrder?: number;
  highlights: string[];
  color: string;
  imageUrl: string | null;
  imageUrls: string[];
  imagePaths: string[];
  salesGuide: SalesGuideDTO;
  status: ProductStatus;
};

export type ProductFamilyDTO = {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string | null;
  imagePath: string | null;
  productCount: number;
};

export type ProductResult = {
  products: ProductDTO[];
  source: "supabase" | "demo";
  error?: string;
};

export type ProductFamilyResult = {
  families: ProductFamilyDTO[];
  source: "supabase" | "demo";
  error?: string;
};

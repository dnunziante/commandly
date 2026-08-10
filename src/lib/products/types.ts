export type ProductStatus = "Draft" | "Published" | "Archived";

export type ProductDTO = {
  id: string;
  name: string;
  slug: string;
  model: string;
  description: string;
  price: number;
  range: string;
  seats: string;
  highlights: string[];
  color: string;
  status: ProductStatus;
};

export type ProductResult = {
  products: ProductDTO[];
  source: "supabase" | "demo";
  error?: string;
};

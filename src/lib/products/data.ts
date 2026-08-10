import "server-only";

import { getViewer } from "@/lib/auth/viewer";
import { products as demoProducts } from "@/lib/data";
import { isLocalDemoMode, isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { ProductDTO, ProductResult, ProductStatus } from "./types";

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  model: string;
  description: string;
  base_price_cents: number;
  range_text: string;
  seats_text: string;
  highlights: string[] | null;
  visual_theme: string;
  status: "draft" | "published" | "archived";
};

const statusLabels: Record<ProductRow["status"], ProductStatus> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
};

function toDTO(row: ProductRow): ProductDTO {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    model: row.model,
    description: row.description,
    price: row.base_price_cents / 100,
    range: row.range_text,
    seats: row.seats_text,
    highlights: row.highlights || [],
    color: row.visual_theme,
    status: statusLabels[row.status],
  };
}

export async function getTenantProducts(options: { includeDrafts?: boolean } = {}): Promise<ProductResult> {
  if (isLocalDemoMode() || !isSupabaseConfigured()) {
    return { products: demoProducts, source: "demo" };
  }

  const viewer = await getViewer();
  if (!viewer?.organizationId) {
    return { products: [], source: "supabase", error: "Your account is not assigned to an organization." };
  }

  const supabase = await createClient();
  let query = supabase
    .from("products")
    .select("id, name, slug, model, description, base_price_cents, range_text, seats_text, highlights, visual_theme, status")
    .eq("organization_id", viewer.organizationId)
    .order("name");

  if (!options.includeDrafts) query = query.eq("status", "published");

  const { data, error } = await query;
  if (error) {
    return { products: [], source: "supabase", error: "Products could not be loaded from the workspace." };
  }

  return { products: (data as ProductRow[]).map(toDTO), source: "supabase" };
}

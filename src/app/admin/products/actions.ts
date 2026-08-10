"use server";

import { revalidatePath } from "next/cache";
import { getViewer } from "@/lib/auth/viewer";
import { createClient } from "@/lib/supabase/server";

export type ProductActionState = { error: string; success: string };

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function requireTenantAdmin() {
  const viewer = await getViewer();
  if (!viewer || !viewer.organizationId || !["tenant_admin", "platform_owner"].includes(viewer.role)) {
    throw new Error("Unauthorized");
  }
  return viewer;
}

export async function createProduct(
  _previousState: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  const viewer = await requireTenantAdmin();
  const name = String(formData.get("name") || "").trim();
  const model = String(formData.get("model") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const rangeText = String(formData.get("range") || "").trim();
  const seatsText = String(formData.get("seats") || "").trim();
  const price = Number(formData.get("price"));
  const status = formData.get("status") === "published" ? "published" : "draft";
  const highlights = String(formData.get("highlights") || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);

  if (name.length < 2 || !Number.isFinite(price) || price < 0) {
    return { error: "Enter a product name and a valid non-negative price.", success: "" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("products").insert({
    organization_id: viewer.organizationId,
    name,
    slug: `${slugify(name)}-${slugify(model || "standard")}`,
    model,
    description,
    base_price_cents: Math.round(price * 100),
    range_text: rangeText,
    seats_text: seatsText,
    highlights,
    visual_theme: "blue",
    status,
  });

  if (error) {
    return { error: error.code === "23505" ? "That product configuration already exists." : "The product could not be saved.", success: "" };
  }

  revalidatePath("/products");
  revalidatePath("/comparisons");
  revalidatePath("/admin/products");
  return { error: "", success: `${name} was saved.` };
}

export async function deleteProduct(formData: FormData) {
  const viewer = await requireTenantAdmin();
  const productId = String(formData.get("productId") || "");
  if (!/^[0-9a-f-]{36}$/i.test(productId)) throw new Error("Invalid product ID");

  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", productId)
    .eq("organization_id", viewer.organizationId);

  if (error) throw new Error("The product could not be removed.");
  revalidatePath("/products");
  revalidatePath("/comparisons");
  revalidatePath("/admin/products");
}

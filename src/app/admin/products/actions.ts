"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/auth/viewer";
import { createClient } from "@/lib/supabase/server";

export type ProductActionState = {
  error: string;
  success: string;
  productId?: string;
  organizationId?: string;
};
export type SalesGuideActionState = { error: string; success: string };
export type FamilyImageActionState = { error: string; success: string };
export type ProductEditActionState = { error: string; success: string };

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function lines(value: FormDataEntryValue | null, limit = 12) {
  return String(value || "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean).slice(0, limit);
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
  const familyId = String(formData.get("familyId") || "");
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

  if (name.length < 2 || !Number.isFinite(price) || price < 0 || !/^[0-9a-f-]{36}$/i.test(familyId)) {
    return { error: "Choose a product family, enter a product name, and use a valid non-negative price.", success: "" };
  }

  const supabase = await createClient();
  const { data: family } = await supabase.from("product_families").select("id").eq("id", familyId).eq("organization_id", viewer.organizationId).maybeSingle();
  if (!family) return { error: "Choose a product family from this workspace.", success: "" };
  const productId = crypto.randomUUID();

  const { error } = await supabase.from("products").insert({
    id: productId,
    organization_id: viewer.organizationId,
    family_id: familyId,
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
  revalidatePath("/products/families");
  revalidatePath("/comparisons");
  revalidatePath("/admin/products");
  return { error: "", success: `${name} was saved.`, productId, organizationId: viewer.organizationId };
}

export async function saveProductFamilyImage(familyId: string, imagePath: string): Promise<FamilyImageActionState> {
  const viewer = await requireTenantAdmin();
  if (!/^[0-9a-f-]{36}$/i.test(familyId) || !imagePath.startsWith(`${viewer.organizationId}/families/${familyId}/`) || !/\.(jpe?g|png|webp)$/i.test(imagePath)) {
    return { error: "The family image path is invalid.", success: "" };
  }

  const supabase = await createClient();
  const { data: existing } = await supabase.from("product_families").select("image_path, name").eq("id", familyId).eq("organization_id", viewer.organizationId).maybeSingle();
  if (!existing) return { error: "That product family is not available.", success: "" };

  const { data, error } = await supabase.from("product_families").update({ image_path: imagePath, updated_at: new Date().toISOString() }).eq("id", familyId).eq("organization_id", viewer.organizationId).select("name, slug").maybeSingle();
  if (error || !data) return { error: "The family image could not be saved.", success: "" };
  if (existing.image_path && existing.image_path !== imagePath) await supabase.storage.from("product-images").remove([existing.image_path]);

  revalidatePath("/products");
  revalidatePath(`/products/families/${data.slug}`);
  revalidatePath("/admin/products");
  return { error: "", success: `${data.name} image was saved.` };
}

export async function saveProductImagePaths(productId: string, imagePaths: string[]) {
  const viewer = await requireTenantAdmin();
  if (!/^[0-9a-f-]{36}$/i.test(productId) || imagePaths.length > 8) {
    throw new Error("Invalid product gallery");
  }

  const expectedPrefix = `${viewer.organizationId}/${productId}/`;
  if (imagePaths.some((path) => !path.startsWith(expectedPrefix) || !/\.(jpe?g|png|webp)$/i.test(path))) {
    throw new Error("Invalid product image path");
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("products")
    .select("image_path, image_paths")
    .eq("id", productId)
    .eq("organization_id", viewer.organizationId)
    .maybeSingle();
  const { error } = await supabase
    .from("products")
    .update({ image_paths: imagePaths, image_path: imagePaths[0] || null })
    .eq("id", productId)
    .eq("organization_id", viewer.organizationId);

  if (error) throw new Error("The product gallery could not be saved.");
  const previousPaths = Array.from(new Set([...(existing?.image_paths || []), existing?.image_path].filter((path): path is string => Boolean(path))));
  const removedPaths = previousPaths.filter((path) => !imagePaths.includes(path));
  if (removedPaths.length) await supabase.storage.from("product-images").remove(removedPaths);
  revalidatePath("/products");
  revalidatePath("/comparisons");
  revalidatePath("/admin/products");
}

export async function saveWarrantyDocumentPaths(productId: string, documentPaths: string[]) {
  const viewer = await requireTenantAdmin();
  if (!/^[0-9a-f-]{36}$/i.test(productId) || documentPaths.length > 5) throw new Error("Invalid warranty documents");
  const expectedPrefix = `${viewer.organizationId}/${productId}/`;
  if (documentPaths.some((path) => !path.startsWith(expectedPrefix) || !/\.(pdf|docx?)$/i.test(path))) throw new Error("Invalid warranty document path");
  const supabase = await createClient();
  const { error } = await supabase.from("products").update({ warranty_document_paths: documentPaths }).eq("id", productId).eq("organization_id", viewer.organizationId);
  if (error) throw new Error("The warranty documents could not be saved.");
  revalidatePath("/products");
  revalidatePath("/admin/products");
}

export async function updateProduct(
  _previousState: ProductEditActionState,
  formData: FormData,
): Promise<ProductEditActionState> {
  const viewer = await requireTenantAdmin();
  const productId = String(formData.get("productId") || "");
  const familyId = String(formData.get("familyId") || "");
  const name = String(formData.get("name") || "").trim();
  const model = String(formData.get("model") || "").trim();
  const price = Number(formData.get("price"));
  if (!/^[0-9a-f-]{36}$/i.test(productId) || !/^[0-9a-f-]{36}$/i.test(familyId) || name.length < 2 || !Number.isFinite(price) || price < 0) {
    return { error: "Choose a product family, enter a product name, and use a valid non-negative price.", success: "" };
  }

  const supabase = await createClient();
  const { data: family } = await supabase.from("product_families").select("id, slug").eq("id", familyId).eq("organization_id", viewer.organizationId).maybeSingle();
  if (!family) return { error: "Choose a product family from this workspace.", success: "" };

  const highlights = String(formData.get("highlights") || "").split(",").map((item) => item.trim()).filter(Boolean).slice(0, 8);
  const { data, error } = await supabase.from("products").update({
    family_id: familyId,
    name,
    slug: `${slugify(name)}-${slugify(model || "standard")}`,
    model,
    description: String(formData.get("description") || "").trim(),
    base_price_cents: Math.round(price * 100),
    range_text: String(formData.get("range") || "").trim(),
    seats_text: String(formData.get("seats") || "").trim(),
    highlights,
    status: formData.get("status") === "published" ? "published" : "draft",
    updated_at: new Date().toISOString(),
  }).eq("id", productId).eq("organization_id", viewer.organizationId).select("slug").maybeSingle();

  if (error || !data) return { error: error?.code === "23505" ? "That product configuration already exists." : "The product could not be updated.", success: "" };
  revalidatePath("/products");
  revalidatePath(`/products/families/${family.slug}`);
  revalidatePath(`/products/${data.slug}`);
  revalidatePath("/comparisons");
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}/edit`);
  return { error: "", success: `${name} was updated.` };
}

export async function duplicateProduct(formData: FormData) {
  const viewer = await requireTenantAdmin();
  const productId = String(formData.get("productId") || "");
  if (!/^[0-9a-f-]{36}$/i.test(productId)) throw new Error("Invalid product ID");

  const supabase = await createClient();
  const { data: source } = await supabase.from("products")
    .select("family_id, name, model, description, base_price_cents, range_text, seats_text, highlights, visual_theme, sales_guide")
    .eq("id", productId).eq("organization_id", viewer.organizationId).maybeSingle();
  if (!source) throw new Error("The product could not be duplicated.");

  const duplicateId = crypto.randomUUID();
  const copySuffix = duplicateId.slice(0, 8);
  const { error } = await supabase.from("products").insert({
    id: duplicateId,
    organization_id: viewer.organizationId,
    family_id: source.family_id,
    name: source.name,
    slug: `${slugify(source.name)}-${slugify(source.model || "standard")}-copy-${copySuffix}`,
    model: `${source.model} Copy`.trim(),
    description: source.description,
    base_price_cents: source.base_price_cents,
    range_text: source.range_text,
    seats_text: source.seats_text,
    highlights: source.highlights,
    visual_theme: source.visual_theme,
    sales_guide: source.sales_guide,
    image_path: null,
    image_paths: [],
    status: "draft",
  });
  if (error) throw new Error("The product could not be duplicated.");

  revalidatePath("/admin/products");
  redirect(`/admin/products/${duplicateId}/edit`);
}

export async function setProductStatus(formData: FormData) {
  const viewer = await requireTenantAdmin();
  const productId = String(formData.get("productId") || "");
  const status = formData.get("status") === "published" ? "published" : "draft";
  if (!/^[0-9a-f-]{36}$/i.test(productId)) throw new Error("Invalid product ID");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", productId)
    .eq("organization_id", viewer.organizationId)
    .select("id")
    .maybeSingle();

  if (error || !data) throw new Error("The product status could not be changed.");
  revalidatePath("/products");
  revalidatePath("/comparisons");
  revalidatePath("/admin/products");
}

export async function saveSalesGuide(
  _previousState: SalesGuideActionState,
  formData: FormData,
): Promise<SalesGuideActionState> {
  const viewer = await requireTenantAdmin();
  const productId = String(formData.get("productId") || "");
  if (!/^[0-9a-f-]{36}$/i.test(productId)) return { error: "Invalid product.", success: "" };

  const salesGuide = {
    bestFitCustomer: String(formData.get("bestFitCustomer") || "").trim().slice(0, 1200),
    sellingPoints: lines(formData.get("sellingPoints")),
    discoveryQuestions: lines(formData.get("discoveryQuestions")),
    demonstrationSteps: lines(formData.get("demonstrationSteps")),
    objectionResponses: lines(formData.get("objectionResponses")),
    accessoryOpportunities: lines(formData.get("accessoryOpportunities")),
    followUpNotes: String(formData.get("followUpNotes") || "").trim().slice(0, 2000),
    disclaimers: String(formData.get("disclaimers") || "").trim().slice(0, 2000),
  };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .update({ sales_guide: salesGuide, updated_at: new Date().toISOString() })
    .eq("id", productId)
    .eq("organization_id", viewer.organizationId)
    .select("name, slug")
    .maybeSingle();

  if (error || !data) return { error: "The sales guide could not be saved.", success: "" };
  revalidatePath(`/products/${data.slug}`);
  revalidatePath("/products");
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}/guide`);
  return { error: "", success: `${data.name} sales guide was saved.` };
}

export async function deleteProduct(formData: FormData) {
  const viewer = await requireTenantAdmin();
  const productId = String(formData.get("productId") || "");
  if (!/^[0-9a-f-]{36}$/i.test(productId)) throw new Error("Invalid product ID");

  const supabase = await createClient();
  const { data: product } = await supabase
    .from("products")
    .select("image_path, image_paths, warranty_document_paths")
    .eq("id", productId)
    .eq("organization_id", viewer.organizationId)
    .maybeSingle();
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", productId)
    .eq("organization_id", viewer.organizationId);

  if (error) throw new Error("The product could not be removed.");
  const storedPaths = Array.from(new Set([...(product?.image_paths || []), product?.image_path].filter((path): path is string => Boolean(path))));
  if (storedPaths.length) {
    await supabase.storage.from("product-images").remove(storedPaths);
  }
  if (product?.warranty_document_paths?.length) await supabase.storage.from("warranty-documents").remove(product.warranty_document_paths);
  revalidatePath("/products");
  revalidatePath("/comparisons");
  revalidatePath("/admin/products");
}

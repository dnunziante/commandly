"use server";

import { revalidatePath } from "next/cache";
import { getViewer } from "@/lib/auth/viewer";
import { createClient } from "@/lib/supabase/server";

export type OrganizationSettingsActionState = { error: string; success: string };
export type AddLocationState = { error: string; success: string };

export async function saveOrganizationSettings(_previousState: OrganizationSettingsActionState, formData: FormData): Promise<OrganizationSettingsActionState> {
  const viewer = await getViewer();
  if (!viewer?.organizationId || viewer.demo || !["tenant_admin", "platform_owner"].includes(viewer.role)) return { error: "Sign in as a tenant administrator to save shared settings.", success: "" };
  const displayName = String(formData.get("displayName") || "").trim();
  const primaryColor = String(formData.get("primaryColor") || "").trim();
  const contactEmail = String(formData.get("contactEmail") || "").trim();
  const defaultLocationId = String(formData.get("defaultLocationId") || "");
  const assistantInstructions = String(formData.get("assistantInstructions") || "").trim();
  const communicationRules = String(formData.get("communicationRules") || "").trim();
  if (displayName.length < 2 || displayName.length > 120 || !/^#[0-9A-Fa-f]{6}$/.test(primaryColor) || assistantInstructions.length > 8000 || communicationRules.length > 12000 || (contactEmail && !/^\S+@\S+\.\S+$/.test(contactEmail)) || (defaultLocationId && !/^[0-9a-f-]{36}$/i.test(defaultLocationId))) return { error: "Enter a company name, a six-digit color such as #0B5CFF, a valid email, valid AI instructions, and a valid location.", success: "" };
  const supabase = await createClient();
  if (defaultLocationId) {
    const { data: location } = await supabase.from("locations").select("id").eq("id", defaultLocationId).eq("organization_id", viewer.organizationId).maybeSingle();
    if (!location) return { error: "Choose a location from this organization.", success: "" };
  }
  const { error } = await supabase.from("organization_settings").upsert({ organization_id: viewer.organizationId, display_name: displayName, primary_color: primaryColor, contact_email: contactEmail || null, default_location_id: defaultLocationId || null, assistant_instructions: assistantInstructions, communication_rules: communicationRules, updated_at: new Date().toISOString() }, { onConflict: "organization_id" });
  if (error) return { error: "Settings could not be saved to the shared workspace.", success: "" };
  revalidatePath("/admin/settings");
  return { error: "", success: "Settings were saved to the shared workspace." };
}

export async function saveLocationQuoteFees(formData: FormData) {
  const viewer = await getViewer();
  if (!viewer?.organizationId || !["tenant_admin", "platform_owner"].includes(viewer.role)) throw new Error("Unauthorized");
  const locationId = String(formData.get("locationId") || "");
  const locationName = String(formData.get("locationName") || "").trim();
  const city = String(formData.get("city") || "").trim();
  const state = String(formData.get("state") || "").trim().toUpperCase();
  const tpDestination = Number(formData.get("tpDestinationFee"));
  const rrDestination = Number(formData.get("rrDestinationFee"));
  const delivery = Number(formData.get("deliveryFee"));
  const salesTaxRate = Number(formData.get("salesTaxRate"));
  if (!/^[0-9a-f-]{36}$/i.test(locationId) || locationName.length < 2 || locationName.length > 120 || city.length > 120 || state.length > 40 || !Number.isFinite(tpDestination) || tpDestination < 0 || !Number.isFinite(rrDestination) || rrDestination < 0 || !Number.isFinite(delivery) || delivery < 0 || !Number.isFinite(salesTaxRate) || salesTaxRate < 0 || salesTaxRate > 100) throw new Error("Enter a location name, valid optional city/state details, non-negative fees, and a tax rate from 0 to 100.");
  const supabase = await createClient();
  const { error } = await supabase.from("locations").update({ name: locationName, city: city || null, state: state || null, tp_destination_fee_cents: Math.round(tpDestination * 100), rr_destination_fee_cents: Math.round(rrDestination * 100), delivery_fee_cents: Math.round(delivery * 100), sales_tax_rate: salesTaxRate }).eq("id", locationId).eq("organization_id", viewer.organizationId);
  if (error) throw new Error(error.code === "23505" ? "A BGC location with that name already exists." : "Location details and quote defaults could not be saved.");
  revalidatePath("/admin/settings");
  revalidatePath("/quote-calculator");
  revalidatePath("/admin/users");
}

export async function addLocation(_previousState: AddLocationState, formData: FormData): Promise<AddLocationState> {
  const viewer = await getViewer();
  if (!viewer?.organizationId || viewer.demo || !["tenant_admin", "platform_owner"].includes(viewer.role)) {
    return { error: "Only an Admin can add BGC locations.", success: "" };
  }
  const name = String(formData.get("name") || "").trim();
  const city = String(formData.get("city") || "").trim();
  const state = String(formData.get("state") || "").trim().toUpperCase();
  if (name.length < 2 || name.length > 120 || city.length > 120 || state.length > 40) {
    return { error: "Enter a location name and optional city/state details.", success: "" };
  }
  const supabase = await createClient();
  const { data: lastLocation } = await supabase.from("locations").select("sort_order").eq("organization_id", viewer.organizationId).order("sort_order", { ascending: false }).limit(1).maybeSingle();
  const { error } = await supabase.from("locations").insert({
    organization_id: viewer.organizationId,
    name,
    city: city || null,
    state: state || null,
    is_active: true,
    sort_order: (lastLocation?.sort_order || 0) + 1,
  });
  if (error) {
    return { error: error.code === "23505" ? "A BGC location with that name already exists." : "The location could not be saved to the shared workspace.", success: "" };
  }
  revalidatePath("/admin/settings");
  revalidatePath("/admin/users");
  return { error: "", success: `${name} was added to the shared BGC workspace.` };
}

export async function reorderLocations(locationIds: string[]): Promise<{ error: string }> {
  const viewer = await getViewer();
  if (!viewer?.organizationId || viewer.demo || !["tenant_admin", "platform_owner"].includes(viewer.role)) {
    return { error: "Only an Admin can reorder BGC locations." };
  }
  if (!Array.isArray(locationIds) || locationIds.length === 0 || new Set(locationIds).size !== locationIds.length || locationIds.some((id) => !/^[0-9a-f-]{36}$/i.test(id))) {
    return { error: "The location order is invalid." };
  }
  const supabase = await createClient();
  const { data: locations, error: readError } = await supabase.from("locations").select("id").eq("organization_id", viewer.organizationId).eq("is_active", true);
  if (readError || locations?.length !== locationIds.length || locations.some((location) => !locationIds.includes(location.id))) {
    return { error: "The location list has changed. Refresh and try again." };
  }
  const results = await Promise.all(locationIds.map((id, index) => supabase.from("locations").update({ sort_order: index + 1 }).eq("id", id).eq("organization_id", viewer.organizationId)));
  if (results.some((result) => result.error)) return { error: "The location order could not be saved." };
  revalidatePath("/admin/settings/location-fees");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/users");
  revalidatePath("/quote-calculator");
  return { error: "" };
}

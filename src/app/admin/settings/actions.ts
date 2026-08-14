"use server";

import { revalidatePath } from "next/cache";
import { getViewer } from "@/lib/auth/viewer";
import { createClient } from "@/lib/supabase/server";

export async function saveLocationQuoteFees(formData: FormData) {
  const viewer = await getViewer();
  if (!viewer?.organizationId || !["tenant_admin", "platform_owner"].includes(viewer.role)) throw new Error("Unauthorized");
  const locationId = String(formData.get("locationId") || "");
  const shipping = Number(formData.get("shippingDestinationFee"));
  const delivery = Number(formData.get("deliveryFee"));
  const salesTaxRate = Number(formData.get("salesTaxRate"));
  if (!/^[0-9a-f-]{36}$/i.test(locationId) || !Number.isFinite(shipping) || shipping < 0 || !Number.isFinite(delivery) || delivery < 0 || !Number.isFinite(salesTaxRate) || salesTaxRate < 0 || salesTaxRate > 100) throw new Error("Enter valid non-negative fees and a tax rate from 0 to 100.");
  const supabase = await createClient();
  const { error } = await supabase.from("locations").update({ shipping_destination_fee_cents: Math.round(shipping * 100), delivery_fee_cents: Math.round(delivery * 100), sales_tax_rate: salesTaxRate }).eq("id", locationId).eq("organization_id", viewer.organizationId);
  if (error) throw new Error("Location quote defaults could not be saved.");
  revalidatePath("/admin/settings");
  revalidatePath("/quote-calculator");
}

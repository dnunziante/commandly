import "server-only";

import { getViewer } from "@/lib/auth/viewer";
import { createClient } from "@/lib/supabase/server";

export type OrganizationLocation = { id: string; name: string; shippingDestinationFee: number; deliveryFee: number; salesTaxRate: number };

const demoLocations: OrganizationLocation[] = [
  { id: "demo-charleston", name: "Charleston", shippingDestinationFee: 0, deliveryFee: 0, salesTaxRate: 0 },
  { id: "demo-summerville", name: "Summerville", shippingDestinationFee: 0, deliveryFee: 0, salesTaxRate: 0 },
];

export async function getOrganizationLocations(): Promise<{ locations: OrganizationLocation[]; error: string }> {
  const viewer = await getViewer();
  if (viewer?.demo) return { locations: demoLocations, error: "" };
  if (!viewer) return { locations: [], error: "Sign in to view organization locations." };
  const supabase = await createClient();
  const { data, error } = await supabase.from("locations").select("id, name, shipping_destination_fee_cents, delivery_fee_cents, sales_tax_rate").eq("organization_id", viewer.organizationId).eq("is_active", true).order("name");
  return { locations: (data ?? []).map((row) => ({ id: row.id, name: row.name, shippingDestinationFee: row.shipping_destination_fee_cents / 100, deliveryFee: row.delivery_fee_cents / 100, salesTaxRate: Number(row.sales_tax_rate) })), error: error?.message ?? "" };
}

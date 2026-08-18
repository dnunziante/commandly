import "server-only";

import type { AppRole, Viewer } from "@/lib/auth/viewer";
import type { OrganizationLocation } from "@/lib/locations";
import { createClient } from "@/lib/supabase/server";

export type CoachLocationAccess = {
  locations: OrganizationLocation[];
  selectedLocationId: string | null;
  canSelectLocation: boolean;
  scopeLabel: string;
  error?: string;
};

type MembershipLocationRow = { location_id: string | null };
type AssignmentRow = { location_id: string };
type LocationRow = {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  sort_order: number;
  tp_destination_fee_cents: number;
  rr_destination_fee_cents: number;
  delivery_fee_cents: number;
  sales_tax_rate: number | string;
};

function canViewAllLocations(role: AppRole) {
  return role === "platform_owner" || role === "tenant_admin";
}

async function assignedLocationIds(viewer: Viewer) {
  const supabase = await createClient();
  const [{ data: membership }, { data: assignments }] = await Promise.all([
    supabase
      .from("organization_memberships")
      .select("location_id")
      .eq("organization_id", viewer.organizationId)
      .eq("user_id", viewer.id)
      .eq("status", "active")
      .maybeSingle(),
    supabase
      .from("organization_member_locations")
      .select("location_id")
      .eq("organization_id", viewer.organizationId)
      .eq("user_id", viewer.id),
  ]);

  const primaryLocationId = (membership as MembershipLocationRow | null)?.location_id;
  const assignmentLocationIds = ((assignments ?? []) as AssignmentRow[]).map((assignment) => assignment.location_id);
  return [...new Set([primaryLocationId, ...assignmentLocationIds].filter((id): id is string => Boolean(id)))];
}

async function locationsForIds(viewer: Viewer, ids?: string[]) {
  const supabase = await createClient();
  let query = supabase
    .from("locations")
    .select("id, name, city, state, sort_order, tp_destination_fee_cents, rr_destination_fee_cents, delivery_fee_cents, sales_tax_rate")
    .eq("organization_id", viewer.organizationId)
    .eq("is_active", true)
    .order("sort_order")
    .order("name");

  if (ids) {
    if (!ids.length) return [];
    query = query.in("id", ids);
  }

  const { data } = await query;
  return ((data ?? []) as LocationRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    city: row.city || "",
    state: row.state || "",
    sortOrder: row.sort_order,
    tpDestinationFee: row.tp_destination_fee_cents / 100,
    rrDestinationFee: row.rr_destination_fee_cents / 100,
    deliveryFee: row.delivery_fee_cents / 100,
    salesTaxRate: Number(row.sales_tax_rate),
  }));
}

export async function getCoachLocationAccess(viewer: Viewer): Promise<CoachLocationAccess> {
  if (viewer.demo) {
    return {
      locations: [],
      selectedLocationId: null,
      canSelectLocation: viewer.role !== "salesperson",
      scopeLabel: viewer.role === "salesperson" ? "Your practice" : "All practice activity",
    };
  }

  if (canViewAllLocations(viewer.role)) {
    const locations = await locationsForIds(viewer);
    return { locations, selectedLocationId: locations[0]?.id ?? null, canSelectLocation: true, scopeLabel: "All company locations" };
  }

  const ids = await assignedLocationIds(viewer);
  const locations = await locationsForIds(viewer, ids);
  if (viewer.role === "manager") {
    return { locations, selectedLocationId: locations[0]?.id ?? null, canSelectLocation: true, scopeLabel: "Your assigned locations" };
  }

  return {
    locations: locations.slice(0, 1),
    selectedLocationId: locations[0]?.id ?? null,
    canSelectLocation: false,
    scopeLabel: "Your practice",
    error: locations.length ? undefined : "Ask an administrator to assign you to a location before starting a role-play session.",
  };
}

export async function resolveCoachSessionLocation(viewer: Viewer, requestedLocationId: string | null) {
  const access = await getCoachLocationAccess(viewer);
  if (!access.locations.length) return { error: access.error || "No active practice location is available." };

  const selectedLocationId = access.canSelectLocation ? requestedLocationId || access.selectedLocationId : access.selectedLocationId;
  if (!selectedLocationId || !access.locations.some((location) => location.id === selectedLocationId)) {
    return { error: "You do not have access to that practice location." };
  }

  return { locationId: selectedLocationId };
}

export async function getCoachSessionScope(viewer: Viewer) {
  if (canViewAllLocations(viewer.role)) return { kind: "organization" as const, locationIds: [] as string[], scopeLabel: "All company locations" };
  if (viewer.role === "manager") return { kind: "locations" as const, locationIds: await assignedLocationIds(viewer), scopeLabel: "Your assigned locations" };
  return { kind: "self" as const, locationIds: [] as string[], scopeLabel: "Your practice" };
}

import "server-only";

import { isLocalDemoMode, isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type AppRole =
  | "platform_owner"
  | "tenant_admin"
  | "manager"
  | "salesperson";

export type Viewer = {
  id: string;
  email: string;
  fullName: string;
  initials: string;
  organizationId: string;
  organizationName: string;
  role: AppRole;
  demo: boolean;
};

export const demoViewer: Viewer = {
  id: "demo-user",
  email: "demo@bgc.example",
  fullName: "Demo User",
  initials: "DU",
  organizationId: "10000000-0000-0000-0000-000000000001",
  organizationName: "BGC Dealerships",
  role: "tenant_admin",
  demo: true,
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export async function getViewer(): Promise<Viewer | null> {
  if (isLocalDemoMode()) return demoViewer;
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: membership } = await supabase
    .from("organization_memberships")
    .select("organization_id, role, organizations(name)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, is_platform_owner")
    .eq("id", user.id)
    .maybeSingle();

  const fullName = profile?.full_name || user.email?.split("@")[0] || "User";
  const organization = membership?.organizations as unknown as { name: string } | null;

  return {
    id: user.id,
    email: user.email || "",
    fullName,
    initials: initials(fullName) || "U",
    organizationId: membership?.organization_id || "",
    organizationName: organization?.name || "No organization",
    role: profile?.is_platform_owner
      ? "platform_owner"
      : ((membership?.role as AppRole | undefined) || "salesperson"),
    demo: false,
  };
}

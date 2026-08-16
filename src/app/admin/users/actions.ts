"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getViewer } from "@/lib/auth/viewer";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type InviteUserState = { error: string; success: string };
export type ChangeRoleState = { error: string; success: string };
export type ChangeLocationState = { error: string; success: string };

const validRoles = new Set(["manager", "salesperson"]);
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function inviteUser(_previousState: InviteUserState, formData: FormData): Promise<InviteUserState> {
  const viewer = await getViewer();
  if (viewer?.demo || !viewer || !["tenant_admin", "platform_owner"].includes(viewer.role)) {
    return { error: "Only an Admin can invite users.", success: "" };
  }

  const firstName = String(formData.get("firstName") || "").trim();
  const lastName = String(formData.get("lastName") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const role = String(formData.get("role") || "");
  const locationId = String(formData.get("locationId") || "");
  const requestedOrganizationId = String(formData.get("organizationId") || "");
  const organizationId = viewer.role === "platform_owner" && uuidPattern.test(requestedOrganizationId) ? requestedOrganizationId : viewer.organizationId;
  if (!organizationId || !firstName || !lastName || !phone || !/^\S+@\S+\.\S+$/.test(email) || !validRoles.has(role) || !uuidPattern.test(locationId)) {
    return { error: "Enter a first name, last name, phone, email, role, and location.", success: "" };
  }

  try {
    const admin = createAdminClient();
    const { data: location } = await admin
      .from("locations")
      .select("id, name")
      .eq("id", locationId)
      .eq("organization_id", organizationId)
      .maybeSingle();
    if (!location) return { error: "Choose a location in this BGC workspace.", success: "" };

    const requestHeaders = await headers();
    const protocol = requestHeaders.get("x-forwarded-proto") || "http";
    const host = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host");
    const redirectTo = host ? `${protocol}://${host}/auth/callback?next=/auth/accept` : undefined;
    const { data: invitation, error: authError } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo,
      data: { full_name: `${firstName} ${lastName}` },
    });
    if (authError || !invitation.user) return { error: authError?.message || "The invitation email could not be sent.", success: "" };

    const { error: profileError } = await admin.from("profiles").upsert({ id: invitation.user.id, full_name: `${firstName} ${lastName}`, first_name: firstName, last_name: lastName, phone, email }, { onConflict: "id" });
    if (profileError) return { error: "The email was sent, but the user profile could not be saved. Contact an administrator before the person signs in.", success: "" };

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const invitationRecord = {
        organization_id: organizationId,
        email,
        first_name: firstName,
        last_name: lastName,
        phone,
        role,
        location_id: location.id,
        auth_user_id: invitation.user.id,
        status: "pending",
        invited_by: viewer.id,
        expires_at: expiresAt,
        accepted_by: null,
        accepted_at: null,
      };
    const { data: existingInvite, error: existingInviteError } = await admin
      .from("organization_invitations")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("email", email)
      .eq("status", "pending")
      .maybeSingle();
    if (existingInviteError) return { error: "The email was sent, but its workspace assignment could not be checked. Contact an administrator before the person signs in.", success: "" };
    const { error: dataError } = existingInvite
      ? await admin.from("organization_invitations").update(invitationRecord).eq("id", existingInvite.id)
      : await admin.from("organization_invitations").insert(invitationRecord);
    if (dataError) return { error: "The email was sent, but its workspace assignment could not be saved. Contact an administrator before the person signs in.", success: "" };

    revalidatePath("/admin/users");
    return { error: "", success: `${role === "manager" ? "Manager" : "Employee"} invitation sent to ${email} for ${location.name}.` };
  } catch (error) {
    const message = error instanceof Error ? error.message : "The invitation could not be prepared.";
    return { error: message, success: "" };
  }
}

export async function changeUserRole(_previousState: ChangeRoleState, formData: FormData): Promise<ChangeRoleState> {
  const viewer = await getViewer();
  if (viewer?.demo || !viewer || !["tenant_admin", "platform_owner"].includes(viewer.role)) {
    return { error: "Only an Admin can change roles.", success: "" };
  }
  const membershipId = String(formData.get("membershipId") || "");
  const role = String(formData.get("role") || "");
  if (!uuidPattern.test(membershipId) || !["tenant_admin", "manager", "salesperson"].includes(role)) {
    return { error: "Choose a valid role.", success: "" };
  }
  const supabase = await createClient();
  const { data: membership } = await supabase.from("organization_memberships").select("user_id, role, organization_id").eq("id", membershipId).maybeSingle();
  if (!membership) return { error: "That team membership was not found.", success: "" };
  if (viewer.role !== "platform_owner" && membership.organization_id !== viewer.organizationId) return { error: "That user is outside your workspace.", success: "" };
  if (membership.user_id === viewer.id) return { error: "Use another Admin to change your own role.", success: "" };
  if (membership.role === "tenant_admin" && role !== "tenant_admin") {
    const { count } = await supabase.from("organization_memberships").select("id", { count: "exact", head: true }).eq("organization_id", membership.organization_id).eq("role", "tenant_admin").eq("status", "active");
    if ((count || 0) < 2) return { error: "Keep at least one active Admin in the BGC workspace.", success: "" };
  }
  const { error } = await supabase.from("organization_memberships").update({ role }).eq("id", membershipId).eq("organization_id", membership.organization_id);
  if (error) return { error: "The role could not be updated.", success: "" };
  revalidatePath("/admin/users");
  return { error: "", success: "Team role updated." };
}

export async function changeUserLocation(_previousState: ChangeLocationState, formData: FormData): Promise<ChangeLocationState> {
  const viewer = await getViewer();
  if (viewer?.demo || !viewer || !["tenant_admin", "platform_owner"].includes(viewer.role)) return { error: "Only an Admin can change locations.", success: "" };
  const membershipId = String(formData.get("membershipId") || "");
  const locationId = String(formData.get("locationId") || "");
  if (!uuidPattern.test(membershipId) || !uuidPattern.test(locationId)) return { error: "Choose a valid location.", success: "" };
  const supabase = await createClient();
  const { data: membership } = await supabase.from("organization_memberships").select("organization_id").eq("id", membershipId).maybeSingle();
  if (!membership || (viewer.role !== "platform_owner" && membership.organization_id !== viewer.organizationId)) return { error: "That user is outside your workspace.", success: "" };
  const { data: location } = await supabase.from("locations").select("id").eq("id", locationId).eq("organization_id", membership.organization_id).maybeSingle();
  if (!location) return { error: "Choose a location in the user's tenant.", success: "" };
  const { error } = await supabase.from("organization_memberships").update({ location_id: location.id }).eq("id", membershipId).eq("organization_id", membership.organization_id);
  if (error) return { error: "The location could not be updated.", success: "" };
  revalidatePath("/admin/users");
  return { error: "", success: "User location updated." };
}

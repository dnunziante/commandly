import { AppShell } from "@/components/app-shell";
import { InviteUserForm } from "@/components/invite-user-form";
import { ChangeUserRoleForm } from "@/components/change-user-role-form";
import { PageHeader } from "@/components/page-header";
import { getViewer } from "@/lib/auth/viewer";
import { getOrganizationLocations } from "@/lib/locations";
import { createClient } from "@/lib/supabase/server";

export default async function UsersPage() {
  const [viewer, locationResult] = await Promise.all([getViewer(), getOrganizationLocations()]);
  const supabase = await createClient();
  const organizationId = viewer?.organizationId || "";
  const [{ data: members }, { data: pendingInvites }] = organizationId ? await Promise.all([
    supabase.from("organization_memberships").select("id, role, status, profiles(full_name), locations(name)").eq("organization_id", organizationId).order("created_at"),
    supabase.from("organization_invitations").select("id, email, role, expires_at, locations(name)").eq("organization_id", organizationId).eq("status", "pending").order("created_at", { ascending: false }),
  ]) : [{ data: [] }, { data: [] }];
  const canInvite = Boolean(viewer && !viewer.demo && ["tenant_admin", "platform_owner"].includes(viewer.role));
  const roleLabel = (role: string) => role === "tenant_admin" ? "Admin" : role === "salesperson" ? "Employee" : "Manager";

  return <AppShell title="Admin · Users"><PageHeader eyebrow="Team access" title="Invite and assign BGC users" description="Roles and locations are saved in the shared BGC workspace, not on this computer." />
    <InviteUserForm locations={locationResult.locations.map(({ id, name }) => ({ id, name }))} canInvite={canInvite} />
    <section className="card" style={{ marginTop: 18 }}><h2>Current team</h2>{members?.length ? <div className="admin-settings-list">{members.map((member) => <div className="activity-row" key={member.id}><div style={{ flex: 1 }}><strong>{(member.profiles as unknown as { full_name: string } | null)?.full_name || "Team member"}</strong><p style={{ margin: 2, fontSize: 12 }}>{roleLabel(member.role)} · {(member.locations as unknown as { name: string } | null)?.name || "No location assigned"}</p></div>{canInvite ? <ChangeUserRoleForm membershipId={member.id} currentRole={member.role} /> : <span className="badge">{member.status}</span>}</div>)}</div> : <p>No active team members yet.</p>}</section>
    <section className="card" style={{ marginTop: 18 }}><h2>Pending invitations</h2>{pendingInvites?.length ? <div className="admin-settings-list">{pendingInvites.map((invitation) => <div className="activity-row" key={invitation.id}><div style={{ flex: 1 }}><strong>{invitation.email}</strong><p style={{ margin: 2, fontSize: 12 }}>{roleLabel(invitation.role)} · {(invitation.locations as unknown as { name: string } | null)?.name || "No location assigned"}</p></div><span className="badge amber">Pending</span></div>)}</div> : <p>No pending invitations.</p>}</section>
  </AppShell>;
}

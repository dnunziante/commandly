"use client";

import { useMemo, useState } from "react";
import { ChangeUserLocationForm } from "@/components/change-user-location-form";
import { ChangeUserRoleForm } from "@/components/change-user-role-form";

export type UserRow = {
  id: string;
  kind: "member" | "invitation";
  name: string;
  email: string;
  phone: string;
  organizationId: string;
  organizationName: string;
  locationId: string | null;
  locationName: string;
  role: string;
  status: string;
};
type Location = { id: string; name: string; organizationId: string };
type Tenant = { id: string; name: string };

const roleLabel = (role: string) => role === "tenant_admin" ? "Admin" : role === "manager" ? "Manager" : "Employee";
const statusLabel = (status: string) => status === "pending" || status === "invited" ? "Invitation Pending" : status === "suspended" ? "Disabled" : "Active";

export function UsersManagementTable({ users, locations, tenants, canManage, isPlatformOwner }: { users: UserRow[]; locations: Location[]; tenants: Tenant[]; canManage: boolean; isPlatformOwner: boolean }) {
  const [search, setSearch] = useState("");
  const [tenantId, setTenantId] = useState("all");
  const [locationId, setLocationId] = useState("all");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const visibleLocations = locations.filter((location) => !isPlatformOwner || tenantId === "all" || location.organizationId === tenantId);
  const results = useMemo(() => users.filter((user) => {
    const query = search.trim().toLowerCase();
    return (!query || `${user.name} ${user.email}`.toLowerCase().includes(query))
      && (!isPlatformOwner || tenantId === "all" || user.organizationId === tenantId)
      && (locationId === "all" || user.locationId === locationId)
      && (role === "all" || user.role === role)
      && (status === "all" || user.status === status);
  }), [users, search, tenantId, locationId, role, status, isPlatformOwner]);

  function changeTenant(value: string) { setTenantId(value); setLocationId("all"); }

  return <section className="card users-management-card" style={{ marginTop: 18 }}>
    <div className="users-management-heading"><div><h2>Users</h2><p>Search, filter, and manage access for {isPlatformOwner ? "every tenant" : "this workspace"}.</p></div><strong>{results.length} shown</strong></div>
    <div className="user-filters">
      <label className="user-search"><span>Search</span><input className="input" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name or email" /></label>
      {isPlatformOwner ? <label><span>Tenant</span><select className="input" value={tenantId} onChange={(event) => changeTenant(event.target.value)}><option value="all">All Tenants</option>{tenants.map((tenant) => <option value={tenant.id} key={tenant.id}>{tenant.name}</option>)}</select></label> : null}
      <label><span>Location</span><select className="input" value={locationId} onChange={(event) => setLocationId(event.target.value)}><option value="all">All Locations</option>{visibleLocations.map((location) => <option value={location.id} key={location.id}>{location.name}</option>)}</select></label>
      <label><span>Role</span><select className="input" value={role} onChange={(event) => setRole(event.target.value)}><option value="all">All Roles</option><option value="tenant_admin">Admin</option><option value="manager">Manager</option><option value="salesperson">Employee</option></select></label>
      <label><span>Status</span><select className="input" value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All Users</option><option value="active">Active</option><option value="pending">Invitation Pending</option><option value="suspended">Disabled</option></select></label>
    </div>
    <div className="table-wrap users-table-wrap"><table className="table users-table"><thead><tr><th>Name</th>{isPlatformOwner ? <th>Tenant</th> : null}<th>Email</th><th>Phone</th><th>Location</th><th>Role</th><th>Status</th></tr></thead><tbody>{results.map((user) => <tr key={`${user.kind}-${user.id}`}><td data-label="Name"><strong>{user.name || "—"}</strong></td>{isPlatformOwner ? <td data-label="Tenant">{user.organizationName}</td> : null}<td data-label="Email"><a className="user-email" href={`mailto:${user.email}`}>{user.email}</a></td><td data-label="Phone">{user.phone || "—"}</td><td data-label="Location">{user.kind === "member" && canManage ? <ChangeUserLocationForm membershipId={user.id} currentLocationId={user.locationId} locations={locations.filter((location) => location.organizationId === user.organizationId)} /> : user.locationName}</td><td data-label="Role">{user.kind === "member" && canManage ? <ChangeUserRoleForm membershipId={user.id} currentRole={user.role} /> : roleLabel(user.role)}</td><td data-label="Status"><span className={`badge ${user.status === "pending" ? "amber" : user.status === "suspended" ? "disabled" : ""}`}>{statusLabel(user.status)}</span></td></tr>)}{results.length === 0 ? <tr><td colSpan={isPlatformOwner ? 7 : 6} className="users-empty">No users match these filters.</td></tr> : null}</tbody></table></div>
  </section>;
}

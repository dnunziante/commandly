"use client";

import { useActionState } from "react";
import { inviteUser, type InviteUserState } from "@/app/admin/users/actions";

type Location = { id: string; name: string };
const initialState: InviteUserState = { error: "", success: "" };

export function InviteUserForm({ locations, canInvite }: { locations: Location[]; canInvite: boolean }) {
  const [state, action, pending] = useActionState(inviteUser, initialState);
  if (!canInvite) return null;

  return <form action={action} className="card" style={{ marginTop: 18 }}>
    <h2>Invite a team member</h2>
    <p>They will receive a secure email invitation. Their BGC role and location are assigned when they accept it.</p>
    <div className="form-grid">
      <label>Email address<input className="input" name="email" type="email" required placeholder="name@company.com" /></label>
      <label>Role<select className="input" name="role" defaultValue="salesperson"><option value="manager">Manager</option><option value="salesperson">Employee</option></select></label>
      <label>Location<select className="input" name="locationId" required defaultValue=""><option value="" disabled>Select a BGC location</option>{locations.map((location) => <option value={location.id} key={location.id}>{location.name}</option>)}</select></label>
    </div>
    {state.error ? <p className="form-error" role="alert">{state.error}</p> : null}
    {state.success ? <p className="form-success" role="status">{state.success}</p> : null}
    <button className="btn btn-primary" type="submit" disabled={pending || locations.length === 0}>{pending ? "Sending invitation…" : "Send invitation"}</button>
  </form>;
}

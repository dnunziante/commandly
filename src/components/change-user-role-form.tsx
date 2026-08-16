"use client";

import { useActionState } from "react";
import { changeUserRole, type ChangeRoleState } from "@/app/admin/users/actions";

const initialState: ChangeRoleState = { error: "", success: "" };

export function ChangeUserRoleForm({ membershipId, currentRole }: { membershipId: string; currentRole: string }) {
  const [state, action, pending] = useActionState(changeUserRole, initialState);
  return <form action={action} style={{ display: "flex", gap: 8, alignItems: "center" }}>
    <input type="hidden" name="membershipId" value={membershipId} />
    <select className="input" name="role" defaultValue={currentRole} aria-label="Team role" style={{ width: 130 }}>
      <option value="tenant_admin">Admin</option><option value="manager">Manager</option><option value="salesperson">Employee</option>
    </select>
    <button className="btn btn-ghost" type="submit" disabled={pending}>{pending ? "Saving…" : "Save"}</button>
    {state.error ? <span className="form-error">{state.error}</span> : null}
    {state.success ? <span className="form-success">{state.success}</span> : null}
  </form>;
}

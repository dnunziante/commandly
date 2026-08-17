"use client";

import { useActionState } from "react";
import { ArrowRight } from "lucide-react";
import { setInvitationPassword, type SetInvitationPasswordState } from "@/app/auth/accept/actions";

const initialState: SetInvitationPasswordState = { error: "" };

export function SetInvitationPasswordForm() {
  const [state, action, pending] = useActionState(setInvitationPassword, initialState);

  return <form action={action} className="form-stack" style={{ marginTop: 24 }}>
    <div>
      <label className="label" htmlFor="password">Create password</label>
      <input className="input" id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
      <small className="field-help">Use at least 8 characters.</small>
    </div>
    <div>
      <label className="label" htmlFor="confirmation">Confirm password</label>
      <input className="input" id="confirmation" name="confirmation" type="password" autoComplete="new-password" minLength={8} required />
    </div>
    {state.error && <p className="form-error" role="alert">{state.error}</p>}
    <button className="btn btn-primary" disabled={pending} type="submit">{pending ? "Creating your account…" : <>Create account <ArrowRight size={16}/></>}</button>
  </form>;
}

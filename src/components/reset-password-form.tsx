"use client";

import { useActionState } from "react";
import { ArrowRight } from "lucide-react";
import { resetPassword, type ResetPasswordState } from "@/app/auth/reset-password/actions";

const initialState: ResetPasswordState = { error: "" };

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState(resetPassword, initialState);
  return <form action={action} className="form-stack" style={{ marginTop: 24 }}>
    <div><label className="label" htmlFor="password">New password</label><input className="input" id="password" name="password" type="password" autoComplete="new-password" minLength={8} required /></div>
    <div><label className="label" htmlFor="confirmation">Confirm new password</label><input className="input" id="confirmation" name="confirmation" type="password" autoComplete="new-password" minLength={8} required /></div>
    {state.error && <p className="form-error" role="alert">{state.error}</p>}
    <button className="btn btn-primary" disabled={pending} type="submit">{pending ? "Saving password…" : <>Save password <ArrowRight size={16}/></>}</button>
  </form>;
}

"use client";

import { useActionState } from "react";
import { ArrowRight } from "lucide-react";
import { requestPasswordRecovery, type PasswordRecoveryState } from "@/app/auth/forgot-password/actions";

const initialState: PasswordRecoveryState = { error: "", success: "" };

export function PasswordRecoveryForm() {
  const [state, action, pending] = useActionState(requestPasswordRecovery, initialState);

  return <form action={action} className="form-stack" style={{ marginTop: 24 }}>
    <div>
      <label className="label" htmlFor="email">Work email</label>
      <input className="input" id="email" name="email" type="email" autoComplete="email" required placeholder="you@dealership.com" />
    </div>
    {state.error && <p className="form-error" role="alert">{state.error}</p>}
    {state.success && <p className="form-success" role="status">{state.success}</p>}
    <button className="btn btn-primary" disabled={pending} type="submit">{pending ? "Sending reset link…" : <>Email reset link <ArrowRight size={16}/></>}</button>
  </form>;
}

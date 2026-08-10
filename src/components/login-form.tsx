"use client";

import { useActionState } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { login, type LoginState } from "@/app/auth/actions";

const initialState: LoginState = { error: "" };

export function LoginForm({ demoMode }: { demoMode: boolean }) {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form className="login-form" action={formAction}>
      <div className="eyebrow">Welcome back</div>
      <h1>Sign in to your workspace</h1>
      <p>
        {demoMode
          ? "Supabase is not connected yet. Continue into the protected-layout demo."
          : "Use your organization account to continue."}
      </p>
      <div className="form-stack" style={{ marginTop: 25 }}>
        <div>
          <label className="label" htmlFor="email">Work email</label>
          <input className="input" id="email" name="email" type="email" autoComplete="email" required={!demoMode} placeholder="you@dealership.com" />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input className="input" id="password" name="password" type="password" autoComplete="current-password" required={!demoMode} placeholder="••••••••" />
        </div>
        {state.error && <p className="form-error" role="alert">{state.error}</p>}
        <button className="btn btn-primary" disabled={pending} type="submit">
          {pending ? <><LoaderCircle className="spin" size={16}/> Signing in…</> : <>{demoMode ? "Continue to demo" : "Sign in"} <ArrowRight size={16}/></>}
        </button>
      </div>
      <div className="demo-note">
        {demoMode
          ? "Demo mode is active because Supabase environment variables are empty."
          : "Authentication is handled securely by Supabase. Credentials are never stored in this page."}
      </div>
    </form>
  );
}

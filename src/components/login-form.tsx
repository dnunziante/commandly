"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function LoginForm({ configured, demoMode, nextPath }: { configured: boolean; demoMode: boolean; nextPath: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(formData: FormData) {
    if (demoMode) {
      router.push(nextPath);
      return;
    }
    if (!configured) {
      setError("Workspace sign-in is not configured.");
      return;
    }
    setPending(true);
    setError("");
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError(signInError.message === "Invalid login credentials" ? "The email or password is incorrect." : "Sign-in could not be completed. Please try again.");
      setPending(false);
      return;
    }
    router.push(nextPath);
    router.refresh();
  }

  return (
    <form className="login-form" action={submit}>
      <div className="eyebrow">Welcome back</div>
      <h1>Sign in to your workspace</h1>
      <p>
        {demoMode
          ? "Local demo mode is enabled. Continue into the protected-layout demo."
          : configured
            ? "Use your organization account to continue."
            : "Workspace sign-in is not configured. Ask the platform owner to complete the deployment settings."}
      </p>
      <div className="form-stack" style={{ marginTop: 25 }}>
        <div>
          <label className="label" htmlFor="email">Work email</label>
          <input className="input" disabled={!configured && !demoMode} id="email" name="email" type="email" autoComplete="email" required={!demoMode} placeholder="you@dealership.com" />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input className="input" disabled={!configured && !demoMode} id="password" name="password" type="password" autoComplete="current-password" required={!demoMode} placeholder="••••••••" />
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="btn btn-primary" disabled={pending || (!configured && !demoMode)} type="submit">
          {pending ? <><LoaderCircle className="spin" size={16}/> Signing in…</> : <>{demoMode ? "Continue to demo" : "Sign in"} <ArrowRight size={16}/></>}
        </button>
      </div>
      <div className="demo-note">
        {demoMode
          ? "Local demo mode is active and is automatically disabled in production."
          : configured
            ? "Authentication is handled securely by Supabase. Credentials are never stored in this page."
            : "Set the Supabase URL and publishable key in the deployment environment before inviting users."}
      </div>
    </form>
  );
}

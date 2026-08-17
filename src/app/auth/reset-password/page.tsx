import { redirect } from "next/navigation";
import { ResetPasswordForm } from "@/components/reset-password-form";
import { createClient } from "@/lib/supabase/server";

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/forgot-password");
  return <main className="auth-shell"><section className="auth-card"><p className="eyebrow">Password help</p><h1>Choose a new password</h1><p>Your new password will be used the next time you sign in.</p><ResetPasswordForm/></section></main>;
}

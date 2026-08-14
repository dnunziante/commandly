"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { isLocalDemoMode, isSupabaseConfigured, publicDemoCookieName } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { error: string };

export async function login(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  if (isLocalDemoMode()) {
    redirect("/dashboard");
  }

  if (!isSupabaseConfigured()) return { error: "Workspace sign-in is not configured." };

  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "The email or password is incorrect." };
  }

  redirect("/dashboard");
}

export async function logout() {
  (await cookies()).delete(publicDemoCookieName);
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/login");
}

"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type SetInvitationPasswordState = { error: string };

export async function setInvitationPassword(
  _previousState: SetInvitationPasswordState,
  formData: FormData,
): Promise<SetInvitationPasswordState> {
  const password = String(formData.get("password") || "");
  const confirmation = String(formData.get("confirmation") || "");

  if (password.length < 8) return { error: "Use at least 8 characters for your password." };
  if (password !== confirmation) return { error: "The passwords do not match." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Your invitation session has expired. Ask an administrator to send a new invitation." };

  const { error: passwordError } = await supabase.auth.updateUser({ password });
  if (passwordError) return { error: "Your password could not be saved. Please try again." };

  const { error: invitationError } = await supabase.rpc("accept_organization_invitation");
  if (invitationError) return { error: "Your password was saved, but this invitation is no longer available. Ask an administrator for a new invitation." };

  redirect("/dashboard?invited=1");
}

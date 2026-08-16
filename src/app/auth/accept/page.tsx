import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AcceptInvitationPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?message=sign-in-to-accept-invite");

  const { error } = await supabase.rpc("accept_organization_invitation");
  if (!error) redirect("/dashboard?invited=1");

  return <main className="auth-shell"><section className="auth-card"><p className="eyebrow">Invitation</p><h1>Invitation not available</h1><p>This invitation may have expired, already been accepted, or belong to a different email address.</p><Link className="btn btn-primary" href="/dashboard">Continue to Refyntra</Link></section></main>;
}

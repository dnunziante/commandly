import { notFound } from "next/navigation";
import Login from "@/app/login/page";
import { isLocalDemoMode } from "@/lib/supabase/config";

export default function LoginPreviewPage() {
  if (!isLocalDemoMode()) notFound();
  return <Login/>;
}

import Image from "next/image";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { LoginForm } from "@/components/login-form";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function Login() {
  const demoMode = !isSupabaseConfigured();
  return <main className="login-page">
    <section className="login-side">
      <Link className="login-logo" href="/" aria-label="Refyntra home">
        <Image src="/refyntra-logo.png" alt="Refyntra — Refine. Transform. Perform." width={1536} height={1024} priority />
      </Link>
      <div><h1>Run your business with clarity.</h1><p><CheckCircle2 size={17}/> <span><strong>Sell smarter</strong> — Turn product knowledge and proven methodology into better customer conversations.</span></p><p><CheckCircle2 size={17}/> <span><strong>Develop your team</strong> — Coach, train, and build stronger performance.</span></p><p><CheckCircle2 size={17}/> <span><strong>Find opportunities</strong> — Use business and market intelligence to identify where to grow.</span></p></div>
      <small>Refine. Transform. Perform.</small>
    </section>
    <section className="login-form-wrap"><LoginForm demoMode={demoMode}/></section>
  </main>;
}

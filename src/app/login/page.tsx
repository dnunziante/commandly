import Image from "next/image";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { LoginForm } from "@/components/login-form";
import { isLocalDemoMode, isSupabaseConfigured } from "@/lib/supabase/config";

export default async function Login({ searchParams }: { searchParams?: Promise<{ next?: string }> }) {
  const { next } = searchParams ? await searchParams : {};
  const demoMode = isLocalDemoMode();
  const configured = isSupabaseConfigured();
  const nextPath = next?.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  return <main className="login-page">
    <section className="login-side">
      <Link className="login-logo" href="/" aria-label="Commandly home">
        <Image src="/commandly-logo-light.png" alt="Commandly — Your business. One command center." width={1976} height={796} priority />
      </Link>
      <div><h1>Run your business with clarity.</h1><p><CheckCircle2 size={17}/> <span><strong>Sell smarter</strong> — Turn product knowledge and proven methodology into better customer conversations.</span></p><p><CheckCircle2 size={17}/> <span><strong>Develop your team</strong> — Coach, train, and build stronger performance.</span></p><p><CheckCircle2 size={17}/> <span><strong>Find opportunities</strong> — Use business and market intelligence to identify where to grow.</span></p></div>
      <small>One platform. Smarter decisions. Better execution.</small>
    </section>
    <section className="login-form-wrap"><LoginForm configured={configured} demoMode={demoMode} nextPath={nextPath}/></section>
  </main>;
}

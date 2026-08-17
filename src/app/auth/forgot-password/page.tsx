import Link from "next/link";
import { PasswordRecoveryForm } from "@/components/password-recovery-form";

export default function ForgotPasswordPage() {
  return <main className="auth-shell"><section className="auth-card"><p className="eyebrow">Password help</p><h1>Reset your password</h1><p>Enter your work email and we&apos;ll send a secure reset link.</p><PasswordRecoveryForm/><Link className="btn btn-ghost" href="/login" style={{ marginTop: 14 }}>Back to sign in</Link></section></main>;
}

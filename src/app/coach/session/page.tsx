import { AppShell } from "@/components/app-shell";
import { AdaptiveCoachSession } from "@/components/adaptive-coach-session";
import { PageHeader } from "@/components/page-header";

export default async function CoachSessionPage({ searchParams }: { searchParams: Promise<{ mode?: string }> }) { const { mode } = await searchParams; const initialMode = mode === "objection" || mode === "challenge" ? mode : "role_play"; return <AppShell title="Adaptive Role-Play"><PageHeader eyebrow="Dynamic customer simulation" title="Practice the conversation, not a script" description="The customer reacts to what you say. Their hidden situation and your next challenge are tailored to your saved coaching profile."/><AdaptiveCoachSession initialMode={initialMode}/></AppShell>; }

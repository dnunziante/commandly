"use client";

import { BellRing, CheckCircle2, Save } from "lucide-react";
import { useState } from "react";
import { saveExecutiveEscalationSettings } from "@/app/admin/executive/actions";
import type { ExecutiveEscalationSettings } from "@/lib/executive/escalations";

export function ExecutiveEscalationEditor({ initialSettings, persistence }: { initialSettings: ExecutiveEscalationSettings; persistence: "demo" | "supabase" }) {
  const [settings, setSettings] = useState(initialSettings); const [saving, setSaving] = useState(false); const [error, setError] = useState(""); const [notice, setNotice] = useState("");
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setSaving(true); setError(""); setNotice("");
    if (persistence === "demo") { setNotice("Rules updated for this prototype view only."); setSaving(false); return; }
    const result = await saveExecutiveEscalationSettings(settings); setSaving(false);
    if (result.error) setError(result.error); else setNotice("Escalation rules saved for this organization.");
  }
  return <form className="card executive-target-editor executive-escalation-editor" onSubmit={submit}><div className="metric-row"><div><span className="badge blue">Accountability rules</span><h2>Reminders and escalations</h2></div><BellRing size={20}/></div><p>These rules create an in-app notification queue from review due dates. Email and text delivery are not connected.</p><label className="executive-toggle"><input type="checkbox" checked={settings.enabled} onChange={(event) => setSettings((current) => ({ ...current, enabled: event.target.checked }))}/><span><strong>Enable accountability notices</strong><small>Show due-soon, overdue, unassigned, and escalation notices.</small></span></label><div className="executive-target-grid"><label><span className="label">Remind before due date <small>0–30 days</small></span><input className="input" type="number" min="0" max="30" required value={settings.remindBeforeDays} onChange={(event) => setSettings((current) => ({ ...current, remindBeforeDays: Number(event.target.value) }))}/><small className="field-help">A reminder appears this many days before the due date.</small></label><label><span className="label">Escalate after overdue <small>0–30 days</small></span><input className="input" type="number" min="0" max="30" required value={settings.escalateAfterDays} onChange={(event) => setSettings((current) => ({ ...current, escalateAfterDays: Number(event.target.value) }))}/><small className="field-help">An escalation replaces the reminder after this many overdue days.</small></label><label><span className="label">Escalation recipient</span><input className="input" maxLength={100} required value={settings.escalationRecipient} onChange={(event) => setSettings((current) => ({ ...current, escalationRecipient: event.target.value }))}/><small className="field-help">A clear role or team label, such as Tenant administrator.</small></label></div>{error && <p className="form-error">{error}</p>}{notice && <p className="improvement-saved"><CheckCircle2 size={15}/>{notice}</p>}<button className="btn btn-primary" type="submit" disabled={saving}><Save size={16}/>{saving ? "Saving rules…" : "Save escalation rules"}</button></form>;
}

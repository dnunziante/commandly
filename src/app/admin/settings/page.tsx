"use client";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);
  return <AppShell title="Admin · Settings">
    <PageHeader eyebrow="Customization" title="Company branding and settings" description="Change the information each tenant will see in its version of the application." />
    <div className="card" style={{maxWidth: 760}}>
      <div className="grid grid-2"><div><label className="label">Company name</label><input className="input" defaultValue="BGC"/></div><div><label className="label">Primary color</label><input className="input" defaultValue="#0B5CFF"/></div><div><label className="label">Contact email</label><input className="input" defaultValue="sales@example.com"/></div><div><label className="label">Default location</label><input className="input" defaultValue="Myrtle Beach"/></div></div>
      <br/><label className="label">AI company instructions</label><textarea className="input" rows={7} defaultValue="Use approved product information, ask discovery questions, and never invent pricing or availability."/>
      <br/><br/><button className="btn btn-primary" onClick={()=>setSaved(true)}>Save sample settings</button>{saved && <span style={{marginLeft: 12}} className="badge">Saved locally</span>}
    </div>
  </AppShell>;
}

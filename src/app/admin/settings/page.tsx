import { AppShell } from "@/components/app-shell";
import { LocationQuoteFeeEditor } from "@/components/location-quote-fee-editor";
import { PageHeader } from "@/components/page-header";
import { getOrganizationLocations } from "@/lib/locations";

export default async function SettingsPage() {
  const { locations, error } = await getOrganizationLocations();
  return <AppShell title="Admin · Settings">
    <PageHeader eyebrow="Customization" title="Company branding and settings" description="Change the information each tenant will see in its version of the application." />
    <div className="card" style={{maxWidth: 760}}>
      <div className="grid grid-2"><div><label className="label">Company name</label><input className="input" defaultValue="BGC"/></div><div><label className="label">Primary color</label><input className="input" defaultValue="#0B5CFF"/></div><div><label className="label">Contact email</label><input className="input" defaultValue="sales@example.com"/></div><div><label className="label">Default location</label><input className="input" defaultValue="Myrtle Beach"/></div></div>
      <br/><label className="label">AI company instructions</label><textarea className="input" rows={7} defaultValue="Use approved product information, ask discovery questions, and never invent pricing or availability."/>
      <br/><br/><button className="btn btn-primary" type="button">Save sample settings</button>
    </div>
    {error ? <div className="card error-card" style={{marginTop:18}}><h2>Locations unavailable</h2><p>{error}</p></div> : <div style={{marginTop:18}}><LocationQuoteFeeEditor locations={locations}/></div>}
  </AppShell>;
}

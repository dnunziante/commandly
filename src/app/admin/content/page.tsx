import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";

export default function AdminContentPage() {
  return <AppShell title="Admin · Sales Content">
    <PageHeader eyebrow="Content manager" title="Sales content" description="Manage the information representatives use throughout the sales process." />
    <div className="grid grid-3">{["Sales scripts", "Objection responses", "Email templates", "Text templates", "Role-play scenarios", "Training resources", "AI instructions", "Knowledge documents", "Locations and users"].map(item=><div className="card" key={item}><h2>{item}</h2><p>Sample management section ready to connect to Supabase.</p><button className="btn btn-secondary">Manage</button></div>)}</div>
  </AppShell>;
}

import { BookOpenText, FileCheck2, FileText, UploadCloud } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Card, IconTile, StatusPill } from "@/components/ui";

const resources = [
  ["2026 Product Guide", "Product guide", "Updated 2 days ago", FileCheck2, "green"],
  ["Financing FAQ", "Sales policy", "Updated 1 week ago", FileText, "blue"],
  ["Delivery & Setup", "Operations guide", "Updated 3 weeks ago", BookOpenText, "violet"],
] as const;

export default function KnowledgePage() {
  return <AppShell title="Knowledge Base">
    <PageHeader eyebrow="Approved resources" title="Your team’s source of truth" description="Browse the sample resources the AI assistant will use after knowledge retrieval is connected." action={<button className="btn btn-primary"><UploadCloud size={18} /> Add resource</button>} />
    <div className="grid grid-3">
      {resources.map(([name, type, updated, Icon, tone]) => <Card key={name}>
        <div className="card-row"><IconTile tone={tone}><Icon size={21} /></IconTile><StatusPill>Approved</StatusPill></div>
        <h2 className="card-title">{name}</h2><p className="card-meta">{type} · {updated}</p>
        <button className="text-button">View resource <span aria-hidden="true">→</span></button>
      </Card>)}
    </div>
    <Card className="empty-state"><UploadCloud size={28} /><div><h2>Knowledge uploads come next</h2><p>This milestone uses sample data only. File storage, processing, and AI retrieval will be added in later roadmap stages.</p></div></Card>
  </AppShell>;
}

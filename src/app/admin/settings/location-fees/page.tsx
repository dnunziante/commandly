import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { LocationQuoteFeeEditor } from "@/components/location-quote-fee-editor";
import { PageHeader } from "@/components/page-header";
import { getOrganizationLocations } from "@/lib/locations";

export default async function LocationFeesPage() {
  const locationResult = await getOrganizationLocations();
  return <AppShell title="Location fees and details">
    <PageHeader eyebrow="Quote Calculator" title="Location fees and details" description="Manage the shared location information and delivered-price defaults used when salespeople build quotes." action={<Link className="btn btn-ghost" href="/admin/settings"><ArrowLeft size={16}/> Settings</Link>} />
    {locationResult.error ? <div className="card error-card"><h2>Locations unavailable</h2><p>{locationResult.error}</p></div> : <LocationQuoteFeeEditor locations={locationResult.locations} />}
  </AppShell>;
}

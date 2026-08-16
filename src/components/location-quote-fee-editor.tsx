"use client";

import { GripVertical, MapPin, Save } from "lucide-react";
import { useState, useTransition } from "react";
import { reorderLocations, saveLocationQuoteFees } from "@/app/admin/settings/actions";
import type { OrganizationLocation } from "@/lib/locations";

export function LocationQuoteFeeEditor({ locations }: { locations: OrganizationLocation[] }) {
  const [orderedLocations, setOrderedLocations] = useState(locations);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [pending, startTransition] = useTransition();
  function moveLocation(targetId: string) {
    if (!draggingId || draggingId === targetId) return;
    const fromIndex = orderedLocations.findIndex((location) => location.id === draggingId);
    const toIndex = orderedLocations.findIndex((location) => location.id === targetId);
    if (fromIndex < 0 || toIndex < 0) return;
    const next = [...orderedLocations];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    setOrderedLocations(next);
    setDraggingId(null);
    setNotice("");
    startTransition(async () => {
      const result = await reorderLocations(next.map((location) => location.id));
      setNotice(result.error || "Location order saved.");
    });
  }
  return <section className="card form-stack settings-section" id="location-fees">
    <div><span className="eyebrow">Quote Calculator</span><h2>Location details and fee defaults</h2><p>Drag a location by its handle to set its shared order. Update a location name, city/state, and the TP Destination, RR Destination, delivery, and tax defaults used in quotes.</p></div>
    {notice ? <p className={notice.includes("could not") || notice.includes("invalid") || notice.includes("changed") ? "form-error" : "form-success"} role="status">{notice}</p> : null}
    {orderedLocations.length ? <div className="form-stack">{orderedLocations.map((location) => <form className="location-fee-row" action={saveLocationQuoteFees} draggable onDragStart={() => setDraggingId(location.id)} onDragOver={(event) => event.preventDefault()} onDrop={() => moveLocation(location.id)} onDragEnd={() => setDraggingId(null)} key={location.id} style={{ opacity: draggingId === location.id ? 0.55 : 1 }}>
      <button className="icon-btn" type="button" aria-label={`Drag ${location.name} to reorder`} title="Drag to reorder"><GripVertical size={18}/></button>
      <input type="hidden" name="locationId" value={location.id}/><div className="location-fee-name"><MapPin size={17}/><strong>Location</strong></div>
      <label><span className="label">Location name</span><input className="input" name="locationName" required minLength={2} maxLength={120} defaultValue={location.name}/></label>
      <label><span className="label">City</span><input className="input" name="city" maxLength={120} defaultValue={location.city}/></label>
      <label><span className="label">State</span><input className="input" name="state" maxLength={40} defaultValue={location.state}/></label>
      <label><span className="label">TP Destination</span><input className="input" name="tpDestinationFee" type="number" min="0" step="0.01" defaultValue={location.tpDestinationFee}/></label>
      <label><span className="label">RR Destination</span><input className="input" name="rrDestinationFee" type="number" min="0" step="0.01" defaultValue={location.rrDestinationFee}/></label>
      <label><span className="label">Delivery</span><input className="input" name="deliveryFee" type="number" min="0" step="0.01" defaultValue={location.deliveryFee}/></label>
      <label><span className="label">Sales tax rate</span><div className="input-suffix"><input className="input" name="salesTaxRate" type="number" min="0" max="100" step="0.001" defaultValue={location.salesTaxRate}/><span>%</span></div></label>
      <button className="btn btn-secondary" type="submit" disabled={pending}><Save size={15}/> Save</button>
    </form>)}</div> : <div className="output empty"><div><h3>No active locations</h3><p>Add an active business location before setting quote defaults.</p></div></div>}
  </section>;
}

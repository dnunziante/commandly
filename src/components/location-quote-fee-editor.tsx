import { MapPin, Save } from "lucide-react";
import { saveLocationQuoteFees } from "@/app/admin/settings/actions";
import type { OrganizationLocation } from "@/lib/locations";

export function LocationQuoteFeeEditor({ locations }: { locations: OrganizationLocation[] }) {
  return <section className="card form-stack settings-section">
    <div><span className="eyebrow">Quote Calculator</span><h2>Location fee defaults</h2><p>Set the shipping/destination and delivery defaults that appear when a salesperson selects a store.</p></div>
    {locations.length ? <div className="form-stack">{locations.map((location) => <form className="location-fee-row" action={saveLocationQuoteFees} key={location.id}>
      <input type="hidden" name="locationId" value={location.id}/><div className="location-fee-name"><MapPin size={17}/><strong>{location.name}</strong></div>
      <label><span className="label">Shipping / Destination</span><input className="input" name="shippingDestinationFee" type="number" min="0" step="0.01" defaultValue={location.shippingDestinationFee}/></label>
      <label><span className="label">Delivery</span><input className="input" name="deliveryFee" type="number" min="0" step="0.01" defaultValue={location.deliveryFee}/></label>
      <label><span className="label">Sales tax rate</span><div className="input-suffix"><input className="input" name="salesTaxRate" type="number" min="0" max="100" step="0.001" defaultValue={location.salesTaxRate}/><span>%</span></div></label>
      <button className="btn btn-secondary" type="submit"><Save size={15}/> Save</button>
    </form>)}</div> : <div className="output empty"><div><h3>No active locations</h3><p>Add an active business location before setting quote defaults.</p></div></div>}
  </section>;
}

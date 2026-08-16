"use client";

import { RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { calculateQuote, type QuoteInputs } from "@/lib/quote-calculator";
import type { ProductDTO } from "@/lib/products/types";
import type { OrganizationLocation } from "@/lib/locations";

const initialQuote: QuoteInputs = { vehiclePrice: 0, accessories: 0, docFees: 0, tradeIn: 0, discount: 0, salesTax: 0, extendedWarranties: 0, tagTitleDmvFee: 0, destination: 0, delivery: 0 };
const labels: Array<[keyof QuoteInputs, string, boolean]> = [
  ["vehiclePrice", "Vehicle Price", false], ["accessories", "Accessories", false], ["docFees", "Doc Fees", false],
  ["tradeIn", "Trade-In", true], ["discount", "Discount", true], ["salesTax", "Sales Tax", false],
  ["extendedWarranties", "Extended Warranties", false], ["tagTitleDmvFee", "Tag / Title / DMV Fee", false],
  ["destination", "Destination", false], ["delivery", "Delivery", false],
];
const money = (value: number) => value.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });

export function QuoteCalculator({ vehicles, accessories, warranties, locations }: { vehicles: ProductDTO[]; accessories: ProductDTO[]; warranties: ProductDTO[]; locations: OrganizationLocation[] }) {
  const [quote, setQuote] = useState(initialQuote);
  const [vehicleId, setVehicleId] = useState("manual");
  const [selectedAccessoryIds, setSelectedAccessoryIds] = useState<string[]>([]);
  const [selectedWarrantyIds, setSelectedWarrantyIds] = useState<string[]>([]);
  const [locationId, setLocationId] = useState("manual");
  const [destinationType, setDestinationType] = useState<"tp" | "rr">("tp");
  const [overriddenFees, setOverriddenFees] = useState({ tax: false, destination: false, delivery: false });
  const result = useMemo(() => calculateQuote(quote), [quote]);
  const selectedLocation = locations.find((location) => location.id === locationId);
  const calculatedTax = Math.round(result.subtotal * (selectedLocation?.salesTaxRate || 0)) / 100;
  const displayedQuote = overriddenFees.tax || !selectedLocation ? quote : { ...quote, salesTax: calculatedTax };
  const displayedResult = calculateQuote(displayedQuote);
  const update = (key: keyof QuoteInputs, value: string) => setQuote((current) => ({ ...current, [key]: Number(value) }));
  const toggleAccessory = (id: string) => {
    const nextIds = selectedAccessoryIds.includes(id) ? selectedAccessoryIds.filter((item) => item !== id) : [...selectedAccessoryIds, id];
    setSelectedAccessoryIds(nextIds);
    const total = accessories.filter((item) => nextIds.includes(item.id)).reduce((sum, item) => sum + item.price, 0);
    update("accessories", String(total));
  };
  const toggleWarranty = (id: string) => {
    const nextIds = selectedWarrantyIds.includes(id) ? selectedWarrantyIds.filter((item) => item !== id) : [...selectedWarrantyIds, id];
    setSelectedWarrantyIds(nextIds);
    const total = warranties.filter((item) => nextIds.includes(item.id)).reduce((sum, item) => sum + item.price, 0);
    update("extendedWarranties", String(total));
  };

  return <section className="card quote-calculator">
    <div className="metric-row quote-heading"><div><h2>Quote details</h2><p>Enter each amount to calculate the delivered total.</p></div><button className="btn btn-ghost" type="button" onClick={() => { setQuote(initialQuote); setVehicleId("manual"); setSelectedAccessoryIds([]); setSelectedWarrantyIds([]); setLocationId("manual"); setDestinationType("tp"); setOverriddenFees({ tax:false, destination:false, delivery:false }); }}><RotateCcw size={15}/> Reset</button></div>
    <div className="quote-sheet">
      <div className="quote-location"><label className="label" htmlFor="quote-location">Dealership Location</label><select className="input" id="quote-location" value={locationId} onChange={(event) => { const id = event.target.value; setLocationId(id); const location = locations.find((item) => item.id === id); if (location) { setQuote((current) => ({ ...current, destination: destinationType === "tp" ? location.tpDestinationFee : location.rrDestinationFee, delivery: location.deliveryFee })); setOverriddenFees({ tax:false, destination:false, delivery:false }); } }}><option value="manual">Manual fees</option>{locations.map((location) => <option value={location.id} key={location.id}>{location.name}</option>)}</select></div>
      <div className="quote-row quote-vehicle-row"><label htmlFor="quote-vehicle">Vehicle Price:</label><div className="quote-vehicle-controls"><select className="input" id="quote-vehicle" value={vehicleId} onChange={(event) => { const id = event.target.value; setVehicleId(id); const vehicle = vehicles.find((item) => item.id === id); if (vehicle) update("vehiclePrice", String(vehicle.price)); }}><option value="manual">Vehicle price</option>{vehicles.map((vehicle) => <option value={vehicle.id} key={vehicle.id}>{vehicle.name} · {vehicle.model || "Standard"}</option>)}</select><span className="quote-input-wrap"><span>$</span><input aria-label="Vehicle Price" type="number" min="0" step="0.01" value={quote.vehiclePrice} onChange={(event) => { update("vehiclePrice", event.target.value); setVehicleId("manual"); }}/></span></div></div>
      <div className="quote-row quote-vehicle-row"><span>Accessories:</span><div className="quote-vehicle-controls"><details className="quote-multi-select"><summary>{selectedAccessoryIds.length ? `${selectedAccessoryIds.length} selected` : "Select accessories"}</summary><div className="quote-multi-options">{accessories.length ? accessories.map((accessory) => <label key={accessory.id}><input type="checkbox" checked={selectedAccessoryIds.includes(accessory.id)} onChange={() => toggleAccessory(accessory.id)}/><span>{accessory.name}</span><strong>{money(accessory.price)}</strong></label>) : <p>No published accessories yet.</p>}</div></details><span className="quote-input-wrap"><span>$</span><input aria-label="Accessories" type="number" min="0" step="0.01" value={quote.accessories} onChange={(event) => { update("accessories", event.target.value); setSelectedAccessoryIds([]); }}/></span></div></div>
      {labels.slice(2, 5).map(([key, label, subtract]) => <label className="quote-row" key={key}><span>{label}:</span><span className="quote-input-wrap">{subtract && <span>−</span>}<span>$</span><input aria-label={label} type="number" min="0" step="0.01" value={quote[key]} onChange={(event) => update(key, event.target.value)}/></span></label>)}
      <div className="quote-total-row"><strong>Subtotal:</strong><strong>{money(result.subtotal)}</strong></div>
      <label className="quote-row"><span>Sales Tax:{selectedLocation && <small className="quote-rate">{selectedLocation.salesTaxRate.toFixed(3)}%</small>}{overriddenFees.tax && <small className="quote-override">Override</small>}</span><span className="quote-input-wrap"><span>$</span><input aria-label="Sales Tax" type="number" min="0" step="0.01" value={displayedQuote.salesTax} onChange={(event) => { update("salesTax", event.target.value); if (locationId !== "manual") setOverriddenFees((current) => ({...current,tax:true})); }}/></span></label>
      <div className="quote-row quote-vehicle-row"><span>Extended Warranties:</span><div className="quote-vehicle-controls"><details className="quote-multi-select"><summary>{selectedWarrantyIds.length ? `${selectedWarrantyIds.length} selected` : "Select warranties"}</summary><div className="quote-multi-options">{warranties.length ? warranties.map((warranty) => <label key={warranty.id}><input type="checkbox" checked={selectedWarrantyIds.includes(warranty.id)} onChange={() => toggleWarranty(warranty.id)}/><span>{warranty.name}{warranty.model ? ` · ${warranty.model}` : ""}</span><strong>{money(warranty.price)}</strong></label>) : <p>No published warranties yet.</p>}</div></details><span className="quote-input-wrap"><span>$</span><input aria-label="Extended Warranties" type="number" min="0" step="0.01" value={quote.extendedWarranties} onChange={(event) => { update("extendedWarranties", event.target.value); setSelectedWarrantyIds([]); }}/></span></div></div>
      <label className="quote-row"><span>Tag / Title / DMV Fee:</span><span className="quote-input-wrap"><span>$</span><input aria-label="Tag / Title / DMV Fee" type="number" min="0" step="0.01" value={quote.tagTitleDmvFee} onChange={(event) => update("tagTitleDmvFee", event.target.value)}/></span></label>
      <label className="quote-row"><span><select className="input" aria-label="Destination type" value={destinationType} onChange={(event) => { const type = event.target.value as "tp" | "rr"; setDestinationType(type); const location = locations.find((item) => item.id === locationId); if (location) { setQuote((current) => ({ ...current, destination: type === "tp" ? location.tpDestinationFee : location.rrDestinationFee })); setOverriddenFees((current) => ({ ...current, destination: false })); } }}><option value="tp">TP Destination</option><option value="rr">RR Destination</option></select>{overriddenFees.destination && <small className="quote-override">Override</small>}</span><span className="quote-input-wrap"><span>$</span><input aria-label="Destination" type="number" min="0" step="0.01" value={quote.destination} onChange={(event) => { update("destination", event.target.value); if (locationId !== "manual") setOverriddenFees((current) => ({...current,destination:true})); }}/></span></label>
      <label className="quote-row"><span>Delivery:{overriddenFees.delivery && <small className="quote-override">Override</small>}</span><span className="quote-input-wrap"><span>$</span><input aria-label="Delivery" type="number" min="0" step="0.01" value={quote.delivery} onChange={(event) => { update("delivery", event.target.value); if (locationId !== "manual") setOverriddenFees((current) => ({...current,delivery:true})); }}/></span></label>
      <div className="quote-total-row final"><strong>Total Delivered:</strong><strong>{money(displayedResult.totalDelivered)}</strong></div>
    </div>
    <div className="pricing-disclaimer"><strong>Estimate only</strong><p>Confirm pricing, taxes, fees, trade value, discounts, availability, and final terms before presenting or accepting a quote.</p></div>
  </section>;
}

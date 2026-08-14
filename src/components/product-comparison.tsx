"use client";

import Link from "next/link";
import { Check, GitCompareArrows, ImageIcon, Plus, RotateCcw, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { ProductDTO } from "@/lib/products/types";

type CompareField = {
  label: string;
  value: (product: ProductDTO) => string;
};

const fields: CompareField[] = [
  { label: "Starting price", value: (product) => `$${product.price.toLocaleString()}` },
  { label: "Passenger capacity", value: (product) => product.seats },
  { label: "Frame", value: (product) => product.range },
  { label: "Powertrain", value: (product) => product.powertrain },
  { label: "Description", value: (product) => product.description },
];

function display(value: string) {
  return value.trim() || "Not added";
}

function hasDifference(values: string[]) {
  return new Set(values.map((value) => display(value).toLowerCase())).size > 1;
}

export function ProductComparison({ products }: { products: ProductDTO[] }) {
  const initialIds = products.slice(0, 2).map((product) => product.id);
  const [selectedIds, setSelectedIds] = useState<string[]>(initialIds);
  const selectedProducts = useMemo(() => selectedIds.map((id) => products.find((product) => product.id === id)).filter((product): product is ProductDTO => Boolean(product)), [products, selectedIds]);

  function selectProduct(slot: number, productId: string) {
    setSelectedIds((current) => current.map((id, index) => index === slot ? productId : id));
  }

  function addProduct() {
    const available = products.find((product) => !selectedIds.includes(product.id));
    if (available && selectedIds.length < 3) setSelectedIds((current) => [...current, available.id]);
  }

  return <div className="comparison-workspace">
    <section className="card comparison-picker">
      <div className="comparison-picker-heading"><div><h2>Choose products</h2><p>Select two products and optionally add a third. Each position must contain a different model or configuration.</p></div><span className="badge blue"><GitCompareArrows size={14}/>{selectedProducts.length} selected</span></div>
      <div className="comparison-selectors">
        {selectedIds.map((id, index) => <div className="comparison-selector" key={index}>
          <label className="label" htmlFor={`comparison-product-${index}`}>Product {index + 1}</label>
          <div><select className="input" id={`comparison-product-${index}`} value={id} onChange={(event) => selectProduct(index, event.target.value)}>
            {products.map((product) => <option value={product.id} disabled={selectedIds.includes(product.id) && product.id !== id} key={product.id}>{product.name} · {product.model || "Standard"}</option>)}
          </select>{selectedIds.length === 3 && <button className="icon-btn comparison-remove" type="button" onClick={() => setSelectedIds((current) => current.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Remove product ${index + 1}`}><X size={17}/></button>}</div>
        </div>)}
        {selectedIds.length < 3 && products.length > selectedIds.length && <button className="comparison-add" type="button" onClick={addProduct}><Plus size={20}/><span><strong>Add a third product</strong><small>Optional comparison</small></span></button>}
      </div>
      <button className="text-button" type="button" onClick={() => setSelectedIds(initialIds)}><RotateCcw size={14}/> Reset comparison</button>
    </section>

    <div className="comparison-table-wrap">
      <div className="comparison-detail-grid" style={{gridTemplateColumns:`minmax(145px,.55fr) repeat(${selectedProducts.length}, minmax(230px,1fr))`}}>
        <div className="comparison-corner"><span>Product details</span></div>
        {selectedProducts.map((product) => <article className="comparison-product-head" key={product.id}>
          {product.imageUrl ? <div className="comparison-product-image" style={{backgroundImage:`url(${product.imageUrl})`}} role="img" aria-label={`${product.name} product image`}/> : <div className={`comparison-product-image placeholder ${product.color}`}><ImageIcon size={28}/><span>Image not added</span></div>}
          <span className="badge blue">{product.status}</span>
          <h2>{product.name}</h2><p>{product.model || "Standard configuration"}</p>
        </article>)}

        {fields.map((field) => {
          const values = selectedProducts.map(field.value);
          const different = hasDifference(values);
          return <div className="comparison-row" key={field.label} style={{gridColumn:"1 / -1", gridTemplateColumns:`minmax(145px,.55fr) repeat(${selectedProducts.length}, minmax(230px,1fr))`}}>
            <div className="comparison-label">{field.label}{different && <small>Different</small>}</div>
            {values.map((value, index) => <div className={different ? "comparison-value is-different" : "comparison-value"} key={`${field.label}-${selectedProducts[index].id}`}>{display(value)}</div>)}
          </div>;
        })}

        <div className="comparison-row" style={{gridColumn:"1 / -1", gridTemplateColumns:`minmax(145px,.55fr) repeat(${selectedProducts.length}, minmax(230px,1fr))`}}>
          <div className="comparison-label">Saved highlights<small>{hasDifference(selectedProducts.map((product) => product.highlights.join("|"))) ? "Different" : ""}</small></div>
          {selectedProducts.map((product) => <div className="comparison-value comparison-highlights" key={product.id}>{product.highlights.length ? <ul>{product.highlights.map((highlight) => <li key={highlight}><Check size={15}/><span>{highlight}</span></li>)}</ul> : <span className="comparison-missing">Not added</span>}</div>)}
        </div>

        <div className="comparison-row comparison-actions-row" style={{gridColumn:"1 / -1", gridTemplateColumns:`minmax(145px,.55fr) repeat(${selectedProducts.length}, minmax(230px,1fr))`}}>
          <div className="comparison-label">More information</div>
          {selectedProducts.map((product) => <div className="comparison-value" key={product.id}><Link className="btn btn-secondary" href={`/products/${product.slug}`}>View product guide</Link></div>)}
        </div>
      </div>
    </div>

    <div className="callout comparison-tip"><strong>Sales tip</strong><p>Start with the customer’s intended use and passenger needs. Use highlighted rows to explain meaningful differences instead of focusing only on price.</p></div>
  </div>;
}

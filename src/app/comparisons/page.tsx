import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { getTenantProducts } from "@/lib/products/data";

export default async function Comparisons() {
  const result = await getTenantProducts();
  const products = result.products.slice(0, 3);
  const rows = [
    ["Starting price", ...products.map((product)=>`$${product.price.toLocaleString()}`)],
    ["Passenger capacity", ...products.map((product)=>product.seats)],
    ["Estimated range", ...products.map((product)=>product.range)],
    ["Power", ...products.map((product)=>product.highlights[0] || "Contact sales")],
  ];

  return <AppShell title="Comparisons">
    <PageHeader eyebrow="Live side-by-side" title="Make the choice easy to understand" description="Compare published products from your organization’s catalog."/>
    {result.error ? <div className="card error-card"><h2>Comparison unavailable</h2><p>{result.error}</p></div> : products.length < 2 ? <div className="card output empty"><div><h2>More products are needed</h2><p>Publish at least two products to create a comparison.</p></div></div> : <><div className="table-wrap"><div className="comparison-grid" style={{gridTemplateColumns:`150px repeat(${products.length}, minmax(180px, 1fr))`}}><div className="head">Feature</div>{products.map((product)=><div className="head" key={product.id}>{product.name}<small style={{display:"block",color:"#68738a",marginTop:4}}>{product.model}</small></div>)}{rows.map((row,rowIndex)=>row.map((cell,columnIndex)=><div className={columnIndex===0?"label-cell":""} key={`${rowIndex}-${columnIndex}`}>{cell}</div>))}</div></div><div className="callout" style={{marginTop:18}}><strong>Sales tip:</strong><p style={{margin:"4px 0 0"}}>Start with the customer’s intended use and passengers, then compare value—not just starting price.</p></div></>}
  </AppShell>;
}

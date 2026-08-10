"use client";

import { useState } from "react";
import Link from "next/link";
import { Database, GitCompareArrows, Search } from "lucide-react";
import type { ProductDTO } from "@/lib/products/types";

export function ProductLibrary({ products, live }: { products: ProductDTO[]; live: boolean }) {
  const [query, setQuery] = useState("");
  const shown = products.filter((product) =>
    `${product.name} ${product.model}`.toLowerCase().includes(query.toLowerCase()),
  );

  return <>
    <div className="product-toolbar">
      <div style={{position:"relative",maxWidth:440,flex:1}}><Search size={17} style={{position:"absolute",left:12,top:13,color:"#68738a"}}/><input className="input" style={{paddingLeft:38}} placeholder="Search models or configurations" value={query} onChange={(event)=>setQuery(event.target.value)}/></div>
      <span className={`badge ${live ? "" : "amber"}`}><Database size={13}/>{live ? "Live workspace data" : "Demo data"}</span>
      <Link className="btn btn-secondary" href="/comparisons"><GitCompareArrows size={16}/> Compare models</Link>
    </div>
    {shown.length ? <div className="grid grid-3">{shown.map((product)=><article className="card" key={product.id}><div className={`product-visual ${product.color}`} aria-label={`${product.name} product illustration`}/><div className="product-title"><div><h2>{product.name}</h2><p>{product.model}</p></div><span className="price">${product.price.toLocaleString()}</span></div><p>{product.description}</p><div className="chips"><span className="chip">{product.range}</span><span className="chip">{product.seats}</span>{product.highlights.slice(0,1).map((highlight)=><span className="chip" key={highlight}>{highlight}</span>)}</div><button className="btn btn-secondary" style={{width:"100%"}}>View sales guide</button></article>)}</div> : <div className="card output empty"><div><Search size={32}/><h2>No matching products</h2><p>{products.length ? "Try a different model name or clear your search." : "Your organization has no published products yet."}</p>{query && <button className="btn btn-secondary" onClick={()=>setQuery("")}>Clear search</button>}</div></div>}
  </>;
}

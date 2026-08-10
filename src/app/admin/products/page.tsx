import { Trash2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { AdminProductForm } from "@/components/admin-product-form";
import { PageHeader } from "@/components/page-header";
import { getTenantProducts } from "@/lib/products/data";
import { deleteProduct } from "./actions";

export default async function AdminProductsPage() {
  const result = await getTenantProducts({ includeDrafts: true });
  return <AppShell title="Admin · Products">
    <PageHeader eyebrow="Tenant catalog" title="Products and pricing" description="Changes are stored in Supabase and isolated to the active organization."/>
    {result.error && <div className="card error-card"><h2>Catalog unavailable</h2><p>{result.error}</p></div>}
    <div className="admin-product-layout">
      <AdminProductForm/>
      <div className="card"><div className="metric-row"><h2>Workspace products</h2><span className="badge blue">{result.products.length} total</span></div>{result.products.length ? <div className="table-wrap"><table className="table"><thead><tr><th>Name</th><th>Price</th><th>Status</th><th>Action</th></tr></thead><tbody>{result.products.map((product)=><tr key={product.id}><td><strong>{product.name}</strong><small style={{display:"block",color:"#68738a"}}>{product.model}</small></td><td>${product.price.toLocaleString()}</td><td><span className={`badge ${product.status === "Draft" ? "amber" : ""}`}>{product.status}</span></td><td><form action={deleteProduct}><input type="hidden" name="productId" value={product.id}/><button className="btn btn-ghost danger-button" type="submit" aria-label={`Remove ${product.name}`}><Trash2 size={14}/> Remove</button></form></td></tr>)}</tbody></table></div> : <div className="output empty"><div><h3>No products yet</h3><p>Add the first product for this organization.</p></div></div>}</div>
    </div>
  </AppShell>;
}

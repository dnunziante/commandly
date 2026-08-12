import Link from "next/link";
import { Copy, Eye, EyeOff, Pencil, Trash2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { AdminProductForm } from "@/components/admin-product-form";
import { PageHeader } from "@/components/page-header";
import { ProductFamilyImageManager } from "@/components/product-family-image-manager";
import { getViewer } from "@/lib/auth/viewer";
import { getTenantProductFamilies, getTenantProducts } from "@/lib/products/data";
import { deleteProduct, duplicateProduct, setProductStatus } from "./actions";

export default async function AdminProductsPage() {
  const [result, familyResult, viewer] = await Promise.all([getTenantProducts({ includeDrafts: true }), getTenantProductFamilies(), getViewer()]);
  return <AppShell title="Admin · Products">
    <PageHeader eyebrow="Tenant catalog" title="Products and pricing" description="Changes are stored in Supabase and isolated to the active organization."/>
    {result.error && <div className="card error-card"><h2>Catalog unavailable</h2><p>{result.error}</p></div>}
    {viewer?.organizationId && <ProductFamilyImageManager families={familyResult.families} organizationId={viewer.organizationId}/>}
    <div className="admin-product-layout" style={{marginTop:18}}>
      <AdminProductForm families={familyResult.families}/>
      <div className="card">
        <div className="metric-row"><h2>Workspace products</h2><span className="badge blue">{result.products.length} total</span></div>
        {result.products.length ? <div className="table-wrap"><table className="table"><thead><tr><th>Name</th><th>Price</th><th>Status</th><th>Actions</th></tr></thead><tbody>{result.products.map((product) => <tr key={product.id}>
          <td><div className="admin-product-name">{product.imageUrl ? <span className="admin-product-thumbnail" style={{backgroundImage:`url(${product.imageUrl})`}} role="img" aria-label={`${product.name} thumbnail`}/> : <span className={`admin-product-thumbnail placeholder ${product.color}`} aria-hidden="true"/>}<span><strong>{product.name}</strong><small>{product.model}</small></span></div></td>
          <td>${product.price.toLocaleString()}</td>
          <td><span className={`badge ${product.status === "Draft" ? "amber" : ""}`}>{product.status}</span></td>
          <td><div className="product-row-actions">
            <Link className="btn btn-ghost status-button" href={`/admin/products/${product.id}/edit`}><Pencil size={14}/> Edit</Link>
            <form action={duplicateProduct}><input type="hidden" name="productId" value={product.id}/><button className="btn btn-ghost status-button" type="submit"><Copy size={14}/> Duplicate</button></form>
            <Link className="btn btn-ghost status-button" href={`/admin/products/${product.id}/guide`}>Sales guide</Link>
            <form action={setProductStatus}><input type="hidden" name="productId" value={product.id}/><input type="hidden" name="status" value={product.status === "Published" ? "draft" : "published"}/><button className="btn btn-ghost status-button" type="submit">{product.status === "Published" ? <><EyeOff size={14}/> Move to draft</> : <><Eye size={14}/> Publish</>}</button></form>
            <form action={deleteProduct}><input type="hidden" name="productId" value={product.id}/><button className="btn btn-ghost danger-button" type="submit" aria-label={`Remove ${product.name}`}><Trash2 size={14}/> Remove</button></form>
          </div></td>
        </tr>)}</tbody></table></div> : <div className="output empty"><div><h3>No products yet</h3><p>Add the first product for this organization.</p></div></div>}
      </div>
    </div>
  </AppShell>;
}

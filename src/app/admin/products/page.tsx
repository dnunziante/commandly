import { AppShell } from "@/components/app-shell";
import { AdminProductCategoryList } from "@/components/admin-product-category-list";
import { AdminProductForm } from "@/components/admin-product-form";
import { PageHeader } from "@/components/page-header";
import { ProductFamilyImageManager } from "@/components/product-family-image-manager";
import { getViewer } from "@/lib/auth/viewer";
import { getTenantProductFamilies, getTenantProducts } from "@/lib/products/data";

export default async function AdminProductsPage() {
  const [result, familyResult, viewer] = await Promise.all([getTenantProducts({ includeDrafts: true }), getTenantProductFamilies(), getViewer()]);
  const categoryOrder = ["activev-pulse", "bintelli-beyond", "bintelli-nexus", "sivo-edge", "accessories", "warranties"];
  const categories = categoryOrder
    .map((slug) => familyResult.families.find((family) => family.slug === slug))
    .filter((family): family is NonNullable<typeof family> => Boolean(family));

  return <AppShell title="Admin · Products">
    <PageHeader eyebrow="Tenant catalog" title="Products and pricing" description="Changes are stored in Supabase and isolated to the active organization."/>
    {result.error && <div className="card error-card"><h2>Catalog unavailable</h2><p>{result.error}</p></div>}
    {viewer?.organizationId && <ProductFamilyImageManager families={familyResult.families} organizationId={viewer.organizationId}/>}
    <div className="admin-product-layout" style={{marginTop:18}}>
      <AdminProductForm families={familyResult.families}/>
      <div className="card">
        <div className="metric-row"><h2>Workspace products</h2><span className="badge blue">{result.products.length} total</span></div>
        {result.products.length ? <AdminProductCategoryList categories={categories.map((family) => ({ ...family, products: result.products.filter((product) => product.familyId === family.id) }))}/> : <div className="output empty"><div><h3>No products yet</h3><p>Add the first product for this organization.</p></div></div>}
      </div>
    </div>
  </AppShell>;
}

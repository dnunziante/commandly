import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { ProductLibrary } from "@/components/product-library";
import { getTenantProducts } from "@/lib/products/data";

export default async function ProductsPage() {
  const result = await getTenantProducts();
  return <AppShell title="Products">
    <PageHeader eyebrow="Product library" title="Find the right product for every customer" description="Browse your organization’s live product positioning, pricing, and key sales details."/>
    {result.error ? <div className="card error-card"><h2>Products are not available</h2><p>{result.error}</p><p>Ask a tenant administrator to confirm the product migration and your workspace membership.</p></div> : <ProductLibrary products={result.products} live={result.source === "supabase"}/>}
  </AppShell>;
}

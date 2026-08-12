import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { ProductComparison } from "@/components/product-comparison";
import { getTenantProducts } from "@/lib/products/data";

export default async function Comparisons() {
  const result = await getTenantProducts();

  return <AppShell title="Comparisons">
    <PageHeader eyebrow="Product comparison" title="Make the choice easy to understand" description="Choose two products—or add a third—to compare every approved detail currently saved in your catalog."/>
    {result.error ? <div className="card error-card"><h2>Comparison unavailable</h2><p>{result.error}</p></div> : result.products.length < 2 ? <div className="card output empty"><div><h2>More products are needed</h2><p>Publish at least two products to create a comparison.</p></div></div> : <ProductComparison products={result.products}/>}
  </AppShell>;
}

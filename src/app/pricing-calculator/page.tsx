import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { PricingCalculator } from "@/components/pricing-calculator";
import { getTenantProducts } from "@/lib/products/data";

export default async function PricingCalculatorPage() {
  const result = await getTenantProducts();
  return <AppShell title="Loan Calculator">
    <PageHeader eyebrow="Loan estimate" title="Build a clear loan scenario" description="Estimate acquisition cost, amount financed, and monthly payment using your published products."/>
    {result.error ? <div className="card error-card"><h2>Calculator unavailable</h2><p>{result.error}</p></div> : <PricingCalculator products={result.products}/>}
  </AppShell>;
}

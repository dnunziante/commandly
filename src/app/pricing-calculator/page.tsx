import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { PricingCalculator } from "@/components/pricing-calculator";
import { getTenantProductFamilies, getTenantProducts } from "@/lib/products/data";

const addOnFamilySlugs = new Set(["accessories", "warranties"]);

export default async function PricingCalculatorPage() {
  const [result, familyResult] = await Promise.all([getTenantProducts(), getTenantProductFamilies()]);
  const vehicleFamilyIds = new Set(familyResult.families.filter((family) => !addOnFamilySlugs.has(family.slug)).map((family) => family.id));
  const vehicles = result.products
    .filter((product) => product.familyId && vehicleFamilyIds.has(product.familyId))
    .sort((first, second) => {
      const nameOrder = first.name.localeCompare(second.name, undefined, { sensitivity: "base", numeric: true });
      if (nameOrder) return nameOrder;
      const priceOrder = first.price - second.price;
      return priceOrder || first.model.localeCompare(second.model, undefined, { sensitivity: "base", numeric: true });
    });
  return <AppShell title="Loan Calculator">
    <PageHeader eyebrow="Loan estimate" title="Build a clear loan scenario" description="Estimate acquisition cost, amount financed, and monthly payment using your published products."/>
    {result.error || familyResult.error ? <div className="card error-card"><h2>Calculator unavailable</h2><p>{result.error || familyResult.error}</p></div> : <PricingCalculator products={vehicles}/>}
  </AppShell>;
}

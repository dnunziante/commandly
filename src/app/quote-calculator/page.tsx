import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { QuoteCalculator } from "@/components/quote-calculator";
import { getTenantProductFamilies, getTenantProducts } from "@/lib/products/data";
import { getOrganizationLocations } from "@/lib/locations";

export default async function QuoteCalculatorPage() {
  const [productResult, familyResult, locationResult] = await Promise.all([getTenantProducts(), getTenantProductFamilies(), getOrganizationLocations()]);
  const addOnFamilyIds = new Set(familyResult.families.filter((family) => family.slug === "accessories" || family.slug === "warranties").map((family) => family.id));
  const accessoryFamilyIds = new Set(familyResult.families.filter((family) => family.slug === "accessories").map((family) => family.id));
  const warrantyFamilyIds = new Set(familyResult.families.filter((family) => family.slug === "warranties").map((family) => family.id));
  const vehicles = productResult.products.filter((product) => !product.familyId || !addOnFamilyIds.has(product.familyId));
  const accessories = productResult.products.filter((product) => product.familyId && accessoryFamilyIds.has(product.familyId));
  const warranties = productResult.products
    .filter((product) => product.familyId && warrantyFamilyIds.has(product.familyId))
    .sort((a, b) => {
      const nameOrder = a.name.localeCompare(b.name);
      if (nameOrder !== 0) return nameOrder;
      const aTerm = Math.max(...(a.model.match(/\d+/g) || ["0"]).map(Number));
      const bTerm = Math.max(...(b.model.match(/\d+/g) || ["0"]).map(Number));
      return bTerm - aTerm;
    });
  return <AppShell title="Quote Calculator">
    <PageHeader eyebrow="Sales quote" title="Build a delivered-price quote" description="Calculate the complete customer quote from vehicle price through delivery."/>
    <QuoteCalculator vehicles={vehicles} accessories={accessories} warranties={warranties} locations={locationResult.locations}/>
  </AppShell>;
}

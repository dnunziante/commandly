import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { QuoteCalculator } from "@/components/quote-calculator";
import { getTenantProductFamilies, getTenantProducts } from "@/lib/products/data";
import { getOrganizationLocations } from "@/lib/locations";
import { getViewer } from "@/lib/auth/viewer";

export default async function QuoteCalculatorPage() {
  const [productResult, familyResult, locationResult, viewer] = await Promise.all([getTenantProducts(), getTenantProductFamilies(), getOrganizationLocations(), getViewer()]);
  const canManageLocations = Boolean(viewer && !viewer.demo && ["tenant_admin", "platform_owner"].includes(viewer.role));
  const addOnFamilyIds = new Set(familyResult.families.filter((family) => family.slug === "accessories" || family.slug === "warranties").map((family) => family.id));
  const accessoryFamilyIds = new Set(familyResult.families.filter((family) => family.slug === "accessories").map((family) => family.id));
  const warrantyFamilyIds = new Set(familyResult.families.filter((family) => family.slug === "warranties").map((family) => family.id));
  const vehicles = productResult.products
    .filter((product) => !product.familyId || !addOnFamilyIds.has(product.familyId))
    .sort((first, second) => {
      const nameOrder = first.name.localeCompare(second.name, undefined, { sensitivity: "base", numeric: true });
      if (nameOrder) return nameOrder;
      const priceOrder = first.price - second.price;
      return priceOrder || first.model.localeCompare(second.model, undefined, { sensitivity: "base", numeric: true });
    });
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
    <PageHeader eyebrow="Sales quote" title="Build a delivered-price quote" description="Calculate the complete customer quote from vehicle price through delivery." action={canManageLocations ? <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><Link className="btn btn-secondary" href="/admin/settings#add-location">Add location</Link><Link className="btn btn-ghost" href="/admin/settings#location-fees">Edit location fees</Link></div> : undefined}/>
    <QuoteCalculator vehicles={vehicles} accessories={accessories} warranties={warranties} locations={locationResult.locations}/>
  </AppShell>;
}

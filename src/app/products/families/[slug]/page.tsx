import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { ProductLibrary } from "@/components/product-library";
import { getTenantProductFamilyBySlug, getTenantProducts } from "@/lib/products/data";

export default async function ProductFamilyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { family, error } = await getTenantProductFamilyBySlug(slug);
  if (!family) notFound();
  const products = await getTenantProducts({ familyId: family.id });
  const addOnMode = family.slug === "accessories" || family.slug === "warranties";

  return <AppShell title={family.name}>
    <PageHeader eyebrow={addOnMode ? "Purchase add-ons" : "Product family"} title={family.name} description={family.description} action={<Link className="btn btn-ghost" href="/products"><ArrowLeft size={16}/> {addOnMode ? "Back to products" : "All product families"}</Link>}/>
    {error || products.error
      ? <div className="card error-card"><h2>{addOnMode ? "Add-ons" : "Models"} are not available</h2><p>{error || products.error}</p></div>
      : <ProductLibrary products={products.products} live={products.source === "supabase"} addOnMode={addOnMode} emptyMessage={addOnMode ? `No published ${family.name.toLowerCase()} have been added yet.` : `No published ${family.name} models or configurations have been added yet.`}/>
    }
  </AppShell>;
}

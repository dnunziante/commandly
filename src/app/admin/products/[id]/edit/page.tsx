import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { ProductEditor } from "@/components/product-editor";
import { getViewer } from "@/lib/auth/viewer";
import { getTenantProductById, getTenantProductFamilies } from "@/lib/products/data";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [{ product }, familyResult, viewer] = await Promise.all([getTenantProductById(id), getTenantProductFamilies(), getViewer()]);
  if (!product || !viewer?.organizationId) notFound();

  return <AppShell title="Edit Product">
    <PageHeader eyebrow="Tenant catalog" title={`Edit ${product.name}`} description={`${product.model || "Standard configuration"} · Update the product details and image gallery.`} action={<Link className="btn btn-ghost" href="/admin/products"><ArrowLeft size={16}/> Products</Link>}/>
    <ProductEditor product={product} families={familyResult.families} organizationId={viewer.organizationId}/>
  </AppShell>;
}

import { MessageGenerator } from "@/components/message-generator";
import { getTenantProducts } from "@/lib/products/data";

export default async function Text() {
  const result = await getTenantProducts();
  const products = result.products.map((product) => `${product.name}${product.model ? ` — ${product.model}` : ""}`);
  return <MessageGenerator kind="text" productOptions={products}/>;
}

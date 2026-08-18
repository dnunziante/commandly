import { MessageGenerator } from "@/components/message-generator";
import { getTenantProducts } from "@/lib/products/data";

export default async function Email() {
  const result = await getTenantProducts();
  const products = result.products.map((product) => `${product.name}${product.model ? ` — ${product.model}` : ""}`);
  return <MessageGenerator kind="email" productOptions={products}/>;
}

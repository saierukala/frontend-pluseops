import { ShellPlaceholder } from "@/components/layout/placeholder";

export default function Page() {
  return (
    <ShellPlaceholder
      title="Product Detail"
      description="Product detail — gallery, variants, stock, add to cart (F26). Route is /store/products/[id] — id param will be validated by backend in F26+."
      route="/store/products/:id"
      shell="Storefront"
      backendNote="BACKEND DEPENDENCY — product detail public fetch not yet wired."
      nextSteps={[]}
    />
  );
}

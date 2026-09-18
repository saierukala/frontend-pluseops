import { ShellPlaceholder } from "@/components/layout/placeholder";

export default function Page() {
  return (
    <ShellPlaceholder
      title="Store — Home"
      description="Customer-facing homepage — hero, featured products, categories, collections. Distinct from dashboard (F26)."
      route="/store"
      shell="Storefront"
      backendNote="BACKEND DEPENDENCY — anon storefront product API not yet available. UI shell only."
      nextSteps={[{ label: "Products", href: "/store/products" }, { label: "Categories", href: "/store/categories" }]}
    />
  );
}


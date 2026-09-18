import { ShellPlaceholder } from "@/components/layout/placeholder";

export default function Page() {
  return (
    <ShellPlaceholder
      title="Store — Products"
      description="Product discovery — grid, search, category, price filter, sort, stock availability (F26)."
      route="/store/products"
      shell="Storefront"
      backendNote="BACKEND DEPENDENCY — customer catalog browsing awaiting backend."
      nextSteps={[{ label: "Store Home", href: "/store" }]}
    />
  );
}


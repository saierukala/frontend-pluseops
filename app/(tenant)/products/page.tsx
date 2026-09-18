import { ShellPlaceholder } from "@/components/layout/placeholder";

export default function Page() {
  return (
    <ShellPlaceholder
      title="Products"
      description="Product catalog — search, filters, pagination, and CRUD will be built in F10."
      route="/products"
      shell="Tenant"
      
      nextSteps={[{ label: "Categories", href: "/categories" }, { label: "Attributes", href: "/attributes" }]}
    />
  );
}


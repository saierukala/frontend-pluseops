import { ShellPlaceholder } from "@/components/layout/placeholder";

export default function Page() {
  return (
    <ShellPlaceholder
      title="Attributes"
      description="Attribute definitions and values — color, size, material, brand (F13)."
      route="/attributes"
      shell="Tenant"
      
      nextSteps={[{ label: "Products", href: "/products" }]}
    />
  );
}


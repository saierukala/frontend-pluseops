import { ShellPlaceholder } from "@/components/layout/placeholder";

export default function Page() {
  return (
    <ShellPlaceholder
      title="Categories"
      description="Hierarchical category tree — create, edit, delete, and parent assignment (F12)."
      route="/categories"
      shell="Tenant"
      
      nextSteps={[{ label: "Products", href: "/products" }]}
    />
  );
}


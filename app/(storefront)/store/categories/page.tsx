import { ShellPlaceholder } from "@/components/layout/placeholder";

export default function Page() {
  return (
    <ShellPlaceholder
      title="Store — Categories"
      description="Category browsing — hierarchical navigation for customers (F26)."
      route="/store/categories"
      shell="Storefront"
      backendNote="BACKEND DEPENDENCY — categories public listing depends on product APIs."
      nextSteps={[]}
    />
  );
}


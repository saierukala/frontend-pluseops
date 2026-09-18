import { ShellPlaceholder } from "@/components/layout/placeholder";

export default function Page() {
  return (
    <ShellPlaceholder
      title="Cart"
      description="Cart — image, variant, qty, price, subtotal, remove, stock validation (F27). Extremely simple."
      route="/cart"
      shell="Storefront"
      backendNote="BACKEND DEPENDENCY — /cart routes not available."
      nextSteps={[{ label: "Store", href: "/store" }, { label: "Checkout", href: "/checkout" }]}
    />
  );
}


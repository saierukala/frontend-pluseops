import { expect, test } from "@playwright/test";
import { rupees, signIn, tenantAdmin } from "./fixtures";

test("staff order is priced in rupees with 18% GST", async ({ page }) => {
  await signIn(page, tenantAdmin.email, tenantAdmin.password);
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto("/orders/new");
  const pick = async (trigger: string) => {
    await page.getByRole("combobox").filter({ hasText: trigger }).click();
    await page.getByRole("option").first().click();
  };
  await pick("Search customers");
  await pick("Search product or SKU");
  await expect(page.getByText("GST (18%)")).toBeVisible();
  await page.getByRole("button", { name: "Place order" }).click();

  await expect(page).toHaveURL(/\/orders\/[0-9a-f-]{36}$/);
  const row = (label: string | RegExp) => page.locator("dl > div").filter({ has: page.locator("dt", { hasText: label }) }).locator("dd");
  await expect(row("GST (18%)")).toBeVisible();
  const subtotal = rupees(await row("Subtotal").innerText());
  const gst = rupees(await row("GST (18%)").innerText());
  expect(gst).toBeCloseTo(subtotal * 0.18, 1);
});

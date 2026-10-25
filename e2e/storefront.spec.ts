import { expect, test } from "@playwright/test";
import { rupees, store } from "./fixtures";

test("a new shopper signs up and checks out with GST in rupees", async ({ page }) => {
  const email = `shopper.${Date.now()}@e2e.test`;
  const password = "Shopper#2026e2e";

  await page.goto(`/shop/${store}/register`);
  await page.getByLabel("First name").fill("Esha");
  await page.getByLabel("Last name").fill("Tester");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("link", { name: "Continue (development mode)" }).click();
  await page.getByLabel("New password").fill(password);
  await page.getByLabel("Confirm password").fill(password);
  await page.getByRole("button", { name: "Save and sign in" }).click();
  await expect(page.getByText("You're signed in, Esha")).toBeVisible();

  await page.goto(`/shop/${store}`);
  await page.locator(`a[href*="/shop/${store}/products/"]`).first().click();
  await page.getByRole("button", { name: "Add to cart" }).click();

  await page.goto(`/shop/${store}/cart`);
  await expect(page.getByText("GST (18%)")).toBeVisible();
  await page.getByRole("link", { name: /checkout/i }).click();

  await expect(page).toHaveURL(new RegExp(`/shop/${store}/checkout`));
  await page.getByLabel("First name").fill("Esha");
  await page.getByLabel("Last name").fill("Tester");
  await page.getByLabel("Street address").fill("12 MG Road");
  await page.getByLabel("City").fill("Bengaluru");
  await page.getByLabel("State").fill("KA");
  await page.getByLabel("Postal code").fill("560001");
  await page.getByLabel("Country code").fill("IN");
  await page.getByRole("button", { name: "Use this address" }).click();
  await page.getByRole("button", { name: /^Place order/ }).click();

  await expect(page).toHaveURL(new RegExp(`/shop/${store}/account/orders/[0-9a-f-]{36}`));
  const row = (label: string) => page.locator("dl > div").filter({ has: page.locator("dt", { hasText: label }) }).locator("dd");
  await expect(row("GST (18%)")).toBeVisible();
  const gst = rupees(await row("GST (18%)").innerText());
  expect(gst).toBeGreaterThan(0);
});

import { expect, test, type Page } from "@playwright/test";
import { signIn, tenantAdmin } from "./fixtures";

/**
 * GST tax invoices on the demo shop (Karnataka): tax profile, a 5% product with an HSN code, a business
 * customer in Maharashtra (IGST), a consumer at home (CGST + SGST), and the printable invoice and receipt.
 */
const RUN = Date.now().toString(36);
const SHOP_GSTIN = "29AAACR1234A1ZZ"; // valid check digit, Karnataka
const BUYER_GSTIN = "27AAPFU0939F1ZV"; // valid check digit, Maharashtra
const SKU = `RICE-${RUN}`.toUpperCase();

test.describe.configure({ mode: "serial" });
test.setTimeout(180_000);

async function pick(page: Page, trigger: string | RegExp, option: string | RegExp) {
  await page.getByRole("combobox").filter({ hasText: trigger }).click();
  await page.getByRole("option", { name: option }).first().click();
}

const summaryRow = (page: Page, label: string | RegExp) => page.locator("dl > div").filter({ has: page.locator("dt", { hasText: label }) }).locator("dd").first();

test("GST invoices from setup to print", async ({ page }) => {
  await signIn(page, tenantAdmin.email, tenantAdmin.password);
  await expect(page).toHaveURL(/\/dashboard$/);

  await test.step("the shop saves its GST details; the GSTIN fills in state and PAN", async () => {
    await page.goto("/settings?tab=workspace");
    await page.getByLabel("Legal name", { exact: true }).fill(`Acme Retail Pvt Ltd ${RUN}`);
    await page.getByLabel("GSTIN", { exact: true }).fill("29AAACR1234A1ZX");
    await page.getByRole("button", { name: "Save GST details" }).click();
    await expect(page.getByText("Not a valid GSTIN")).toBeVisible();
    await page.getByLabel("GSTIN", { exact: true }).fill(SHOP_GSTIN);
    await page.getByLabel("Invoice prefix", { exact: true }).fill("ACME");
    await page.getByRole("button", { name: "Save GST details" }).click();
    await expect(page.getByText("Tax profile saved")).toBeVisible();
    await expect(page.getByLabel("PAN", { exact: true })).toHaveValue("AAACR1234A");
    await expect(page.getByText(/Registered in Karnataka/)).toBeVisible();
  });

  await test.step("a product with HSN 1006 at 5% GST", async () => {
    await page.goto("/products");
    await page.getByRole("button", { name: "Add product" }).first().click();
    const d = page.getByRole("dialog", { name: "New product" });
    await d.getByLabel("Name", { exact: true }).fill(`Basmati ${RUN}`);
    await d.getByLabel("Base price", { exact: true }).fill("500");
    await d.getByLabel("HSN / SAC code", { exact: true }).fill("1006");
    await d.locator("#p-gst").click();
    await page.getByRole("option", { name: "5%", exact: true }).click();
    await d.getByRole("button", { name: "Create product" }).click();
    await page.getByRole("row", { name: new RegExp(`Basmati ${RUN}`) }).getByText(`Basmati ${RUN}`).click();
    await expect(page).toHaveURL(/\/products\/[0-9a-f-]{36}$/);
    await page.getByRole("button", { name: "Add variant" }).click();
    const v = page.getByRole("dialog", { name: "New variant" });
    await v.getByLabel("SKU", { exact: true }).fill(SKU);
    await v.getByLabel("MRP", { exact: true }).fill("550");
    await v.getByRole("button", { name: "Create variant" }).click();
    await expect(page.getByRole("cell", { name: SKU })).toBeVisible();
    await page.goto("/inventory");
    await page.getByRole("button", { name: "Adjust stock" }).click();
    const a = page.getByRole("dialog", { name: "Adjust stock" });
    await a.getByRole("combobox").filter({ hasText: "Search product or SKU" }).click();
    await page.getByRole("option", { name: new RegExp(SKU) }).first().click();
    await a.getByLabel("Quantity", { exact: true }).fill("20");
    await a.getByRole("button", { name: "Apply adjustment" }).click();
    await expect(page.getByRole("row", { name: new RegExp(SKU) })).toBeVisible();
  });

  await test.step("a business customer with a Maharashtra GSTIN", async () => {
    await page.goto("/customers");
    await page.getByRole("button", { name: "Add customer" }).first().click();
    const d = page.getByRole("dialog", { name: "New customer" });
    await d.getByRole("radio", { name: /Business/ }).click();
    await d.getByLabel("Company name", { exact: true }).fill(`Ravi Traders ${RUN}`);
    await d.getByLabel("Contact first name", { exact: true }).fill("Ravi");
    await d.getByLabel("Contact last name", { exact: true }).fill("Rao");
    await d.getByLabel("Email", { exact: true }).fill(`ravi.${RUN}@e2e.test`);
    await d.getByLabel("GSTIN", { exact: true }).fill(BUYER_GSTIN);
    await d.getByRole("button", { name: "Add customer" }).click();
    await expect(page.getByText(`ravi.${RUN}@e2e.test`)).toBeVisible();
  });

  let orderUrl = "";
  await test.step("selling to another state charges IGST and numbers the invoice", async () => {
    await page.goto("/orders/new");
    await pick(page, "Search customers", /Ravi Rao/);
    await pick(page, "Search product or SKU", new RegExp(SKU));
    await page.locator('input[name="items.0.quantity"]').fill("2");
    await page.getByRole("button", { name: "Place order" }).click();
    await expect(page).toHaveURL(/\/orders\/[0-9a-f-]{36}$/);
    orderUrl = page.url();
    await expect(page.getByText(/Invoice ACME\/\d{4}-\d{2}\/\d{4}/)).toBeVisible();
    await expect(page.getByText("HSN 1006 · 5% GST").first()).toBeVisible();
    await expect(summaryRow(page, "GST (5%)")).toHaveText("₹50.00");
    await expect(summaryRow(page, "Tax split")).toHaveText("IGST ₹50.00");
    await expect(summaryRow(page, /^Total$/)).toHaveText("₹1,050.00");
  });

  await test.step("the printable tax invoice shows both GSTINs, place of supply and amount in words", async () => {
    await page.goto(orderUrl.replace("/orders/", "/print/invoice/"));
    await expect(page.getByText("TAX INVOICE")).toBeVisible();
    await expect(page.getByText(`GSTIN ${SHOP_GSTIN}`)).toBeVisible();
    await expect(page.getByText(`GSTIN ${BUYER_GSTIN}`)).toBeVisible();
    await expect(page.getByText("Maharashtra (27)")).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "IGST" }).first()).toBeVisible();
    await expect(page.getByText("One Thousand Fifty Rupees Only")).toBeVisible();
  });

  await test.step("the 80mm receipt prints the same bill compactly", async () => {
    await page.goto(`${orderUrl.replace("/orders/", "/print/invoice/")}?format=receipt`);
    await expect(page.getByText(/Bill: ACME\//)).toBeVisible();
    await expect(page.getByText("2 × 500.00 @5%")).toBeVisible();
    await expect(page.getByText("₹1050.00")).toBeVisible();
  });

  await test.step("selling inside Karnataka splits GST into CGST + SGST", async () => {
    await page.goto("/customers");
    await page.getByRole("button", { name: "Add customer" }).first().click();
    const d = page.getByRole("dialog", { name: "New customer" });
    await d.getByLabel("First name", { exact: true }).fill("Kiran");
    await d.getByLabel("Last name", { exact: true }).fill(RUN);
    await d.getByLabel("Email", { exact: true }).fill(`kiran.${RUN}@e2e.test`);
    await d.locator("#cu-state").click();
    await page.getByRole("option", { name: "Karnataka (29)" }).click();
    await d.getByRole("button", { name: "Add customer" }).click();
    await expect(page.getByText(`kiran.${RUN}@e2e.test`)).toBeVisible();

    await page.goto("/orders/new");
    await pick(page, "Search customers", new RegExp(`Kiran ${RUN}`));
    await pick(page, "Search product or SKU", new RegExp(SKU));
    await page.getByRole("button", { name: "Place order" }).click();
    await expect(page).toHaveURL(/\/orders\/[0-9a-f-]{36}$/);
    await expect(summaryRow(page, "Tax split")).toHaveText("CGST ₹12.50 · SGST ₹12.50");
  });
});

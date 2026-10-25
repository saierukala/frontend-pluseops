import { expect, test, type Page } from "@playwright/test";
import { platformAdmin, rupees, signIn } from "./fixtures";

/**
 * The whole PulseOps story in one run, in the order it happens in real life:
 * the platform team opens a business, the business sets up shop and sells, a shopper buys online,
 * and access rules hold. Each test.step is one checked point (see docs/HOW_PULSEOPS_WORKS.md).
 */

const RUN = Date.now().toString(36);
const SHOP = { name: `E2E Traders ${RUN}`, slug: `e2e-${RUN}` };
const OWNER = { first: "Riya", last: "Owner", email: `owner.${RUN}@e2e.test`, password: "Owner#2026pass" };
const SHOPPER = { first: "Kabir", last: "Shopper", email: `shopper.${RUN}@e2e.test`, password: "Shopper#2026pass" };
const SKU = `KETTLE-${RUN}`.toUpperCase();

test.describe.configure({ mode: "serial" });
test.setTimeout(240_000);

/** Pick an option in one of the searchable comboboxes by typing part of its label. */
async function pick(page: Page, trigger: string | RegExp, option: string | RegExp, scope = page.locator("body")) {
  await scope.getByRole("combobox").filter({ hasText: trigger }).click();
  await page.getByRole("option", { name: option }).first().click();
}

async function logOut(page: Page) {
  await page.locator('[data-slot="sidebar-footer"] button').first().click();
  await page.getByRole("menuitem", { name: "Log out" }).click();
  await expect(page).toHaveURL(/\/login/);
}

const summaryRow = (page: Page, label: string | RegExp) =>
  page.locator("dl > div").filter({ has: page.locator("dt", { hasText: label }) }).locator("dd").first();

test("1 · the public site", async ({ page }) => {
  await test.step("landing page explains the product and offers sign-in", async () => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Run your whole business");
    await expect(page.getByRole("link", { name: "Sign in" }).first()).toBeVisible();
  });
  await test.step("store finder opens a shop by its name", async () => {
    await page.goto("/store");
    await page.getByRole("textbox").fill("acme");
    await page.getByRole("button", { name: /Go to store/ }).click();
    await expect(page).toHaveURL(/\/shop\/acme$/);
    await expect(page.getByText(/Prices in INR/).first()).toBeVisible();
  });
});

test("2 · the platform team opens a new business", async ({ page }) => {
  test.skip(!platformAdmin.email, "E2E_PLATFORM_EMAIL / E2E_PLATFORM_PASSWORD not set");

  await test.step("platform admin signs in on the shared sign-in page and lands in the console", async () => {
    await signIn(page, platformAdmin.email, platformAdmin.password);
    await expect(page).toHaveURL(/\/platform$/);
    await expect(page.getByRole("heading", { name: "Platform overview" })).toBeVisible();
  });
  await test.step("system health reports API, database, Redis and jobs", async () => {
    await page.goto("/platform/system");
    await expect(page.getByText("All systems operational")).toBeVisible();
  });
  await test.step("plans page lists the subscription plans", async () => {
    await page.goto("/platform/subscriptions");
    await expect(page.getByRole("cell", { name: /Free/ }).first()).toBeVisible();
  });
  await test.step("creates a business with its first admin", async () => {
    await page.goto("/platform/tenants");
    await page.getByRole("button", { name: "Create tenant" }).click();
    const dialog = page.getByRole("dialog", { name: "Create tenant" });
    await dialog.getByLabel("Business name", { exact: true }).fill(SHOP.name);
    await dialog.getByLabel("Slug", { exact: true }).fill(SHOP.slug);
    await dialog.getByLabel("First name", { exact: true }).fill(OWNER.first);
    await dialog.getByLabel("Last name", { exact: true }).fill(OWNER.last);
    await dialog.getByLabel("Email", { exact: true }).fill(OWNER.email);
    await dialog.getByLabel("Password", { exact: true }).fill(OWNER.password);
    await dialog.getByRole("button", { name: "Create tenant" }).click();
    await expect(page.getByText(`${SHOP.name} is ready`)).toBeVisible();
  });
  await test.step("the new business appears in the tenant list and opens", async () => {
    await page.getByPlaceholder("Search by name or slug…").fill(SHOP.slug);
    await expect(page).toHaveURL(new RegExp(`q=${SHOP.slug}`));
    await expect(page.getByRole("row")).toHaveCount(2);
    await page.getByRole("link", { name: new RegExp(SHOP.name) }).click();
    await expect(page).toHaveURL(/\/platform\/tenants\/[0-9a-f-]{36}$/);
    await expect(page.getByRole("heading", { name: SHOP.name })).toBeVisible();
    await expect(page.getByText("Active").first()).toBeVisible();
  });
  await test.step("the platform audit log records the new tenant", async () => {
    await page.goto("/platform/audit");
    await expect(page.getByText(/Tenant create/i).first()).toBeVisible();
  });
  await test.step("platform admin logs out", async () => logOut(page));
});

test("3 · the business sets up and sells", async ({ page }) => {
  test.skip(!platformAdmin.email, "needs the business created in step 2");

  await test.step("the new owner signs in on the same page and lands in their own workspace", async () => {
    await signIn(page, OWNER.email, OWNER.password);
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.locator('[data-slot="sidebar"]').getByText(SHOP.name).first()).toBeVisible();
  });
  await test.step("adds a warehouse", async () => {
    await page.goto("/warehouses");
    await page.getByRole("button", { name: "Add warehouse" }).click();
    const d = page.getByRole("dialog", { name: "New warehouse" });
    await d.getByLabel("Name", { exact: true }).fill("Pune Main");
    await d.getByLabel("Code", { exact: true }).fill("PUNE");
    await d.getByLabel("City", { exact: true }).fill("Pune");
    await d.getByRole("button", { name: /Create|Add|Save/ }).click();
    await expect(page.getByRole("cell", { name: /Pune Main/ })).toBeVisible();
  });
  await test.step("adds a category", async () => {
    await page.goto("/categories");
    await page.getByRole("button", { name: "Add category" }).click();
    const d = page.getByRole("dialog", { name: "New category" });
    await d.getByLabel("Name", { exact: true }).fill("Kitchen");
    await d.getByRole("button", { name: "Create category" }).click();
    await expect(page.getByRole("cell", { name: /Kitchen/ })).toBeVisible();
  });
  await test.step("adds a product priced in rupees", async () => {
    await page.goto("/products");
    await page.getByRole("button", { name: "Add product" }).first().click();
    const d = page.getByRole("dialog", { name: "New product" });
    await d.getByLabel("Name", { exact: true }).fill("Steel Kettle");
    await d.getByLabel("Base price", { exact: true }).fill("1000");
    await d.getByRole("button", { name: "Create product" }).click();
    await expect(page.getByRole("cell", { name: /₹1,000\.00/ })).toBeVisible();
    await page.getByText("Steel Kettle").first().click();
    await expect(page).toHaveURL(/\/products\/[0-9a-f-]{36}$/);
    await expect(page.getByRole("heading", { name: "Steel Kettle" })).toBeVisible();
  });
  await test.step("adds a sellable variant (SKU)", async () => {
    await page.getByRole("button", { name: "Add variant" }).click();
    const d = page.getByRole("dialog", { name: "New variant" });
    await d.getByLabel("SKU", { exact: true }).fill(SKU);
    await d.getByLabel("Price", { exact: true }).fill("1000");
    await d.getByRole("button", { name: "Create variant" }).click();
    await expect(page.getByRole("cell", { name: SKU })).toBeVisible();
  });
  await test.step("receives 50 units into the warehouse", async () => {
    await page.goto("/inventory");
    await page.getByRole("button", { name: "Adjust stock" }).click();
    const d = page.getByRole("dialog", { name: "Adjust stock" });
    await pick(page, "Search product or SKU", new RegExp(SKU), d);
    await d.getByLabel("Quantity", { exact: true }).fill("50");
    await d.getByLabel("Reason", { exact: true }).fill("Opening stock");
    await d.getByRole("button", { name: "Apply adjustment" }).click();
    await expect(page.getByRole("row", { name: new RegExp(SKU) }).getByRole("cell", { name: "50" }).first()).toBeVisible();
  });
  await test.step("adds a customer", async () => {
    await page.goto("/customers");
    await page.getByRole("button", { name: "Add customer" }).first().click();
    const d = page.getByRole("dialog", { name: "New customer" });
    await d.getByLabel("First name", { exact: true }).fill("Meera");
    await d.getByLabel("Last name", { exact: true }).fill("Iyer");
    await d.getByLabel("Email", { exact: true }).fill(`meera.${RUN}@e2e.test`);
    await d.getByRole("button", { name: "Add customer" }).click();
    await expect(page.getByText(`meera.${RUN}@e2e.test`)).toBeVisible();
  });

  let orderUrl = "";
  await test.step("creates an order: 2 kettles, GST 18% added automatically", async () => {
    await page.goto("/orders/new");
    await pick(page, "Search customers", /Meera Iyer/);
    await pick(page, "Search product or SKU", new RegExp(SKU));
    await page.locator('input[name="items.0.quantity"]').fill("2");
    await expect(page.getByText("GST (18%)")).toBeVisible();
    await page.getByRole("button", { name: "Place order" }).click();
    await expect(page).toHaveURL(/\/orders\/[0-9a-f-]{36}$/);
    orderUrl = page.url();
    expect(rupees(await summaryRow(page, "Subtotal").innerText())).toBe(2000);
    expect(rupees(await summaryRow(page, "GST (18%)").innerText())).toBe(360);
    expect(rupees(await summaryRow(page, /^Total$/).innerText())).toBe(2360);
  });
  await test.step("placing the order takes the 2 units out of stock (48 left)", async () => {
    await page.goto("/inventory");
    const row = page.getByRole("row", { name: new RegExp(SKU) });
    await expect(row.getByRole("cell", { name: "48" }).first()).toBeVisible();
    await page.goto("/inventory/movements");
    await expect(page.getByText(/Order created/i).first()).toBeVisible();
  });
  await test.step("records the payment for the order", async () => {
    await page.goto(orderUrl);
    await page.getByRole("button", { name: /Confirm payment|Record payment/ }).first().click();
    const d = page.getByRole("dialog");
    await d.getByRole("button", { name: /Charge/ }).click();
    await expect(page.getByText("Completed").first()).toBeVisible();
  });
  await test.step("moves the order through confirmed → processing → shipped → delivered", async () => {
    for (const action of ["Confirm order", "Start processing", "Mark as shipped", "Mark as delivered"]) {
      await page.getByRole("button", { name: action }).first().click();
      await page.getByRole("dialog").getByRole("button", { name: action }).click();
      await expect(page.getByRole("dialog")).toBeHidden();
    }
    await expect(page.getByText("Delivered").first()).toBeVisible();
  });
  await test.step("payments page lists the completed payment in rupees", async () => {
    await page.goto("/payments");
    await expect(page.getByText("₹2,360.00").first()).toBeVisible();
  });
  await test.step("dashboard and analytics count the sale", async () => {
    await page.goto("/dashboard");
    await expect(page.getByText("₹2,360.00").first()).toBeVisible();
    await page.goto("/analytics/revenue");
    await expect(page.getByText("₹2,360.00").first()).toBeVisible();
  });
  await test.step("requests a CSV export of orders", async () => {
    await page.goto("/reports");
    await page.getByRole("button", { name: "New export" }).click();
    await page.getByRole("dialog", { name: "New CSV export" }).getByRole("button", { name: "Start export" }).click();
    await expect(page.getByRole("row").nth(1)).toBeVisible();
  });
  await test.step("creates a custom role", async () => {
    await page.goto("/admin/roles");
    await page.getByRole("button", { name: "Create role" }).first().click();
    await page.getByLabel(/Name/).first().fill(`packer_${RUN}`);
    await page.getByRole("dialog").getByRole("button", { name: /Create/ }).click();
    await expect(page.getByText(`packer_${RUN}`).first()).toBeVisible();
  });
  await test.step("the audit log records who did what", async () => {
    await page.goto("/admin/audit");
    await expect(page.getByText(/Order/).first()).toBeVisible();
    await expect(page.getByText(`${OWNER.first} ${OWNER.last}`).first()).toBeVisible();
  });
  await test.step("a business owner can't open the platform console", async () => {
    await page.goto("/platform");
    await expect(page.getByText("Platform console only")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Platform overview" })).toHaveCount(0);
  });
  await test.step("owner logs out", async () => {
    await page.getByRole("link", { name: "Back to dashboard" }).click();
    await logOut(page);
  });
});

test("4 · a shopper buys from the new shop", async ({ page }) => {
  test.skip(!platformAdmin.email, "needs the business created in step 2");

  await test.step("signs up in the shop and sets a password", async () => {
    await page.goto(`/shop/${SHOP.slug}/register`);
    await page.getByLabel("First name", { exact: true }).fill(SHOPPER.first);
    await page.getByLabel("Last name", { exact: true }).fill(SHOPPER.last);
    await page.getByLabel("Email", { exact: true }).fill(SHOPPER.email);
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await page.getByRole("link", { name: "Continue (development mode)" }).click();
    await page.getByLabel("New password", { exact: true }).fill(SHOPPER.password);
    await page.getByLabel("Confirm password", { exact: true }).fill(SHOPPER.password);
    await page.getByRole("button", { name: "Save and sign in" }).click();
    await expect(page.getByText(`You're signed in, ${SHOPPER.first}`)).toBeVisible();
  });
  await test.step("finds the product in the catalog and adds it to the cart", async () => {
    await page.goto(`/shop/${SHOP.slug}`);
    await page.getByRole("link", { name: /Steel Kettle/ }).first().click();
    await expect(page.getByText("₹1,000.00").first()).toBeVisible();
    await page.getByRole("button", { name: "Add to cart" }).click();
  });
  await test.step("cart shows subtotal, 18% GST and the total", async () => {
    await page.goto(`/shop/${SHOP.slug}/cart`);
    await expect(page.getByText("GST (18%)")).toBeVisible();
    await expect(page.getByText("₹180.00").first()).toBeVisible();
    await expect(page.getByText("₹1,180.00").first()).toBeVisible();
  });
  await test.step("checks out with a delivery address", async () => {
    await page.getByRole("link", { name: /checkout/i }).click();
    await page.getByLabel("First name", { exact: true }).fill(SHOPPER.first);
    await page.getByLabel("Last name", { exact: true }).fill(SHOPPER.last);
    await page.getByLabel("Street address", { exact: true }).fill("4 FC Road");
    await page.getByLabel("City", { exact: true }).fill("Pune");
    await page.getByLabel("State", { exact: true }).fill("MH");
    await page.getByLabel("Postal code", { exact: true }).fill("411004");
    await page.getByLabel("Country code", { exact: true }).fill("IN");
    await page.getByRole("button", { name: "Use this address" }).click();
    await page.getByRole("button", { name: /^Place order/ }).click();
    await expect(page).toHaveURL(new RegExp(`/shop/${SHOP.slug}/account/orders/[0-9a-f-]{36}`));
    expect(rupees(await summaryRow(page, "GST (18%)").innerText())).toBe(180);
  });
  await test.step("the order shows in the shopper's account", async () => {
    await page.goto(`/shop/${SHOP.slug}/account`);
    await expect(page.getByText("₹1,180.00").first()).toBeVisible();
  });
});

test("5 · the business sees the shop order and sign-in stays safe", async ({ page }) => {
  test.skip(!platformAdmin.email, "needs the business created in step 2");

  await test.step("the shop order arrives in the business's order list", async () => {
    await signIn(page, OWNER.email, OWNER.password);
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.goto("/orders");
    await expect(page.getByText(`${SHOPPER.first} ${SHOPPER.last}`).first()).toBeVisible();
    await expect(page.getByText("₹1,180.00").first()).toBeVisible();
  });
  await test.step("a notification tells staff about new orders", async () => {
    await page.goto("/notifications");
    await expect(page.getByText(/Order created/i).first()).toBeVisible();
  });
  await test.step("after logging out, workspace pages ask to sign in again", async () => {
    await logOut(page);
    await page.goto("/dashboard");
    await expect(page).not.toHaveURL(/\/dashboard$/);
  });
  await test.step("a wrong password is refused", async () => {
    await signIn(page, OWNER.email, "Wrong#password1");
    await expect(page.getByText("Invalid credentials")).toBeVisible();
  });
});

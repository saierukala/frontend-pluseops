import { expect, test, type Page } from "@playwright/test";
import { signIn, tenantAdmin } from "./fixtures";

/** The counter on the demo shop: register, barcode/SKU entry, cash with change, split payment, hold/resume, closing. */
test.describe.configure({ mode: "serial" });
test.setTimeout(180_000);

const SKU = "HOOD-M"; // demo product on the workspace rate (18% GST); its price differs between seeds, so it is read from the screen

/** "₹2,948.82" → paise */
const paise = (text: string) => Math.round(Number(text.replace(/[^0-9.]/g, "")) * 100);
/** paise → "₹2,948.82", as the app formats it */
const rupees = (p: number) => `₹${(p / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
/** Bill for n units at a unit price (paise) with 18% GST added, rounded like the server */
const bill = (unit: number, n: number) => unit * n + Math.round((unit * n * 1800) / 10000);
let unit = 0;

async function scan(page: Page, code: string) {
  const search = page.getByLabel("Scan or search items");
  await search.fill(code);
  await search.press("Enter");
}

test("selling at the counter", async ({ page }) => {
  await signIn(page, tenantAdmin.email, tenantAdmin.password);
  await expect(page).toHaveURL(/\/dashboard$/);

  await test.step("the sidebar opens the counter", async () => {
    await page.getByRole("link", { name: "Counter (POS)" }).click();
    await expect(page).toHaveURL(/\/pos$/);
    await expect(page.getByLabel("Scan or search items")).toBeFocused();
  });

  await test.step("open the register with a ₹1,000 float", async () => {
    // A shift left open by an earlier run is closed first
    if (await page.getByRole("button", { name: "Close register" }).isVisible()) {
      await page.getByRole("button", { name: "Close register" }).click();
      const expected = (await page.getByRole("dialog").locator("dd").last().innerText()).replace(/[^0-9.]/g, "");
      await page.getByLabel("Counted cash").fill(expected);
      await page.getByRole("dialog").getByRole("button", { name: "Close register" }).click();
      await expect(page.getByText(/closed/i).first()).toBeVisible();
    }
    await page.getByRole("button", { name: "Open register" }).click();
    await page.getByLabel("Opening float").fill("1000");
    await page.getByRole("dialog").getByRole("button", { name: "Open register" }).click();
    await expect(page.getByText("₹1,000.00 in drawer")).toBeVisible();
  });

  await test.step("an exact SKU (as a scanner types it) adds the item; quantity goes up on a second scan", async () => {
    await scan(page, SKU);
    await expect(page.getByRole("list", { name: "Cart" }).getByText("Everyday Hoodie")).toBeVisible();
    unit = paise((await page.getByRole("list", { name: "Cart" }).getByText(/· 18% GST/).innerText()).split("·")[0]);
    await scan(page, SKU);
    await expect(page.getByLabel("Quantity of Everyday Hoodie")).toHaveValue("2");
    await expect(page.getByLabel("Bill total")).toHaveText(rupees(bill(unit, 2)));
  });

  await test.step("cash payment shows the change, and the sale completes with an invoice", async () => {
    await page.keyboard.press("F8");
    const pay = page.getByRole("dialog", { name: /Payment/ });
    await expect(pay).toBeVisible();
    // Customer hands over the next round ₹100 above the bill
    const given = Math.ceil(bill(unit, 2) / 10000) * 10000 + 10000;
    const change = rupees(given - bill(unit, 2));
    await pay.getByLabel("Cash given").fill(String(given / 100));
    await expect(pay.getByText(change)).toBeVisible();
    await pay.getByRole("button", { name: /Complete sale/ }).click();
    const done = page.getByRole("dialog", { name: /Sale complete/ });
    await expect(done).toBeVisible();
    await expect(done.getByText(/Invoice ACME\/\d{4}-\d{2}\/\d{4}/)).toBeVisible();
    await expect(done.getByLabel("Change to give")).toHaveText(change);
    await expect(done.getByRole("link", { name: "Receipt" })).toHaveAttribute("href", /format=receipt/);
    await done.getByRole("button", { name: /New sale/ }).click();
    await expect(page.getByText(`${rupees(100000 + bill(unit, 2))} in drawer`)).toBeVisible();
  });

  await test.step("split payment: card + UPI confirmed by the cashier", async () => {
    await scan(page, SKU);
    await expect(page.getByLabel("Bill total")).toHaveText(rupees(bill(unit, 1)));
    await page.getByRole("button", { name: /^Pay / }).click();
    const pay = page.getByRole("dialog", { name: /Payment/ });
    await pay.getByRole("button", { name: "Card" }).click();
    await pay.getByLabel("Card amount").fill("30");
    const upiPart = ((bill(unit, 1) - 3000) / 100).toFixed(2);
    await pay.getByRole("button", { name: "Add another payment" }).click();
    const methods = pay.getByLabel("Payment method");
    await methods.nth(1).selectOption("UPI");
    await pay.getByLabel("UPI amount").fill(upiPart);
    await expect(pay.getByText("Confirm the UPI payment")).toBeVisible();
    await pay.getByRole("button", { name: "Mark received" }).click();
    await pay.getByRole("button", { name: /Complete sale/ }).click();
    const done = page.getByRole("dialog", { name: /Sale complete/ });
    await expect(done.getByText("card")).toBeVisible();
    await expect(done.getByText("upi")).toBeVisible();
    await page.keyboard.press("Escape");
  });

  await test.step("hold a bill for one customer, serve another, then resume it", async () => {
    await scan(page, SKU);
    await expect(page.getByRole("list", { name: "Cart" }).getByText("Everyday Hoodie")).toBeVisible();
    await page.keyboard.press("F4");
    await expect(page.getByText("Sale held")).toBeVisible();
    await expect(page.getByText("The bill is empty")).toBeVisible();
    await page.getByRole("button", { name: /Held/ }).click();
    await page.getByRole("dialog", { name: "Held sales" }).getByRole("button", { name: "Resume" }).first().click();
    await expect(page.getByRole("list", { name: "Cart" }).getByText("Everyday Hoodie")).toBeVisible();
    await page.getByRole("button", { name: "Clear bill" }).click();
  });

  await test.step("close the register: counted ₹10 short is shown", async () => {
    await page.getByRole("button", { name: "Close register" }).click();
    const close = page.getByRole("dialog", { name: /Close/ });
    const inDrawer = 100000 + bill(unit, 2);
    await expect(close.getByText(rupees(inDrawer)).last()).toBeVisible();
    await close.getByLabel("Counted cash").fill(((inDrawer - 1000) / 100).toFixed(2));
    await expect(close.getByText("Short by ₹10.00")).toBeVisible();
    await close.getByRole("button", { name: "Close register" }).click();
    await expect(page.getByText(/Short by ₹10\.00/).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Open register" })).toBeVisible();
  });

  await test.step("the cash register page shows the closed shift and its difference", async () => {
    await page.goto("/cash-register");
    await expect(page.getByRole("heading", { name: "Cash register" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "−₹10.00" }).first()).toBeVisible();
  });
});

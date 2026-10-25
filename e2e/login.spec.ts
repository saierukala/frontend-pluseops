import { expect, test } from "@playwright/test";
import { platformAdmin, signIn, tenantAdmin } from "./fixtures";

test.describe("one sign-in for everyone", () => {
  test("has no tenant / platform tabs", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
    await expect(page.getByRole("tab")).toHaveCount(0);
  });

  test("a business user lands in their workspace", async ({ page }) => {
    await signIn(page, tenantAdmin.email, tenantAdmin.password);
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("a platform administrator lands in the platform console", async ({ page }) => {
    test.skip(!platformAdmin.email || !platformAdmin.password, "E2E_PLATFORM_EMAIL / E2E_PLATFORM_PASSWORD not set");
    await signIn(page, platformAdmin.email, platformAdmin.password);
    await expect(page).toHaveURL(/\/platform$/);
  });

  test("a wrong password is refused without revealing the account type", async ({ page }) => {
    await signIn(page, tenantAdmin.email, "Not-the-password-1!");
    await expect(page.getByText("Invalid credentials")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });
});

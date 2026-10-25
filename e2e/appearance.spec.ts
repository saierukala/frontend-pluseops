import { expect, test } from "@playwright/test";
import { signIn, tenantAdmin } from "./fixtures";

test.describe("appearance themes", () => {
  test("sidebar palette, accent and mode apply at once and survive a reload", async ({ page }) => {
    await signIn(page, tenantAdmin.email, tenantAdmin.password);
    await expect(page).toHaveURL(/\/dashboard$/);
    const html = page.locator("html");
    const sidebarBg = () => page.locator('[data-slot="sidebar-inner"]').first().evaluate((el) => getComputedStyle(el).backgroundColor);
    const before = await sidebarBg();

    await page.goto("/settings?tab=appearance");
    await page.getByRole("radiogroup", { name: "Sidebar color" }).getByRole("radio", { name: /Midnight/ }).click();
    await expect(html).toHaveAttribute("data-sidebar-theme", "midnight");
    expect(await sidebarBg()).not.toBe(before);
    expect(await sidebarBg()).toBe("rgb(41, 44, 65)"); // #292c41

    await page.getByRole("radiogroup", { name: "Accent color" }).getByRole("radio", { name: "Emerald" }).click();
    await expect(html).toHaveAttribute("data-accent", "emerald");
    await page.getByRole("radiogroup", { name: "Mode" }).getByRole("radio", { name: "Dark" }).click();
    await expect(html).toHaveClass(/dark/);

    await page.reload();
    await expect(html).toHaveAttribute("data-sidebar-theme", "midnight");
    await expect(html).toHaveAttribute("data-accent", "emerald");
    await expect(html).toHaveClass(/dark/);
    await expect(page.getByRole("radiogroup", { name: "Sidebar color" }).getByRole("radio", { name: /Midnight/ })).toHaveAttribute("aria-checked", "true");

    // Back to the defaults from the user menu's Appearance dialog
    await page.getByRole("button", { name: /Avery|Admin/ }).last().click();
    await page.getByRole("menuitem", { name: "Appearance…" }).click();
    const dialog = page.getByRole("dialog", { name: "Appearance" });
    await dialog.getByRole("radiogroup", { name: "Sidebar color" }).getByRole("radio", { name: /Pulse/ }).click();
    await dialog.getByRole("radiogroup", { name: "Accent color" }).getByRole("radio", { name: "Indigo" }).click();
    await dialog.getByRole("radiogroup", { name: "Mode" }).getByRole("radio", { name: "Light" }).click();
    await expect(html).not.toHaveAttribute("data-sidebar-theme", /.+/);
    await expect(html).not.toHaveAttribute("data-accent", /.+/);
    await expect(html).not.toHaveClass(/dark/);
  });
});

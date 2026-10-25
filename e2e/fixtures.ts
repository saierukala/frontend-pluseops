import { expect, type Page } from "@playwright/test";

/** Demo workspace created by the backend's `npm run db:seed:demo` (public development values). */
export const tenantAdmin = {
  email: process.env.E2E_TENANT_EMAIL ?? "demo.admin@acme.test",
  password: process.env.E2E_TENANT_PASSWORD ?? "DemoAdmin#2026",
};

/** Platform administrator from the backend seed; the platform test is skipped when these are not given. */
export const platformAdmin = {
  email: process.env.E2E_PLATFORM_EMAIL ?? "",
  password: process.env.E2E_PLATFORM_PASSWORD ?? "",
};

export const store = process.env.E2E_STORE ?? "acme";

export async function signIn(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

/** "₹1,234.50" → 1234.5 */
export function rupees(text: string): number {
  expect(text).toContain("₹");
  return Number(text.replace(/[^0-9.]/g, ""));
}

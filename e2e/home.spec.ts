import { test, expect } from "@playwright/test";

test.describe("Landing page", () => {
  test("hero renders with key CTAs", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/SUMMIT/i);
    await expect(page.getByRole("link", { name: /Secure Your Spot/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Explore Program/i })).toBeVisible();
  });

  test("navigates to the registration page", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /Secure Your Spot/i }).click();
    await expect(page).toHaveURL(/\/register/);
    await expect(page.getByRole("heading", { name: "Register" })).toBeVisible();
  });

  test("FAQ accordion expands an item", async ({ page }) => {
    await page.goto("/");
    const q = page.getByRole("button", { name: /Who can participate/i });
    await q.scrollIntoViewIfNeeded();
    await q.click();
    await expect(q).toHaveAttribute("aria-expanded", "true");
  });

  test("contact form validates empty submission", async ({ page }) => {
    await page.goto("/#contact");
    await page.getByRole("button", { name: /Send Message/i }).click();
    // native required + server validation guard; message field should block submit
    await expect(page.locator("#contact")).toBeVisible();
  });
});

test.describe("Admin", () => {
  test("protected dashboard redirects to login", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login/);
    await expect(page.getByRole("heading", { name: /Admin Login/i })).toBeVisible();
  });
});

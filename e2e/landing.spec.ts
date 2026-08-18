import { expect, test } from "@playwright/test";

test("landing page states the product quietly", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Feel close without starting a conversation",
  );
  await expect(page.getByRole("link", { name: "Create your space" })).toBeVisible();
  await expect(page.getByRole("link", { name: "I have an invite" })).toBeVisible();
  await expect(page.getByText("Stay connected like never before")).toHaveCount(0);
});

test("login is reachable from the landing CTA", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Create your space" }).click();
  await expect(page.getByRole("heading", { name: "Continue with email" })).toBeVisible();
});

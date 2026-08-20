import { expect, test } from "@playwright/test";

test("landing page states the product quietly", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Feel close without starting a conversation",
  );
  await expect(page.getByRole("link", { name: "Create your space" })).toBeVisible();
  await expect(page.getByRole("link", { name: "I have an invite" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign up" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
  await expect(page.getByText("Stay connected like never before")).toHaveCount(0);
});

test("sign-up is reachable from the landing CTA", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Create your space" }).click();
  await expect(page).toHaveURL(/\/login\?mode=signup&next=\/onboarding/);
  await expect(page.getByRole("heading", { name: "Sign up with email" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
});

test("sign-in offers an explicit sign-up option", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Continue with email" })).toBeVisible();
  await page.getByRole("link", { name: "Sign up" }).click();
  await expect(page).toHaveURL(/\/login\?mode=signup/);
  await expect(page.getByRole("heading", { name: "Sign up with email" })).toBeVisible();
});


import { test, expect } from "@playwright/test";

test.describe("E2E-01: Login Page", () => {
  test("TC-E2E-LOGIN-01: displays the login form", async ({
    page,
  }) => {
    console.log("Navigating to login page...");

    const response = await page.goto("/onboarding/login", {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });

    console.log("HTTP status:", response?.status());
    console.log("Current URL:", page.url());

    await expect(
      page.getByRole("heading", { name: "Welcome Back" })
    ).toBeVisible({ timeout: 30_000 });

    await expect(page.getByPlaceholder("Email")).toBeVisible();

    await expect(page.getByPlaceholder("Password")).toBeVisible();

    await expect(
      page.getByRole("button", {
        name: "Login",
        exact: true,
      })
    ).toBeVisible();
  });
});

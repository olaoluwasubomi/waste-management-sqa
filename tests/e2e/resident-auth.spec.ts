
import {
  test,
  expect,
} from "@playwright/test";

import {
  residentFixtures,
  createResidentFixtures,
  cleanupResidentFixtures,
} from "./helpers/resident-fixtures";

test.describe("E2E-02: Resident Authentication", () => {
  test.beforeAll(async () => {
    await createResidentFixtures();
  });

  test.afterAll(async () => {
    await cleanupResidentFixtures();
  });

  test("TC-E2E-AUTH-01: resident logs in successfully", async ({
    page,
  }) => {
    await page.goto("/onboarding/login");

    await page.getByPlaceholder("Email").fill(
      residentFixtures.active.email,
    );

    await page.getByPlaceholder("Password").fill(
      residentFixtures.active.password,
    );

    await page.getByRole("button", {
      name: "Login",
      exact: true,
    }).click();

    await expect(page).toHaveURL(/\/user\/?$/, {
      timeout: 30_000,
    });
  });

  test("TC-E2E-AUTH-02: rejects incorrect password", async ({
    page,
  }) => {
    await page.goto("/onboarding/login");

    await page.getByPlaceholder("Email").fill(
      residentFixtures.active.email,
    );

    await page.getByPlaceholder("Password").fill(
      "IncorrectPassword123!",
    );

    await page.getByRole("button", {
      name: "Login",
      exact: true,
    }).click();

    await expect(
      page.getByText("Invalid email or password"),
    ).toBeVisible();

    await expect(page).toHaveURL(
      /\/onboarding\/login/,
    );
  });

  test("TC-E2E-AUTH-03: rejects unregistered email", async ({
    page,
  }) => {
    await page.goto("/onboarding/login");

    await page.getByPlaceholder("Email").fill(
      `unknown-${Date.now()}@example.com`,
    );

    await page.getByPlaceholder("Password").fill(
      residentFixtures.active.password,
    );

    await page.getByRole("button", {
      name: "Login",
      exact: true,
    }).click();

    await expect(
      page.getByText("Invalid email or password"),
    ).toBeVisible();
  });

  test("TC-E2E-AUTH-04: validates empty login fields", async ({
    page,
  }) => {
    await page.goto("/onboarding/login");

    await page.getByRole("button", {
      name: "Login",
      exact: true,
    }).click();

    await expect(
      page.getByText("Invalid email address"),
    ).toBeVisible();

    await expect(
      page.getByText(
        "Password must be at least 8 characters long",
      ),
    ).toBeVisible();
  });

  test("TC-E2E-AUTH-05: prevents resident from accessing admin dashboard", async ({
    page,
  }) => {
    await page.goto("/onboarding/login");

    await page.getByPlaceholder("Email").fill(
      residentFixtures.active.email,
    );

    await page.getByPlaceholder("Password").fill(
      residentFixtures.active.password,
    );

    await page.getByRole("button", {
      name: "Login",
      exact: true,
    }).click();

    await expect(page).toHaveURL(/\/user\/?$/, {
      timeout: 30_000,
    });

    await page.goto("/admin");

    await expect(page).toHaveURL(
      /\/unauthorized/,
    );
  });

  test("TC-E2E-AUTH-06: redirects unauthenticated user to login", async ({
    page,
  }) => {
    await page.goto("/user");

    await expect(page).toHaveURL(
      /\/onboarding\/login/,
    );
  });

  test("TC-E2E-AUTH-07: redirects password-change-required resident", async ({
    page,
  }) => {
    await page.goto("/onboarding/login");

    await page.getByPlaceholder("Email").fill(
      residentFixtures.passwordChange.email,
    );

    await page.getByPlaceholder("Password").fill(
      residentFixtures.passwordChange.password,
    );

    await page.getByRole("button", {
      name: "Login",
      exact: true,
    }).click();

    await expect(page).toHaveURL(
      /\/onboarding\/change-password/,
      { timeout: 30_000 },
    );
  });
});


import { test, expect, type Page } from "@playwright/test";
import prisma from "../../lib/prisma";

import {
  pickupFixture,
  pickupResidentId,
  createPickupFixtures,
  cleanupPickupFixtures,
} from "./helpers/pickup-fixtures";

// ---------------------------------------------------------
// HELPER: Login as the E2E test resident
// ---------------------------------------------------------

async function loginResident(page: Page) {
  console.log("[E2E-03] Opening login page");

  await page.goto("/onboarding/login", {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });

  console.log("[E2E-03] Login page loaded");

  await page.getByPlaceholder("Email").fill(
    pickupFixture.email,
  );

  await page.getByPlaceholder("Password").fill(
    pickupFixture.password,
  );

  console.log("[E2E-03] Submitting login");

  await page.getByRole("button", {
    name: "Login",
    exact: true,
  }).click();

  await expect(page).toHaveURL(/\/user\/?$/, {
    timeout: 30_000,
  });

  console.log(
    "[E2E-03] Resident dashboard URL reached:",
    page.url(),
  );

  // A successful redirect does not necessarily mean
  // the protected dashboard has finished loading.
  await expect(
    page.getByText("Loading your account..."),
  ).toBeHidden({
    timeout: 60_000,
  });

  console.log("[E2E-03] Account loading screen cleared");
}

// ---------------------------------------------------------
// HELPER: Open the pickup request form
// ---------------------------------------------------------

async function openPickupForm(page: Page) {
  console.log("[E2E-03] Opening pickup request form");

  await page.goto("/user/myrequests/newrequests", {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });

  console.log(
    "[E2E-03] Pickup page URL:",
    page.url(),
  );

  console.log(
    "[E2E-03] Account loading visible:",
    await page
      .getByText("Loading your account...")
      .isVisible(),
  );

  // Wait for the protected page's loading state.
  await expect(
    page.getByText("Loading your account..."),
  ).toBeHidden({
    timeout: 60_000,
  });

  console.log("[E2E-03] Account loading cleared");

  await expect(
    page.getByRole("heading", {
      name: "Request a waste pickup",
    }),
  ).toBeVisible({
    timeout: 60_000,
  });

  console.log("[E2E-03] Pickup form heading visible");

  await expect(
    page.locator("#wasteTypeId"),
  ).toBeEnabled({
    timeout: 30_000,
  });

  console.log("[E2E-03] Waste type selector ready");
}

// ---------------------------------------------------------
// HELPER: Generate a future pickup date
// ---------------------------------------------------------

function futurePickupDate(): string {
  const date = new Date();

  date.setDate(date.getDate() + 7);

  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1,
  ).padStart(2, "0");

  const day = String(
    date.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// ---------------------------------------------------------
// HELPER: Generate a past pickup date
// ---------------------------------------------------------

function pastPickupDate(): string {
  const date = new Date();

  date.setDate(date.getDate() - 7);

  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1,
  ).padStart(2, "0");

  const day = String(
    date.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// ---------------------------------------------------------
// E2E-03: RESIDENT ADDRESS AND PICKUP REQUEST WORKFLOW
// ---------------------------------------------------------

test.describe.serial(
  "E2E-03: Resident Address and Pickup Request",
  () => {
    // Allow additional time for Next.js development-mode
    // compilation and page rendering on the Chromebook.
    test.setTimeout(180_000);

    let submittedReference = "";

    // -----------------------------------------------------
    // TEST SETUP
    // -----------------------------------------------------

    test.beforeAll(async () => {
      console.log(
        "[E2E-03] Creating isolated test fixtures",
      );

      await createPickupFixtures();

      console.log(
        "[E2E-03] Test resident and waste type created",
      );
    });

    // -----------------------------------------------------
    // TEST CLEANUP
    // -----------------------------------------------------

    test.afterAll(async () => {
      console.log(
        "[E2E-03] Cleaning up test fixtures",
      );

      await cleanupPickupFixtures();

      console.log(
        "[E2E-03] Test fixtures removed",
      );
    });

    // -----------------------------------------------------
    // LOGIN BEFORE EACH TEST
    // -----------------------------------------------------

    test.beforeEach(async ({ page }) => {
      await loginResident(page);
    });

    // =====================================================
    // TC-E2E-PICKUP-01
    // Resident without an address
    // =====================================================

    test(
      "TC-E2E-PICKUP-01: prompts resident to add an address",
      async ({ page }) => {
        await openPickupForm(page);

        console.log(
          "[E2E-03] Checking no-address state",
        );

        await expect(
          page.getByText("No saved address"),
        ).toBeVisible({
          timeout: 30_000,
        });

        await expect(
          page.getByRole("button", {
            name: "Add address",
          }),
        ).toBeVisible();

        await expect(
          page.getByRole("button", {
            name: "Submit pickup request",
          }),
        ).toBeDisabled();

        console.log(
          "[E2E-03] TC-E2E-PICKUP-01 completed",
        );
      },
    );

    // =====================================================
    // TC-E2E-PICKUP-02
    // Create a pickup address through the UI
    // =====================================================

    test(
      "TC-E2E-PICKUP-02: creates a pickup address through the UI",
      async ({ page }) => {
        console.log(
          "[E2E-03] Opening resident addresses page",
        );

        await page.goto("/user/addresses", {
          waitUntil: "domcontentloaded",
          timeout: 60_000,
        });

        await expect(
          page.getByText("Loading your account..."),
        ).toBeHidden({
          timeout: 60_000,
        });

        await expect(
          page.getByRole("heading", {
            name: "My Addresses",
          }),
        ).toBeVisible({
          timeout: 60_000,
        });

        console.log(
          "[E2E-03] Opening Add Address modal",
        );

        await page.getByRole("button", {
          name: "Add Your First Address",
        }).click();

        const dialog = page.getByRole("dialog");

        await expect(
          dialog.getByText("Add New Address"),
        ).toBeVisible();

        await dialog
          .getByLabel("Street Address")
          .fill(pickupFixture.street);

        await dialog
          .getByLabel("City")
          .fill(pickupFixture.city);

        await dialog
          .getByLabel("State")
          .fill(pickupFixture.state);

        await dialog
          .getByLabel("Postal Code (optional)")
          .fill(pickupFixture.postalCode);

        await dialog
          .getByLabel("Country")
          .fill(pickupFixture.country);

        console.log(
          "[E2E-03] Submitting new address",
        );

        await dialog.getByRole("button", {
          name: "Add Address",
        }).click();

        await expect(dialog).toBeHidden({
          timeout: 30_000,
        });

        await expect(
            page.getByRole("heading", {
                name: pickupFixture.street,
                exact: true,
            }),
            ).toBeVisible({
            timeout: 30_000,
        });

        // Verify persistence in PostgreSQL.
        const address = await prisma.address.findFirst({
          where: {
            userId: pickupResidentId,
            street: pickupFixture.street,
          },
        });

        expect(address).not.toBeNull();

        expect(address?.city).toBe(
          pickupFixture.city,
        );

        expect(address?.state).toBe(
          pickupFixture.state,
        );

        console.log(
          "[E2E-03] TC-E2E-PICKUP-02 completed",
        );
      },
    );

    // =====================================================
    // TC-E2E-PICKUP-03
    // Reject invalid pickup quantity
    // =====================================================

    test(
      "TC-E2E-PICKUP-03: rejects an invalid quantity",
      async ({ page }) => {
        await openPickupForm(page);

        await page
          .locator("#wasteTypeId")
          .selectOption({
            label: pickupFixture.wasteTypeName,
          });

        await page.locator("#quantity").fill("0");

        await page
          .locator("#pickupDate")
          .fill(futurePickupDate());

        await page
          .locator("#pickupTime")
          .fill("10:00");

        console.log(
          "[E2E-03] Submitting invalid quantity",
        );

        // Dispatch the submit event to exercise React
        // validation without native HTML min constraints
        // blocking the event first.
        await page.locator("form").evaluate((form) => {
          form.dispatchEvent(
            new Event("submit", {
              bubbles: true,
              cancelable: true,
            }),
          );
        });

        await expect(
          page.getByText(
            "Enter a positive whole number",
          ),
        ).toBeVisible({
          timeout: 30_000,
        });

        await expect(page).toHaveURL(
          /\/user\/myrequests\/newrequests/,
        );

        console.log(
          "[E2E-03] TC-E2E-PICKUP-03 completed",
        );
      },
    );

    // =====================================================
    // TC-E2E-PICKUP-04
    // Reject a past pickup date
    // =====================================================

    test(
      "TC-E2E-PICKUP-04: rejects a past pickup date",
      async ({ page }) => {
        await openPickupForm(page);

        await page
          .locator("#wasteTypeId")
          .selectOption({
            label: pickupFixture.wasteTypeName,
          });

        await page.locator("#quantity").fill("2");

        await page
          .locator("#pickupDate")
          .fill(pastPickupDate());

        await page
          .locator("#pickupTime")
          .fill("10:00");

        console.log(
          "[E2E-03] Submitting past pickup date",
        );

        await page.locator("form").evaluate((form) => {
          form.dispatchEvent(
            new Event("submit", {
              bubbles: true,
              cancelable: true,
            }),
          );
        });

        await expect(
          page.getByText(
            "Pickup date and time must be in the future",
          ),
        ).toBeVisible({
          timeout: 30_000,
        });

        await expect(page).toHaveURL(
          /\/user\/myrequests\/newrequests/,
        );

        console.log(
          "[E2E-03] TC-E2E-PICKUP-04 completed",
        );
      },
    );

    // =====================================================
    // TC-E2E-PICKUP-05
    // Submit a valid pickup request
    // =====================================================

    test(
      "TC-E2E-PICKUP-05: submits a valid pickup request",
      async ({ page }) => {
        await openPickupForm(page);

        console.log(
          "[E2E-03] Filling valid pickup request",
        );

        await page
          .locator("#wasteTypeId")
          .selectOption({
            label: pickupFixture.wasteTypeName,
          });

        await page.locator("#quantity").fill("3");

        await page
          .locator("#quantityUnit")
          .selectOption("BAG");

        await page.locator("#description").fill(
          "Automated E2E household waste collection",
        );

        await page
          .locator("#pickupDate")
          .fill(futurePickupDate());

        await page
          .locator("#pickupTime")
          .fill("10:00");

        await expect(
          page.locator(
            'input[name="addressId"]:checked',
          ),
        ).toHaveCount(1);

        console.log(
          "[E2E-03] Submitting pickup request",
        );

        await page.getByRole("button", {
          name: "Submit pickup request",
        }).click();

        await expect(
          page.getByRole("heading", {
            name: "Pickup request submitted",
          }),
        ).toBeVisible({
          timeout: 30_000,
        });

        console.log(
          "[E2E-03] Request success confirmation visible",
        );

        // Verify the request was persisted in PostgreSQL.
        const request =
          await prisma.wasteRequest.findFirst({
            where: {
              userId: pickupResidentId,
              description:
                "Automated E2E household waste collection",
            },
            include: {
              wasteType: true,
              address: true,
            },
          });

        expect(request).not.toBeNull();

        if (!request) {
          throw new Error(
            "Pickup request was not persisted in the database",
          );
        }

        expect(request.status).toBe("PENDING");
        expect(request.quantity).toBe(3);
        expect(request.quantityUnit).toBe("BAG");

        expect(request.wasteType.name).toBe(
          pickupFixture.wasteTypeName,
        );

        expect(request.address.street).toBe(
          pickupFixture.street,
        );

        submittedReference = request.reference;

        console.log(
          "[E2E-03] Created request reference:",
          submittedReference,
        );

        await expect(
          page.getByText(submittedReference),
        ).toBeVisible({
          timeout: 30_000,
        });

        console.log(
          "[E2E-03] TC-E2E-PICKUP-05 completed",
        );
      },
    );

    // =====================================================
    // TC-E2E-PICKUP-06
    // Verify request appears under Waiting
    // =====================================================

    test(
      "TC-E2E-PICKUP-06: displays submitted request under Waiting",
      async ({ page }) => {
        expect(submittedReference).not.toBe("");

        console.log(
          "[E2E-03] Opening My Collections",
        );

        await page.goto("/user/myrequests", {
          waitUntil: "domcontentloaded",
          timeout: 60_000,
        });

        await expect(
          page.getByText("Loading your account..."),
        ).toBeHidden({
          timeout: 60_000,
        });

        await expect(
          page.getByRole("heading", {
            name: "My Collections",
          }),
        ).toBeVisible({
          timeout: 60_000,
        });

        console.log(
          "[E2E-03] Selecting Waiting tab",
        );

        await page.getByRole("button", {
          name: /Waiting/,
        }).click();

        await page
          .getByPlaceholder("Search your requests")
          .fill(submittedReference);

        const requestCard = page
          .locator("article")
          .filter({
            hasText: submittedReference,
          });

        await expect(requestCard).toBeVisible({
          timeout: 30_000,
        });

        await expect(requestCard).toContainText(
          pickupFixture.wasteTypeName,
        );

        await expect(requestCard).toContainText(
          "Pending review",
        );

        console.log(
          "[E2E-03] TC-E2E-PICKUP-06 completed",
        );
      },
    );
  },
);


import { test, expect, type Page } from "@playwright/test";
import prisma from "../../lib/prisma";

import {
  adminRequestFixture,
  adminRequestIds,
  createAdminRequestFixtures,
  cleanupAdminRequestFixtures,
} from "./helpers/admin-requests-fixtures";

// ============================================================
// HELPER: ADMIN LOGIN
// ============================================================

async function loginAdmin(page: Page) {
  console.log("[E2E-04] Opening admin login");

  await page.goto("/onboarding/login", {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });

  await page
    .getByPlaceholder("Email")
    .fill(adminRequestFixture.adminEmail);

  await page
    .getByPlaceholder("Password")
    .fill(adminRequestFixture.adminPassword);

  await page
    .getByRole("button", {
      name: "Login",
      exact: true,
    })
    .click();

  await expect(page).toHaveURL(/\/admin\/?$/, {
    timeout: 60_000,
  });

  await expect(
    page.getByText("Loading your account..."),
  ).toBeHidden({
    timeout: 60_000,
  });

  console.log("[E2E-04] Admin authenticated");
}

// ============================================================
// HELPER: OPEN REQUEST MANAGEMENT
// ============================================================

async function openRequestManagement(page: Page) {
  await page.goto("/admin/request-management", {
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
      name: "Request Management",
    }),
  ).toBeVisible({
    timeout: 60_000,
  });

  await expect(
    page.getByText("Loading pickup requests..."),
  ).toBeHidden({
    timeout: 60_000,
  });
}

// ============================================================
// HELPER: OPEN REQUEST DETAILS
// ============================================================

async function openRequestDetails(page: Page) {
  await page.goto(
    `/admin/request-management/${adminRequestIds.requestId}`,
    {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    },
  );

  await expect(
    page.getByText("Loading your account..."),
  ).toBeHidden({
    timeout: 60_000,
  });

  await expect(
    page.getByRole("heading", {
      name: adminRequestFixture.reference,
      exact: true,
    }),
  ).toBeVisible({
    timeout: 60_000,
  });
}

// ============================================================
// E2E-04: ADMIN PICKUP REQUEST MANAGEMENT
// ============================================================

test.describe.serial(
  "E2E-04: Admin Pickup Request Management",
  () => {
    test.setTimeout(180_000);

    // --------------------------------------------------------
    // SETUP: CREATE ISOLATED TEST DATA
    // --------------------------------------------------------

    test.beforeAll(async () => {
      console.log("[E2E-04] Creating test fixtures");

      await createAdminRequestFixtures();
    });

    // --------------------------------------------------------
    // CLEANUP: REMOVE TEST DATA
    // --------------------------------------------------------

    test.afterAll(async () => {
      console.log("[E2E-04] Cleaning test fixtures");

      await cleanupAdminRequestFixtures();
    });

    // --------------------------------------------------------
    // LOGIN BEFORE EACH TEST
    // --------------------------------------------------------

    test.beforeEach(async ({ page }) => {
      await loginAdmin(page);
    });

    // ========================================================
    // TC-E2E-ADMIN-01: ADMIN LOGIN
    // ========================================================

    test(
      "TC-E2E-ADMIN-01: administrator logs in successfully",
      async ({ page }) => {
        await expect(page).toHaveURL(/\/admin\/?$/);

        console.log(
          "[E2E-04] TC-E2E-ADMIN-01 completed",
        );
      },
    );

    // ========================================================
    // TC-E2E-ADMIN-02: REQUEST MANAGEMENT PAGE
    // ========================================================

    test(
      "TC-E2E-ADMIN-02: displays request management",
      async ({ page }) => {
        await openRequestManagement(page);

        await expect(
          page.getByText("Total Requests", {
            exact: true,
          }),
        ).toBeVisible();

        await expect(
          page.getByText("Pending Review", {
            exact: true,
          }),
        ).toBeVisible();

        await expect(
          page.getByText("Awaiting Assignment", {
            exact: true,
          }),
        ).toBeVisible();

        await expect(
          page.getByText("Active Collections", {
            exact: true,
          }),
        ).toBeVisible();

        console.log(
          "[E2E-04] TC-E2E-ADMIN-02 completed",
        );
      },
    );

    // ========================================================
    // TC-E2E-ADMIN-03: SEARCH PENDING REQUEST
    // ========================================================

    test(
      "TC-E2E-ADMIN-03: finds a pending resident request",
      async ({ page }) => {
        await openRequestManagement(page);

        await page
          .getByPlaceholder(
            "Search reference, resident, waste type, location...",
          )
          .fill(adminRequestFixture.reference);

        const requestRow = page
          .locator("table tbody tr")
          .filter({
            hasText: adminRequestFixture.reference,
          });

        await expect(requestRow).toBeVisible({
          timeout: 60_000,
        });

        await expect(requestRow).toContainText(
          adminRequestFixture.residentName,
        );

        await expect(requestRow).toContainText(
          adminRequestFixture.wasteTypeName,
        );

        await expect(requestRow).toContainText("Pending");

        console.log(
          "[E2E-04] TC-E2E-ADMIN-03 completed",
        );
      },
    );

    // ========================================================
    // TC-E2E-ADMIN-04: VIEW REQUEST DETAILS
    // ========================================================

    test(
      "TC-E2E-ADMIN-04: views resident request details",
      async ({ page }) => {
        await openRequestManagement(page);

        await page
          .getByPlaceholder(
            "Search reference, resident, waste type, location...",
          )
          .fill(adminRequestFixture.reference);

        const requestRow = page
          .locator("table tbody tr")
          .filter({
            hasText: adminRequestFixture.reference,
          });

        await expect(requestRow).toBeVisible({
          timeout: 60_000,
        });

        await requestRow
          .getByRole("button", {
            name: "View",
          })
          .click();

        await expect(page).toHaveURL(
          new RegExp(
            `/admin/request-management/${adminRequestIds.requestId}$`,
          ),
          {
            timeout: 60_000,
          },
        );

        await expect(
          page.getByRole("heading", {
            name: adminRequestFixture.reference,
            exact: true,
          }),
        ).toBeVisible({
          timeout: 60_000,
        });

        await expect(
          page.getByText(adminRequestFixture.residentEmail),
        ).toBeVisible();

        await expect(
          page.getByText(adminRequestFixture.wasteTypeName, {
            exact: true,
          }),
        ).toBeVisible();

        await expect(
          page.getByText(adminRequestFixture.street, {
            exact: false,
          }),
        ).toBeVisible();

        await expect(
          page.getByRole("button", {
            name: "Approve Request",
          }),
        ).toBeVisible();

        console.log(
          "[E2E-04] TC-E2E-ADMIN-04 completed",
        );
      },
    );

    // ========================================================
    // TC-E2E-ADMIN-05: APPROVE PENDING REQUEST
    // ========================================================

    test(
      "TC-E2E-ADMIN-05: approves a pending pickup request",
      async ({ page }) => {
        test.setTimeout(240_000);

        await openRequestDetails(page);

        console.log(
          "[E2E-04] Clicking Approve Request",
        );

    
        const approvalResponsePromise = page.waitForResponse(
          (response) =>
            response.url().includes(
              `/api/admin/get-requests/${adminRequestIds.requestId}/approve`,
            ) &&
            response.request().method() === "PATCH",
          {
            timeout: 90_000,
          },
        );

        await page
          .getByRole("button", {
            name: "Approve Request",
            exact: true,
          })
          .click();

        console.log(
          "[E2E-04] Waiting for approval API response",
        );

        let approvalStatus: number | null = null;

        try {
          const approvalResponse =
            await approvalResponsePromise;

          approvalStatus = approvalResponse.status();

          console.log(
            "[E2E-04] Approval HTTP status:",
            approvalStatus,
          );

          console.log(
            "[E2E-04] Approval response:",
            await approvalResponse.text(),
          );
        } catch (error) {
          console.error(
            "[E2E-04] Approval API response not received within 90 seconds:",
            error,
          );
        }

      
        const databaseRequest =
          await prisma.wasteRequest.findUnique({
            where: {
              id: adminRequestIds.requestId,
            },
            include: {
              activities: true,
            },
          });

        console.log(
          "[E2E-04] Database request status:",
          databaseRequest?.status,
        );

        console.log(
          "[E2E-04] Database approvedAt:",
          databaseRequest?.approvedAt,
        );

        console.log(
          "[E2E-04] Database activity types:",
          databaseRequest?.activities.map(
            (activity) => activity.type,
          ),
        );

        // Verify the approval API was successful.
        expect(
          approvalStatus,
          "Approval endpoint must return HTTP 200",
        ).toBe(200);

        // Verify the UI changes from Pending to Approved.
        await expect(
          page.getByText("Request approved", {
            exact: true,
          }),
        ).toBeVisible({
          timeout: 60_000,
        });

        await expect(
          page.getByRole("button", {
            name: "Assign Collector",
            exact: true,
          }),
        ).toBeVisible({
          timeout: 60_000,
        });

        // Verify the database status.
        expect(databaseRequest).not.toBeNull();

        expect(databaseRequest?.status).toBe(
          "APPROVED",
        );

        expect(databaseRequest?.approvedAt).not.toBeNull();

        // Verify the approval activity was recorded.
        expect(
          databaseRequest?.activities.some(
            (activity) =>
              activity.type === "REQUEST_APPROVED" &&
              activity.status === "APPROVED",
          ),
        ).toBe(true);

        console.log(
          "[E2E-04] TC-E2E-ADMIN-05 completed",
        );
      },
    );

    // ========================================================
    // TC-E2E-ADMIN-06: ASSIGN ACTIVE COLLECTOR
    // ========================================================

    test(
      "TC-E2E-ADMIN-06: assigns an active collector",
      async ({ page }) => {
        test.setTimeout(240_000);

        await openRequestDetails(page);

        // An approved request should allow collector assignment.
        await expect(
          page.getByRole("button", {
            name: "Assign Collector",
            exact: true,
          }),
        ).toBeVisible({
          timeout: 60_000,
        });

        await page
          .getByRole("button", {
            name: "Assign Collector",
            exact: true,
          })
          .click();

        await expect(
          page.getByRole("heading", {
            name: "Assign collector",
          }),
        ).toBeVisible({
          timeout: 60_000,
        });

        await page
          .getByPlaceholder(
            "Search collector, email, zone or vehicle...",
          )
          .fill(adminRequestFixture.collectorEmail);

        const collectorOption = page
          .getByRole("button")
          .filter({
            hasText: adminRequestFixture.collectorEmail,
          });

        await expect(collectorOption).toBeVisible({
          timeout: 60_000,
        });

        await collectorOption.click();

        // Listen for the assignment API response.
        const assignmentResponsePromise =
          page.waitForResponse(
            (response) =>
              response.url().includes(
                `/api/admin/get-requests/${adminRequestIds.requestId}/assign`,
              ) &&
              response.request().method() === "PATCH",
            {
              timeout: 90_000,
            },
          );

        // The modal contains the final confirmation button.
        await page
          .getByRole("button", {
            name: "Assign Collector",
            exact: true,
          })
          .last()
          .click();

        const assignmentResponse =
          await assignmentResponsePromise;

        console.log(
          "[E2E-04] Assignment HTTP status:",
          assignmentResponse.status(),
        );

        console.log(
          "[E2E-04] Assignment response:",
          await assignmentResponse.text(),
        );

        expect(
          assignmentResponse.status(),
          "Assignment endpoint must return HTTP 200",
        ).toBe(200);

        // Verify the interface reflects the assignment.
        await expect(
          page
            .getByText("Collector assigned", {
              exact: true,
            })
            .first(),
        ).toBeVisible({
          timeout: 60_000,
        });

        // Verify persisted database changes.
        const request =
          await prisma.wasteRequest.findUnique({
            where: {
              id: adminRequestIds.requestId,
            },
            include: {
              activities: true,
              collector: true,
            },
          });

        expect(request).not.toBeNull();

        expect(request?.status).toBe("ASSIGNED");

        expect(request?.collectorId).toBe(
          adminRequestIds.collectorId,
        );

        expect(request?.assignedAt).not.toBeNull();

        expect(
          request?.activities.some(
            (activity) =>
              activity.type === "COLLECTOR_ASSIGNED" &&
              activity.status === "ASSIGNED",
          ),
        ).toBe(true);

        expect(request?.collector?.email).toBe(
          adminRequestFixture.collectorEmail,
        );

        console.log(
          "[E2E-04] TC-E2E-ADMIN-06 completed",
        );
      },
    );
  },
);

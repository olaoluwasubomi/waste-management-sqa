
import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { NextRequest } from "next/server";
import type { PrismaClient } from "@prisma/client";
import { assertTestDatabase } from "./test-database";

const mocks = vi.hoisted(() => ({
  verifyAuth: vi.fn(),
}));

vi.mock("@/lib/verifyAuth", () => ({
  verifyAuth: mocks.verifyAuth,
}));

describe("Resident waste request cancellation PostgreSQL integration", () => {
  let prisma: PrismaClient;
  let PATCH: typeof import("@/app/api/user/requests/[id]/cancel/route").PATCH;

  let residentId: string | undefined;
  let wasteTypeId: string | undefined;
  let addressId: string | undefined;
  let wasteRequestId: string | undefined;
  let approvedRequestId: string | undefined;
  let otherResidentId: string | undefined;
  let protectedRequestId: string | undefined;
  let rollbackRequestId: string | undefined;

  beforeAll(async () => {
    assertTestDatabase();

    const prismaModule = await import("@/lib/prisma");
    prisma = prismaModule.default;

    const routeModule = await import(
      "@/app/api/user/requests/[id]/cancel/route"
    );
    PATCH = routeModule.PATCH;

    await prisma.$connect();

    const unique = crypto.randomUUID();

    // Create an isolated test Resident.
    const resident = await prisma.user.create({
      data: {
        firstName: "Cancellation",
        lastName: "Test Resident",
        email: `cancel-integration-${unique}@example.test`,
        password: "integration-test-only-not-a-real-password",
        role: "USER",
      },
    });

    residentId = resident.id;

    // Create a waste type for the test request.
    const wasteType = await prisma.wasteType.create({
      data: {
        name: `Cancellation Test Waste ${unique}`,
        status: "ACTIVE",
        price: 1000,
      },
    });

    wasteTypeId = wasteType.id;

    // Create the Resident's collection address.
    const address = await prisma.address.create({
      data: {
        userId: residentId,
        label: "Cancellation Test Home",
        street: "10 Cancellation Test Street",
        city: "Coventry",
        state: "West Midlands",
        country: "United Kingdom",
      },
    });

    addressId = address.id;

    // Create a real PENDING request in PostgreSQL.
    const wasteRequest = await prisma.wasteRequest.create({
      data: {
        reference: `SQA-CANCEL-${unique}`,
        description: "Cancellation integration test request",
        status: "PENDING",
        quantity: 1,
        quantityUnit: "BAG",
        requestedPickupDate: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000,
        ),
        userId: residentId,
        wasteTypeId,
        addressId,
        pickupStreet: "10 Cancellation Test Street",
        pickupCity: "Coventry",
        pickupState: "West Midlands",
        pickupCountry: "United Kingdom",
      },
    });

    wasteRequestId = wasteRequest.id;


    // Create an APPROVED request for the second integration test.
    const approvedRequest = await prisma.wasteRequest.create({
      data: {
        reference: `SQA-CANCEL-APPROVED-${unique}`,
        description: "Approved cancellation integration test",
        status: "APPROVED",
        approvedAt: new Date(),
        quantity: 1,
        quantityUnit: "BAG",
        requestedPickupDate: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000,
        ),
        userId: residentId,
        wasteTypeId,
        addressId,
        pickupStreet: "10 Cancellation Test Street",
        pickupCity: "Coventry",
        pickupState: "West Midlands",
        pickupCountry: "United Kingdom",
      },
    });

    approvedRequestId = approvedRequest.id;


    // Create a second Resident to test request ownership protection.
    const otherResident = await prisma.user.create({
      data: {
        firstName: "Other",
        lastName: "Cancellation Resident",
        email: `other-cancel-resident-${unique}@example.test`,
        password: "integration-test-only-not-a-real-password",
        role: "USER",
      },
    });

    otherResidentId = otherResident.id;

    // This request belongs to the first Resident, not the second.
    const protectedRequest = await prisma.wasteRequest.create({
      data: {
        reference: `SQA-CANCEL-PROTECTED-${unique}`,
        description: "Request protected by ownership checks",
        status: "PENDING",
        requestedPickupDate: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000,
        ),
        userId: residentId,
        wasteTypeId,
        addressId,
        pickupStreet: "10 Cancellation Test Street",
        pickupCity: "Coventry",
        pickupState: "West Midlands",
        pickupCountry: "United Kingdom",
      },
    });

    protectedRequestId = protectedRequest.id;


    // Create a separate request for transaction rollback testing.
    const rollbackRequest = await prisma.wasteRequest.create({
      data: {
        reference: `SQA-CANCEL-ROLLBACK-${unique}`,
        description: "Cancellation transaction rollback test",
        status: "PENDING",
        requestedPickupDate: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000,
        ),
        userId: residentId,
        wasteTypeId,
        addressId,
        pickupStreet: "10 Cancellation Test Street",
        pickupCity: "Coventry",
        pickupState: "West Midlands",
        pickupCountry: "United Kingdom",
      },
    });

    rollbackRequestId = rollbackRequest.id;




    // Simulate the authenticated Resident.
    mocks.verifyAuth.mockResolvedValue({
      id: residentId,
      email: resident.email,
      role: "USER",
    });
  });

  afterAll(async () => {
    if (!prisma) return;

    try {
      // Delete only records created by this test suite.
      if (wasteRequestId) {
        await prisma.wasteRequestActivity.deleteMany({
          where: {
            wasteRequestId,
          },
        });

        await prisma.wasteRequest.deleteMany({
          where: {
            id: wasteRequestId,
          },
        });
      }


      // Clean up the APPROVED request and its activities.
      if (approvedRequestId) {
        await prisma.wasteRequestActivity.deleteMany({
          where: {
            wasteRequestId: approvedRequestId,
          },
        });

        await prisma.wasteRequest.deleteMany({
          where: {
            id: approvedRequestId,
          },
        });
      }


      // Remove the protected request and its activities.
      if (protectedRequestId) {
        await prisma.wasteRequestActivity.deleteMany({
          where: { wasteRequestId: protectedRequestId },
        });

        await prisma.wasteRequest.deleteMany({
          where: { id: protectedRequestId },
        });
      }

      // Remove the second Resident.
      if (otherResidentId) {
        await prisma.user.deleteMany({
          where: { id: otherResidentId },
        });
      }


      if (rollbackRequestId) {
        await prisma.wasteRequestActivity.deleteMany({
          where: { wasteRequestId: rollbackRequestId },
        });

        await prisma.wasteRequest.deleteMany({
          where: { id: rollbackRequestId },
        });
      }


      if (addressId) {
        await prisma.address.deleteMany({
          where: {
            id: addressId,
          },
        });
      }

      if (wasteTypeId) {
        await prisma.wasteType.deleteMany({
          where: {
            id: wasteTypeId,
          },
        });
      }

      if (residentId) {
        await prisma.user.deleteMany({
          where: {
            id: residentId,
          },
        });
      }
    } finally {
      await prisma.$disconnect();
    }
  });

  it("TC-INT-CANCEL-01: persists cancellation of a PENDING request", async () => {
    expect(wasteRequestId).toBeDefined();

    // Verify the initial status in the real database.
    const beforeCancellation =
      await prisma.wasteRequest.findUnique({
        where: {
          id: wasteRequestId!,
        },
      });

    expect(beforeCancellation).not.toBeNull();
    expect(beforeCancellation?.status).toBe("PENDING");
    expect(beforeCancellation?.canceledAt).toBeNull();

    const request = new NextRequest(
      `http://localhost:3000/api/user/requests/${wasteRequestId}/cancel`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reason: "Collection no longer required",
        }),
      },
    );

    const context = {
      params: Promise.resolve({
        id: wasteRequestId!,
      }),
    };

    // Execute the real API handler against PostgreSQL.
    const response = await PATCH(request, context);
    const result = await response.json();

    // Verify the API response.
    expect(response.status).toBe(200);
    expect(result.success).toBe(true);
    expect(result.request.status).toBe("CANCELED");

    // Query PostgreSQL again to verify persistence.
    const savedRequest =
      await prisma.wasteRequest.findUnique({
        where: {
          id: wasteRequestId!,
        },
      });

    expect(savedRequest).not.toBeNull();
    expect(savedRequest?.userId).toBe(residentId);
    expect(savedRequest?.status).toBe("CANCELED");
    expect(savedRequest?.cancellationReason).toBe(
      "Collection no longer required",
    );
    expect(savedRequest?.canceledAt).toBeInstanceOf(Date);
  });


it("TC-INT-CANCEL-02: persists cancellation of an APPROVED request", async () => {
  expect(approvedRequestId).toBeDefined();

  // Verify the initial state in PostgreSQL.
  const beforeCancellation =
    await prisma.wasteRequest.findUnique({
      where: {
        id: approvedRequestId!,
      },
    });

  expect(beforeCancellation).not.toBeNull();
  expect(beforeCancellation?.status).toBe("APPROVED");
  expect(beforeCancellation?.canceledAt).toBeNull();

  // Create the cancellation request.
  const request = new NextRequest(
    `http://localhost:3000/api/user/requests/${approvedRequestId}/cancel`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reason: "My collection plans have changed",
      }),
    },
  );

  const context = {
    params: Promise.resolve({
      id: approvedRequestId!,
    }),
  };

  // Execute the real API handler.
  const response = await PATCH(request, context);
  const result = await response.json();

  // Verify the API response.
  expect(response.status).toBe(200);
  expect(result.success).toBe(true);
  expect(result.request.status).toBe("CANCELED");

  // Query PostgreSQL to verify the persisted changes.
  const savedRequest =
    await prisma.wasteRequest.findUnique({
      where: {
        id: approvedRequestId!,
      },
    });

  expect(savedRequest).not.toBeNull();
  expect(savedRequest?.userId).toBe(residentId);
  expect(savedRequest?.status).toBe("CANCELED");
  expect(savedRequest?.cancellationReason).toBe(
    "My collection plans have changed",
  );
  expect(savedRequest?.canceledAt).toBeInstanceOf(Date);
});


it("TC-INT-CANCEL-03: persists a cancellation activity in PostgreSQL", async () => {
  expect(wasteRequestId).toBeDefined();

  // Retrieve the cancellation activity created by TC-INT-CANCEL-01.
  const activities = await prisma.wasteRequestActivity.findMany({
    where: {
      wasteRequestId: wasteRequestId!,
      type: "REQUEST_CANCELED",
    },
  });

  // Verify that exactly one cancellation activity exists.
  expect(activities).toHaveLength(1);

  const activity = activities[0];

  // Verify the activity is linked to the correct request.
  expect(activity.wasteRequestId).toBe(wasteRequestId);

  // Verify the authenticated Resident is recorded as the creator.
  expect(activity.createdById).toBe(residentId);

  // Verify the activity type and status.
  expect(activity.type).toBe("REQUEST_CANCELED");
  expect(activity.status).toBe("CANCELED");

  // Verify the activity title.
  expect(activity.title).toBe("Pickup request cancelled");

  // Verify that the cancellation reason appears in the description.
  expect(activity.description).toBe(
    "Cancellation reason: Collection no longer required",
  );

  // Verify the request itself remains cancelled.
  const savedRequest = await prisma.wasteRequest.findUnique({
    where: {
      id: wasteRequestId!,
    },
  });

  expect(savedRequest?.status).toBe("CANCELED");
});



it("TC-INT-CANCEL-04: prevents cancellation of another Resident's request", async () => {
  expect(protectedRequestId).toBeDefined();
  expect(otherResidentId).toBeDefined();

  // Authenticate as Resident B.
  mocks.verifyAuth.mockResolvedValueOnce({
    id: otherResidentId,
    email: "other-resident@example.test",
    role: "USER",
  });

  // Resident B attempts to cancel Resident A's request.
  const request = new NextRequest(
    `http://localhost:3000/api/user/requests/${protectedRequestId}/cancel`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reason: "Attempted cancellation by another Resident",
      }),
    },
  );

  const response = await PATCH(request, {
    params: Promise.resolve({
      id: protectedRequestId!,
    }),
  });

  const result = await response.json();

  // The endpoint must reject the request.
  expect(response.status).toBe(404);
  expect(result.success).toBe(false);
  expect(result.error).toBe("Pickup request not found");

  // Confirm the original request remains unchanged.
  const savedRequest = await prisma.wasteRequest.findUnique({
    where: {
      id: protectedRequestId!,
    },
  });

  expect(savedRequest).not.toBeNull();
  expect(savedRequest?.userId).toBe(residentId);
  expect(savedRequest?.status).toBe("PENDING");
  expect(savedRequest?.canceledAt).toBeNull();
  expect(savedRequest?.cancellationReason).toBeNull();

  // No cancellation activity should have been created.
  const cancellationActivities =
    await prisma.wasteRequestActivity.count({
      where: {
        wasteRequestId: protectedRequestId!,
        type: "REQUEST_CANCELED",
      },
    });

  expect(cancellationActivities).toBe(0);
});




it("TC-INT-CANCEL-05: rolls back cancellation when activity creation fails", async () => {
  expect(rollbackRequestId).toBeDefined();

  const targetId = rollbackRequestId!;

  const beforeCancellation = await prisma.wasteRequest.findUnique({
    where: { id: targetId },
  });

  expect(beforeCancellation?.status).toBe("PENDING");
  expect(beforeCancellation?.canceledAt).toBeNull();
  expect(beforeCancellation?.cancellationReason).toBeNull();

  const triggerSuffix = crypto.randomUUID().replace(/-/g, "");
  const functionName = `sqa_cancel_fail_${triggerSuffix}`;
  const triggerName = `sqa_cancel_trigger_${triggerSuffix}`;

  try {
    await prisma.$executeRawUnsafe(`
      CREATE FUNCTION "${functionName}"()
      RETURNS trigger
      LANGUAGE plpgsql
      AS $$
      BEGIN
        IF NEW."wasteRequestId" = '${targetId}'
           AND NEW."type" = 'REQUEST_CANCELED' THEN
          RAISE EXCEPTION 'Simulated cancellation activity failure';
        END IF;

        RETURN NEW;
      END;
      $$;
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TRIGGER "${triggerName}"
      BEFORE INSERT ON "WasteRequestActivity"
      FOR EACH ROW
      EXECUTE FUNCTION "${functionName}"();
    `);

    const request = new NextRequest(
      `http://localhost:3000/api/user/requests/${targetId}/cancel`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reason: "Testing transaction rollback",
        }),
      },
    );

    const response = await PATCH(request, {
      params: Promise.resolve({ id: targetId }),
    });

    const result = await response.json();

    // The database failure should produce HTTP 500.
    expect(response.status).toBe(500);
    expect(result.success).toBe(false);
    expect(result.error).toBe("Unable to cancel the pickup request");

    // Verify the transaction did not persist the status update.
    const savedRequest = await prisma.wasteRequest.findUnique({
      where: { id: targetId },
    });

    expect(savedRequest?.status).toBe("PENDING");
    expect(savedRequest?.canceledAt).toBeNull();
    expect(savedRequest?.cancellationReason).toBeNull();

    // Verify no cancellation activity was persisted.
    const activityCount = await prisma.wasteRequestActivity.count({
      where: {
        wasteRequestId: targetId,
        type: "REQUEST_CANCELED",
      },
    });

    expect(activityCount).toBe(0);
  } finally {
    
    await prisma.$executeRawUnsafe(`
      DROP TRIGGER IF EXISTS "${triggerName}"
      ON "WasteRequestActivity";
    `);

    await prisma.$executeRawUnsafe(`
      DROP FUNCTION IF EXISTS "${functionName}"();
    `);
  }
});



});

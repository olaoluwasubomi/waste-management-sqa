
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

// Mock authentication only. Prisma remains real.
const mocks = vi.hoisted(() => ({
  verifyAuth: vi.fn(),
}));

vi.mock("@/lib/verifyAuth", () => ({
  verifyAuth: mocks.verifyAuth,
}));

describe("Resident request details and update PostgreSQL integration", () => {
  let prisma: PrismaClient;
  let GET: typeof import("@/app/api/user/requests/[id]/route").GET;
  let PATCH: typeof import("@/app/api/user/requests/[id]/route").PATCH;

  let residentId: string;
  let otherResidentId: string;
  let wasteTypeId: string;
  let addressId: string;
  let secondAddressId: string;

  const requestIds: string[] = [];

  const futureDate = (days: number) =>
    new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  const context = (id: string) => ({
    params: Promise.resolve({ id }),
  });

  const getRequest = (id: string) =>
    new NextRequest(
      `http://localhost:3000/api/user/requests/${id}`,
    );

  const patchRequest = (id: string, body: unknown) =>
    new NextRequest(
      `http://localhost:3000/api/user/requests/${id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    );

  const authenticateAs = (id: string) => {
    mocks.verifyAuth.mockResolvedValueOnce({
      id,
      role: "USER",
    });
  };

  beforeAll(async () => {
    assertTestDatabase();

    const prismaModule = await import("@/lib/prisma");
    prisma = prismaModule.default;

    const routeModule = await import(
      "@/app/api/user/requests/[id]/route"
    );

    GET = routeModule.GET;
    PATCH = routeModule.PATCH;

    await prisma.$connect();

    const unique = crypto.randomUUID();

    const resident = await prisma.user.create({
      data: {
        firstName: "Request",
        lastName: "Details Resident",
        email: `details-${unique}@example.test`,
        password: "integration-test-only-not-a-real-password",
        role: "USER",
      },
    });
    residentId = resident.id;

    const otherResident = await prisma.user.create({
      data: {
        firstName: "Other",
        lastName: "Details Resident",
        email: `other-details-${unique}@example.test`,
        password: "integration-test-only-not-a-real-password",
        role: "USER",
      },
    });
    otherResidentId = otherResident.id;

    const wasteType = await prisma.wasteType.create({
      data: {
        name: `Details Test Waste ${unique}`,
        status: "ACTIVE",
        price: 1000,
      },
    });
    wasteTypeId = wasteType.id;

    const address = await prisma.address.create({
      data: {
        userId: residentId,
        label: "Home",
        street: "10 Test Street",
        city: "Coventry",
        state: "West Midlands",
        postalCode: "CV1 1AA",
        country: "United Kingdom",
      },
    });
    addressId = address.id;

    const secondAddress = await prisma.address.create({
      data: {
        userId: residentId,
        label: "Office",
        street: "50 New Street",
        city: "Birmingham",
        state: "West Midlands",
        postalCode: "B1 1AA",
        country: "United Kingdom",
      },
    });
    secondAddressId = secondAddress.id;

    mocks.verifyAuth.mockResolvedValue({
      id: residentId,
      role: "USER",
    });
  });

  async function createPickupRequest(
    label: string,
    status: "PENDING" | "APPROVED" = "PENDING",
  ) {
    const unique = crypto.randomUUID();

    const created = await prisma.wasteRequest.create({
      data: {
        reference: `SQA-DETAIL-${label}-${unique}`,
        description: "Original household waste",
        status,
        quantity: 2,
        quantityUnit: "BAG",
        requestedPickupDate: futureDate(7),
        userId: residentId,
        wasteTypeId,
        addressId,
        pickupStreet: "10 Test Street",
        pickupCity: "Coventry",
        pickupState: "West Midlands",
        pickupPostalCode: "CV1 1AA",
        pickupCountry: "United Kingdom",
      },
    });

    requestIds.push(created.id);
    return created;
  }

  afterAll(async () => {
    if (!prisma) return;

    try {
      if (requestIds.length > 0) {
        await prisma.wasteRequestActivity.deleteMany({
          where: {
            wasteRequestId: { in: requestIds },
          },
        });

        await prisma.wasteRequest.deleteMany({
          where: {
            id: { in: requestIds },
          },
        });
      }

      if (secondAddressId || addressId) {
        await prisma.address.deleteMany({
          where: {
            id: {
              in: [addressId, secondAddressId].filter(
                (id): id is string => Boolean(id),
              ),
            },
          },
        });
      }

      if (wasteTypeId) {
        await prisma.wasteType.deleteMany({
          where: { id: wasteTypeId },
        });
      }

      const users = [residentId, otherResidentId].filter(
        (id): id is string => Boolean(id),
      );

      if (users.length > 0) {
        await prisma.user.deleteMany({
          where: { id: { in: users } },
        });
      }
    } finally {
      await prisma.$disconnect();
    }
  });

  it("TC-INT-DETAIL-01: retrieves request details from PostgreSQL", async () => {
    const created = await createPickupRequest("GET");

    const response = await GET(
      getRequest(created.id),
      context(created.id),
    );
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.success).toBe(true);
    expect(result.request.id).toBe(created.id);
    expect(result.request.reference).toBe(created.reference);
    expect(result.request.wasteType.name).toContain(
      "Details Test Waste",
    );
    expect(result.request.savedAddress.label).toBe("Home");

    expect(result.request.pickupAddress.formatted).toBe(
      "10 Test Street, Coventry, West Midlands, CV1 1AA, United Kingdom",
    );
  });

  it("TC-INT-DETAIL-02: prevents another Resident from retrieving request details", async () => {
    const created = await createPickupRequest("PROTECTED-GET");

    authenticateAs(otherResidentId);

    const response = await GET(
      getRequest(created.id),
      context(created.id),
    );

    expect(response.status).toBe(404);
    expect((await response.json()).success).toBe(false);
  });

  it("TC-INT-DETAIL-03: handles absent collector and payment relationships", async () => {
    const created = await createPickupRequest("OPTIONAL");

    const response = await GET(
      getRequest(created.id),
      context(created.id),
    );
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.request.collector).toBeNull();
    expect(result.request.payment).toBeNull();
    expect(result.request.activities).toEqual([]);
  });

  it("TC-INT-UPDATE-01: persists updated details and pickup address", async () => {
    const created = await createPickupRequest("UPDATE");

    const response = await PATCH(
      patchRequest(created.id, {
        description: "Updated household waste",
        quantity: 4,
        addressId: secondAddressId,
      }),
      context(created.id),
    );

    expect(response.status).toBe(200);

    const saved = await prisma.wasteRequest.findUnique({
      where: { id: created.id },
    });

    expect(saved?.description).toBe("Updated household waste");
    expect(saved?.quantity).toBe(4);
    expect(saved?.addressId).toBe(secondAddressId);
    expect(saved?.pickupStreet).toBe("50 New Street");
    expect(saved?.pickupCity).toBe("Birmingham");

    const activities = await prisma.wasteRequestActivity.findMany({
      where: { wasteRequestId: created.id },
    });

    expect(activities).toHaveLength(1);
    expect(activities[0].type).toBe("REQUEST_UPDATED");
    expect(activities[0].createdById).toBe(residentId);
  });

  it("TC-INT-UPDATE-02: persists pickup rescheduling activity", async () => {
    const created = await createPickupRequest("RESCHEDULE");
    const newDate = futureDate(14);

    const response = await PATCH(
      patchRequest(created.id, {
        requestedPickupDate: newDate.toISOString(),
      }),
      context(created.id),
    );

    expect(response.status).toBe(200);

    const saved = await prisma.wasteRequest.findUnique({
      where: { id: created.id },
    });

    expect(saved?.requestedPickupDate.toISOString()).toBe(
      newDate.toISOString(),
    );

    const activities = await prisma.wasteRequestActivity.findMany({
      where: { wasteRequestId: created.id },
    });

    expect(activities).toHaveLength(1);
    expect(activities[0].type).toBe("REQUEST_RESCHEDULED");
  });

  it("TC-INT-UPDATE-03: persists both activities when details and date change", async () => {
    const created = await createPickupRequest("BOTH");

    const response = await PATCH(
      patchRequest(created.id, {
        quantity: 5,
        requestedPickupDate: futureDate(20).toISOString(),
      }),
      context(created.id),
    );

    expect(response.status).toBe(200);

    const saved = await prisma.wasteRequest.findUnique({
      where: { id: created.id },
    });

    expect(saved?.quantity).toBe(5);

    const activities = await prisma.wasteRequestActivity.findMany({
      where: { wasteRequestId: created.id },
    });

    expect(activities).toHaveLength(2);
    expect(activities.map((a) => a.type).sort()).toEqual(
      ["REQUEST_RESCHEDULED", "REQUEST_UPDATED"].sort(),
    );
  });

  it("TC-INT-UPDATE-04: prevents editing an APPROVED request", async () => {
    const created = await createPickupRequest(
      "APPROVED",
      "APPROVED",
    );

    const response = await PATCH(
      patchRequest(created.id, { quantity: 10 }),
      context(created.id),
    );

    expect(response.status).toBe(409);

    const saved = await prisma.wasteRequest.findUnique({
      where: { id: created.id },
    });

    expect(saved?.status).toBe("APPROVED");
    expect(saved?.quantity).toBe(2);

    const activityCount = await prisma.wasteRequestActivity.count({
      where: { wasteRequestId: created.id },
    });

    expect(activityCount).toBe(0);
  });

  it("TC-INT-UPDATE-05: prevents editing another Resident's request", async () => {
    const created = await createPickupRequest("PROTECTED-PATCH");

    authenticateAs(otherResidentId);

    const response = await PATCH(
      patchRequest(created.id, { quantity: 10 }),
      context(created.id),
    );

    expect(response.status).toBe(404);

    const saved = await prisma.wasteRequest.findUnique({
      where: { id: created.id },
    });

    expect(saved?.quantity).toBe(2);
    expect(saved?.status).toBe("PENDING");
  });

  it("TC-INT-UPDATE-06: rolls back update when activity creation fails", async () => {
    const created = await createPickupRequest("ROLLBACK");

    const triggerSuffix = crypto.randomUUID().replace(/-/g, "");
    const functionName = `sqa_update_fail_${triggerSuffix}`;
    const triggerName = `sqa_update_trigger_${triggerSuffix}`;

    try {
      await prisma.$executeRawUnsafe(`
        CREATE FUNCTION "${functionName}"()
        RETURNS trigger
        LANGUAGE plpgsql
        AS $$
        BEGIN
          IF NEW."wasteRequestId" = '${created.id}'
             AND NEW."type" = 'REQUEST_UPDATED' THEN
            RAISE EXCEPTION 'Simulated update activity failure';
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

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      try {
        const response = await PATCH(
          patchRequest(created.id, {
            description: "Should not persist",
            quantity: 9,
          }),
          context(created.id),
        );

        const result = await response.json();

        expect(response.status).toBe(500);
        expect(result.success).toBe(false);
        expect(result.error).toBe(
          "Unable to update the pickup request",
        );
      } finally {
        consoleSpy.mockRestore();
      }

      // The transaction must have rolled back the request update.
      const saved = await prisma.wasteRequest.findUnique({
        where: { id: created.id },
      });

      expect(saved?.description).toBe("Original household waste");
      expect(saved?.quantity).toBe(2);
      expect(saved?.status).toBe("PENDING");

      const activityCount = await prisma.wasteRequestActivity.count({
        where: { wasteRequestId: created.id },
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

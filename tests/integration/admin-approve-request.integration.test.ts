
import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { NextRequest } from "next/server";
import type { PrismaClient, WasteRequestStatus } from "@prisma/client";
import { assertTestDatabase } from "./test-database";

const mocks = vi.hoisted(() => ({
  verifyAuth: vi.fn(),
}));

vi.mock("@/lib/verifyAuth", () => ({
  verifyAuth: mocks.verifyAuth,
}));

describe("Admin request approval PostgreSQL integration", () => {
  let prisma: PrismaClient;
  let PATCH: typeof import(
    "@/app/api/admin/get-requests/[id]/approve/route"
  ).PATCH;

  let adminId: string;
  let residentId: string;
  let addressId: string;
  let wasteTypeId: string;

  const requestIds: string[] = [];
  const unique = crypto.randomUUID();

  const context = (id: string) => ({
    params: Promise.resolve({ id }),
  });

  const patchRequest = (id: string) =>
    new NextRequest(
      `http://localhost:3000/api/admin/get-requests/${id}/approve`,
      { method: "PATCH" },
    );

  const createPickupRequest = async (
    label: string,
    status: WasteRequestStatus = "PENDING",
  ) => {
    const created = await prisma.wasteRequest.create({
      data: {
        reference: `SQA-APP-${label}-${unique}`,
        userId: residentId,
        wasteTypeId,
        addressId,
        description: `Admin approval integration ${label}`,
        quantity: 2,
        quantityUnit: "BAG",
        status,
        requestedPickupDate: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000,
        ),
        pickupStreet: "10 Approval Test Street",
        pickupCity: "Coventry",
        pickupState: "West Midlands",
        pickupCountry: "United Kingdom",
      },
    });

    requestIds.push(created.id);
    return created;
  };

  beforeAll(async () => {
    assertTestDatabase();

    const prismaModule = await import("@/lib/prisma");
    prisma = prismaModule.default;

    const routeModule = await import(
      "@/app/api/admin/get-requests/[id]/approve/route"
    );
    PATCH = routeModule.PATCH;

    await prisma.$connect();

    const admin = await prisma.user.create({
      data: {
        firstName: "Approval",
        lastName: "Administrator",
        email: `approval-admin-${unique}@example.test`,
        password: "integration-test-only-not-a-real-password",
        role: "ADMIN",
      },
    });
    adminId = admin.id;

    const resident = await prisma.user.create({
      data: {
        firstName: "Approval",
        lastName: "Resident",
        email: `approval-resident-${unique}@example.test`,
        password: "integration-test-only-not-a-real-password",
        role: "USER",
      },
    });
    residentId = resident.id;

    const wasteType = await prisma.wasteType.create({
      data: {
        name: `Approval Waste ${unique}`,
        status: "ACTIVE",
        price: 1000,
      },
    });
    wasteTypeId = wasteType.id;

    const address = await prisma.address.create({
      data: {
        userId: residentId,
        label: "Approval Test Home",
        street: "10 Approval Test Street",
        city: "Coventry",
        state: "West Midlands",
        country: "United Kingdom",
      },
    });
    addressId = address.id;

    mocks.verifyAuth.mockResolvedValue({
      id: adminId,
      role: "ADMIN",
    });
  });

  afterAll(async () => {
    if (!prisma) return;

    try {
      if (requestIds.length > 0) {
        await prisma.wasteRequestActivity.deleteMany({
          where: {
            wasteRequestId: { in: requestIds },
          },
        });

        await prisma.payment.deleteMany({
          where: {
            wasteRequestId: { in: requestIds },
          },
        });

        await prisma.wasteRequest.deleteMany({
          where: { id: { in: requestIds } },
        });
      }

      if (addressId) {
        await prisma.address.deleteMany({
          where: { id: addressId },
        });
      }

      if (wasteTypeId) {
        await prisma.wasteType.deleteMany({
          where: { id: wasteTypeId },
        });
      }

      const userIds = [adminId, residentId].filter(
        (id): id is string => Boolean(id),
      );

      if (userIds.length > 0) {
        await prisma.user.deleteMany({
          where: { id: { in: userIds } },
        });
      }
    } finally {
      await prisma.$disconnect();
    }
  });

  it("TC-INT-ADM-APP-01: approves a pending request in PostgreSQL", async () => {
    const created = await createPickupRequest("SUCCESS");

    const response = await PATCH(
      patchRequest(created.id),
      context(created.id),
    );
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.success).toBe(true);
    expect(result.request.status).toBe("APPROVED");

    const saved = await prisma.wasteRequest.findUnique({
      where: { id: created.id },
    });

    expect(saved?.status).toBe("APPROVED");
  });

  it("TC-INT-ADM-APP-02: persists the approval timestamp", async () => {
    const created = await createPickupRequest("TIMESTAMP");

    expect(created.approvedAt).toBeNull();

    const beforeApproval = new Date();

    const response = await PATCH(
      patchRequest(created.id),
      context(created.id),
    );

    const afterApproval = new Date();

    expect(response.status).toBe(200);

    const saved = await prisma.wasteRequest.findUnique({
      where: { id: created.id },
    });

    expect(saved?.approvedAt).not.toBeNull();
    expect(saved!.approvedAt!.getTime()).toBeGreaterThanOrEqual(
      beforeApproval.getTime(),
    );
    expect(saved!.approvedAt!.getTime()).toBeLessThanOrEqual(
      afterApproval.getTime(),
    );
  });

  it("TC-INT-ADM-APP-03: creates an approval activity linked to the Admin", async () => {
    const created = await createPickupRequest("ACTIVITY");

    const response = await PATCH(
      patchRequest(created.id),
      context(created.id),
    );

    expect(response.status).toBe(200);

    const activities = await prisma.wasteRequestActivity.findMany({
      where: {
        wasteRequestId: created.id,
        type: "REQUEST_APPROVED",
      },
    });

    expect(activities).toHaveLength(1);
    expect(activities[0].createdById).toBe(adminId);
    expect(activities[0].status).toBe("APPROVED");
    expect(activities[0].title).toBe(
      "Pickup request approved",
    );
  });

  it("TC-INT-ADM-APP-04: prevents approving an already approved request", async () => {
    const created = await createPickupRequest("DUPLICATE");

    const firstResponse = await PATCH(
      patchRequest(created.id),
      context(created.id),
    );

    expect(firstResponse.status).toBe(200);

    const secondResponse = await PATCH(
      patchRequest(created.id),
      context(created.id),
    );
    const result = await secondResponse.json();

    expect(secondResponse.status).toBe(409);
    expect(result.error).toBe(
      "This pickup request has already been approved",
    );

    const activityCount = await prisma.wasteRequestActivity.count({
      where: {
        wasteRequestId: created.id,
        type: "REQUEST_APPROVED",
      },
    });

    expect(activityCount).toBe(1);
  });

  it("TC-INT-ADM-APP-05: rejects approval of a cancelled request", async () => {
    const created = await createPickupRequest(
      "CANCELED",
      "CANCELED",
    );

    const response = await PATCH(
      patchRequest(created.id),
      context(created.id),
    );

    expect(response.status).toBe(400);

    const saved = await prisma.wasteRequest.findUnique({
      where: { id: created.id },
    });

    expect(saved?.status).toBe("CANCELED");
    expect(saved?.approvedAt).toBeNull();
  });

  it("TC-INT-ADM-APP-06: rejects approval of a rejected request", async () => {
    const created = await createPickupRequest(
      "REJECTED",
      "REJECTED",
    );

    const response = await PATCH(
      patchRequest(created.id),
      context(created.id),
    );

    expect(response.status).toBe(400);

    const saved = await prisma.wasteRequest.findUnique({
      where: { id: created.id },
    });

    expect(saved?.status).toBe("REJECTED");
    expect(saved?.approvedAt).toBeNull();
  });

  it("TC-INT-ADM-APP-07: returns 404 for a nonexistent request", async () => {
    const missingId = crypto.randomUUID();

    const response = await PATCH(
      patchRequest(missingId),
      context(missingId),
    );

    const result = await response.json();

    expect(response.status).toBe(404);
    expect(result.error).toBe("Pickup request not found");
  });

  it("TC-INT-ADM-APP-08: rolls back approval when activity creation fails", async () => {
    const created = await createPickupRequest("ROLLBACK");

    const suffix = crypto.randomUUID().replace(/-/g, "");
    const functionName = `sqa_approve_fail_${suffix}`;
    const triggerName = `sqa_approve_trigger_${suffix}`;

    try {
    
      await prisma.$executeRawUnsafe(`
        CREATE FUNCTION "${functionName}"()
        RETURNS trigger
        LANGUAGE plpgsql
        AS $$
        BEGIN
          IF NEW."wasteRequestId" = '${created.id}'
             AND NEW."type" = 'REQUEST_APPROVED' THEN
            RAISE EXCEPTION 'Simulated approval activity failure';
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
          patchRequest(created.id),
          context(created.id),
        );
        const result = await response.json();

        expect(response.status).toBe(500);
        expect(result.success).toBe(false);
        expect(result.error).toBe(
          "Unable to approve the pickup request",
        );
      } finally {
        consoleSpy.mockRestore();
      }

      // The approval update must be rolled back.
      const saved = await prisma.wasteRequest.findUnique({
        where: { id: created.id },
      });

      expect(saved?.status).toBe("PENDING");
      expect(saved?.approvedAt).toBeNull();

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



it("TC-INT-ADM-APP-09: concurrent approvals must not create duplicate activities", async () => {
  const created = await createPickupRequest("CONCURRENT");

  // Launch two approval requests at nearly the same time.
  const responses = await Promise.all([
    PATCH(patchRequest(created.id), context(created.id)),
    PATCH(patchRequest(created.id), context(created.id)),
  ]);

  const statuses = responses.map((response) => response.status);

  const saved = await prisma.wasteRequest.findUnique({
    where: { id: created.id },
  });

  const activities = await prisma.wasteRequestActivity.findMany({
    where: {
      wasteRequestId: created.id,
      type: "REQUEST_APPROVED",
    },
  });

  // A request must be approved only once.
  expect(saved?.status).toBe("APPROVED");
  expect(activities).toHaveLength(1);

  // Exactly one attempt should succeed.
  expect(statuses.filter((status) => status === 200)).toHaveLength(1);

  // The other attempt should be rejected as a duplicate.
  expect(statuses).toContain(409);
});

});

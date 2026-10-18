
import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { NextRequest } from "next/server";
import type {
  PrismaClient,
  WasteRequestStatus,
} from "@prisma/client";
import { assertTestDatabase } from "./test-database";

const mocks = vi.hoisted(() => ({
  verifyAuth: vi.fn(),
}));

vi.mock("@/lib/verifyAuth", () => ({
  verifyAuth: mocks.verifyAuth,
}));

describe("Admin collector assignment PostgreSQL integration", () => {
  let prisma: PrismaClient;
  let PATCH: typeof import(
    "@/app/api/admin/get-requests/[id]/assign/route"
  ).PATCH;

  let adminId: string;
  let residentId: string;
  let addressId: string;
  let wasteTypeId: string;
  let collectorOneId: string;
  let collectorTwoId: string;
  let inactiveCollectorId: string;

  const requestIds: string[] = [];
  const userIds: string[] = [];
  const unique = crypto.randomUUID();

  const context = (id: string) => ({
    params: Promise.resolve({ id }),
  });

  const patchRequest = (
    id: string,
    collectorId: string,
  ) =>
    new NextRequest(
      `http://localhost:3000/api/admin/get-requests/${id}/assign`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ collectorId }),
      },
    );

  const createPickupRequest = async (
    label: string,
    status: WasteRequestStatus = "APPROVED",
  ) => {
    const created = await prisma.wasteRequest.create({
      data: {
        reference: `SQA-ASG-${label}-${unique}`,
        userId: residentId,
        wasteTypeId,
        addressId,
        description: `Collector assignment integration ${label}`,
        quantity: 2,
        quantityUnit: "BAG",
        status,
        approvedAt:
          status === "APPROVED" ? new Date() : null,
        requestedPickupDate: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000,
        ),
        pickupStreet: "10 Assignment Test Street",
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
      "@/app/api/admin/get-requests/[id]/assign/route"
    );
    PATCH = routeModule.PATCH;

    await prisma.$connect();

    const createUser = async (
      firstName: string,
      role: "ADMIN" | "USER" | "COLLECTOR",
    ) => {
      const user = await prisma.user.create({
        data: {
          firstName,
          lastName: "AssignmentTest",
          email: `${firstName.toLowerCase()}-${unique}@example.test`,
          password: "integration-test-only-not-a-real-password",
          role,
        },
      });

      userIds.push(user.id);
      return user;
    };

    const admin = await createUser("Admin", "ADMIN");
    adminId = admin.id;

    const resident = await createUser("Resident", "USER");
    residentId = resident.id;

    const collectorOne = await createUser(
      "CollectorOne",
      "COLLECTOR",
    );
    collectorOneId = collectorOne.id;

    const collectorTwo = await createUser(
      "CollectorTwo",
      "COLLECTOR",
    );
    collectorTwoId = collectorTwo.id;

    const inactiveCollector = await createUser(
      "InactiveCollector",
      "COLLECTOR",
    );
    inactiveCollectorId = inactiveCollector.id;

    await prisma.collectorProfile.create({
      data: {
        userId: collectorOneId,
        isActive: true,
        zone: "Central",
      },
    });

    await prisma.collectorProfile.create({
      data: {
        userId: collectorTwoId,
        isActive: true,
        zone: "North",
      },
    });

    await prisma.collectorProfile.create({
      data: {
        userId: inactiveCollectorId,
        isActive: false,
        zone: "South",
      },
    });

    const wasteType = await prisma.wasteType.create({
      data: {
        name: `Assignment Waste ${unique}`,
        status: "ACTIVE",
        price: 1000,
      },
    });
    wasteTypeId = wasteType.id;

    const address = await prisma.address.create({
      data: {
        userId: residentId,
        label: "Assignment Test Home",
        street: "10 Assignment Test Street",
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
            wasteRequestId: {
              in: requestIds,
            },
          },
        });

        await prisma.payment.deleteMany({
          where: {
            wasteRequestId: {
              in: requestIds,
            },
          },
        });

        await prisma.wasteRequest.deleteMany({
          where: {
            id: {
              in: requestIds,
            },
          },
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

      if (userIds.length > 0) {
        await prisma.collectorProfile.deleteMany({
          where: {
            userId: {
              in: userIds,
            },
          },
        });

        await prisma.user.deleteMany({
          where: {
            id: {
              in: userIds,
            },
          },
        });
      }
    } finally {
      await prisma.$disconnect();
    }
  });

  it("TC-INT-ADM-ASG-01: persists successful collector assignment", async () => {
    const created = await createPickupRequest("SUCCESS");

    const response = await PATCH(
      patchRequest(created.id, collectorOneId),
      context(created.id),
    );

    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.success).toBe(true);
    expect(result.request.status).toBe("ASSIGNED");

    const saved = await prisma.wasteRequest.findUnique({
      where: { id: created.id },
    });

    expect(saved?.status).toBe("ASSIGNED");
    expect(saved?.collectorId).toBe(collectorOneId);
  });

  it("TC-INT-ADM-ASG-02: persists assignment timestamp", async () => {
    const created = await createPickupRequest("TIMESTAMP");
    const before = new Date();

    const response = await PATCH(
      patchRequest(created.id, collectorOneId),
      context(created.id),
    );

    const after = new Date();

    expect(response.status).toBe(200);

    const saved = await prisma.wasteRequest.findUnique({
      where: { id: created.id },
    });

    expect(saved?.assignedAt).not.toBeNull();
    expect(saved!.assignedAt!.getTime()).toBeGreaterThanOrEqual(
      before.getTime(),
    );
    expect(saved!.assignedAt!.getTime()).toBeLessThanOrEqual(
      after.getTime(),
    );
  });

  it("TC-INT-ADM-ASG-03: records collector assignment activity", async () => {
    const created = await createPickupRequest("ACTIVITY");

    const response = await PATCH(
      patchRequest(created.id, collectorOneId),
      context(created.id),
    );

    expect(response.status).toBe(200);

    const activities = await prisma.wasteRequestActivity.findMany({
      where: {
        wasteRequestId: created.id,
        type: "COLLECTOR_ASSIGNED",
      },
    });

    expect(activities).toHaveLength(1);
    expect(activities[0].createdById).toBe(adminId);
    expect(activities[0].status).toBe("ASSIGNED");
  });

  it("TC-INT-ADM-ASG-04: prevents sequential duplicate assignment", async () => {
    const created = await createPickupRequest("DUPLICATE");

    const first = await PATCH(
      patchRequest(created.id, collectorOneId),
      context(created.id),
    );

    const second = await PATCH(
      patchRequest(created.id, collectorTwoId),
      context(created.id),
    );

    expect(first.status).toBe(200);
    expect(second.status).toBe(409);

    const saved = await prisma.wasteRequest.findUnique({
      where: { id: created.id },
    });

    expect(saved?.collectorId).toBe(collectorOneId);

    const count = await prisma.wasteRequestActivity.count({
      where: {
        wasteRequestId: created.id,
        type: "COLLECTOR_ASSIGNED",
      },
    });

    expect(count).toBe(1);
  });

  it("TC-INT-ADM-ASG-05: rejects assignment of a pending request", async () => {
    const created = await createPickupRequest(
      "PENDING",
      "PENDING",
    );

    const response = await PATCH(
      patchRequest(created.id, collectorOneId),
      context(created.id),
    );

    expect(response.status).toBe(409);

    const saved = await prisma.wasteRequest.findUnique({
      where: { id: created.id },
    });

    expect(saved?.status).toBe("PENDING");
    expect(saved?.collectorId).toBeNull();
  });

  it("TC-INT-ADM-ASG-06: rejects an inactive collector", async () => {
    const created = await createPickupRequest("INACTIVE");

    const response = await PATCH(
      patchRequest(created.id, inactiveCollectorId),
      context(created.id),
    );

    expect(response.status).toBe(404);

    const saved = await prisma.wasteRequest.findUnique({
      where: { id: created.id },
    });

    expect(saved?.status).toBe("APPROVED");
    expect(saved?.collectorId).toBeNull();
  });

  it("TC-INT-ADM-ASG-07: returns 404 for a nonexistent request", async () => {
    const response = await PATCH(
      patchRequest(crypto.randomUUID(), collectorOneId),
      context(crypto.randomUUID()),
    );

    expect(response.status).toBe(404);
  });

  it("TC-INT-ADM-ASG-08: concurrent assignments must not create duplicate activities", async () => {
    const created = await createPickupRequest("CONCURRENT");

    const responses = await Promise.all([
      PATCH(
        patchRequest(created.id, collectorOneId),
        context(created.id),
      ),
      PATCH(
        patchRequest(created.id, collectorTwoId),
        context(created.id),
      ),
    ]);

    const statuses = responses
      .map((response) => response.status)
      .sort();

    expect(statuses).toEqual([200, 409]);

    const saved = await prisma.wasteRequest.findUnique({
      where: { id: created.id },
    });

    expect(saved?.status).toBe("ASSIGNED");
    expect(
      [collectorOneId, collectorTwoId],
    ).toContain(saved?.collectorId);

    const activities = await prisma.wasteRequestActivity.findMany({
      where: {
        wasteRequestId: created.id,
        type: "COLLECTOR_ASSIGNED",
      },
    });

    expect(activities).toHaveLength(1);
  });
});

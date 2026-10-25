
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

describe("Admin request details PostgreSQL integration", () => {
  let prisma: PrismaClient;
  let GET: typeof import(
    "@/app/api/admin/get-requests/[id]/route"
  ).GET;

  let adminId: string;
  let residentId: string;
  let collectorId: string;
  let wasteTypeId: string;
  let addressId: string;
  let requestId: string;
  let unassignedRequestId: string;

  const userIds: string[] = [];
  const requestIds: string[] = [];
  const unique = crypto.randomUUID();

  const context = (id: string) => ({
    params: Promise.resolve({ id }),
  });

  const getRequest = (id: string) =>
    new NextRequest(
      `http://localhost:3000/api/admin/get-requests/${id}`,
    );

  const retrieve = (id: string) =>
    GET(getRequest(id), context(id));

  beforeAll(async () => {
    assertTestDatabase();

    const prismaModule = await import("@/lib/prisma");
    prisma = prismaModule.default;

    const routeModule = await import(
      "@/app/api/admin/get-requests/[id]/route"
    );
    GET = routeModule.GET;

    await prisma.$connect();

    const createUser = async (
      firstName: string,
      role: "ADMIN" | "USER" | "COLLECTOR",
    ) => {
      const user = await prisma.user.create({
        data: {
          firstName,
          lastName: "DetailsTest",
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

    const collector = await createUser(
      "Collector",
      "COLLECTOR",
    );
    collectorId = collector.id;

    await prisma.collectorProfile.create({
      data: {
        userId: collectorId,
        zone: "Central",
        isActive: true,
        vehicleRegistration: "SQA-DET-123",
      },
    });

    const wasteType = await prisma.wasteType.create({
      data: {
        name: `Details Waste ${unique}`,
        description: "Waste type for integration testing",
        status: "ACTIVE",
        price: 1000,
      },
    });
    wasteTypeId = wasteType.id;

    const address = await prisma.address.create({
      data: {
        userId: residentId,
        label: "Details Test Home",
        street: "10 Original Street",
        city: "Coventry",
        state: "West Midlands",
        postalCode: "CV1 1AA",
        country: "United Kingdom",
      },
    });
    addressId = address.id;

    const assigned = await prisma.wasteRequest.create({
      data: {
        reference: `SQA-DET-ASSIGNED-${unique}`,
        userId: residentId,
        wasteTypeId,
        addressId,
        collectorId,
        description: "Admin request details integration",
        quantity: 2,
        quantityUnit: "BAG",
        status: "ASSIGNED",
        approvedAt: new Date("2026-10-17T10:00:00Z"),
        assignedAt: new Date("2026-10-17T11:00:00Z"),
        requestedPickupDate: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000,
        ),
        pickupStreet: "25 Pickup Street",
        pickupCity: "Coventry",
        pickupState: "West Midlands",
        pickupPostalCode: "CV2 2BB",
        pickupCountry: "United Kingdom",
      },
    });
    requestId = assigned.id;
    requestIds.push(requestId);

    const unassigned = await prisma.wasteRequest.create({
      data: {
        reference: `SQA-DET-UNASSIGNED-${unique}`,
        userId: residentId,
        wasteTypeId,
        addressId,
        description: "Request without optional relations",
        quantity: 1,
        quantityUnit: "BAG",
        status: "PENDING",
        requestedPickupDate: new Date(
          Date.now() + 8 * 24 * 60 * 60 * 1000,
        ),
        pickupStreet: "10 Original Street",
        pickupCity: "Coventry",
        pickupState: "West Midlands",
        pickupCountry: "United Kingdom",
      },
    });
    unassignedRequestId = unassigned.id;
    requestIds.push(unassignedRequestId);

    await prisma.payment.create({
      data: {
        wasteRequestId: requestId,
        amount: 1000,
        status: "PAID",
        transactionRef: `SQA-DET-PAY-${unique}`,
        paidAt: new Date("2026-10-17T12:00:00Z"),
      },
    });

    await prisma.wasteRequestActivity.create({
      data: {
        wasteRequestId: requestId,
        createdById: residentId,
        type: "REQUEST_CREATED",
        status: "PENDING",
        title: "Request created",
        createdAt: new Date("2026-10-17T09:00:00Z"),
      },
    });

    await prisma.wasteRequestActivity.create({
      data: {
        wasteRequestId: requestId,
        createdById: adminId,
        type: "COLLECTOR_ASSIGNED",
        status: "ASSIGNED",
        title: "Collector assigned",
        createdAt: new Date("2026-10-17T11:00:00Z"),
      },
    });

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
          where: {
            id: { in: requestIds },
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
            userId: { in: userIds },
          },
        });

        await prisma.user.deleteMany({
          where: {
            id: { in: userIds },
          },
        });
      }
    } finally {
      await prisma.$disconnect();
    }
  });

  it("TC-INT-ADM-DET-01: retrieves request, resident and waste type", async () => {
    const response = await retrieve(requestId);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.success).toBe(true);
    expect(result.request.id).toBe(requestId);
    expect(result.request.status).toBe("ASSIGNED");
    expect(result.request.resident.id).toBe(residentId);
    expect(result.request.resident.fullName).toBe(
      "Resident DetailsTest",
    );
    expect(result.request.wasteType.id).toBe(wasteTypeId);
  });

  it("TC-INT-ADM-DET-02: returns pickup snapshot and saved address separately", async () => {
    const response = await retrieve(requestId);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.request.pickupAddress.street).toBe(
      "25 Pickup Street",
    );
    expect(result.request.pickupAddress.formatted).toBe(
      "25 Pickup Street, Coventry, West Midlands, CV2 2BB, United Kingdom",
    );
    expect(result.request.savedAddress.id).toBe(addressId);
    expect(result.request.savedAddress.street).toBe(
      "10 Original Street",
    );
  });

  it("TC-INT-ADM-DET-03: retrieves assigned collector and profile", async () => {
    const response = await retrieve(requestId);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.request.collector.id).toBe(collectorId);
    expect(result.request.collector.fullName).toBe(
      "Collector DetailsTest",
    );
    expect(
      result.request.collector.collectorProfile.zone,
    ).toBe("Central");
    expect(
      result.request.collector.collectorProfile.isActive,
    ).toBe(true);
  });

  it("TC-INT-ADM-DET-04: retrieves persisted payment details", async () => {
    const response = await retrieve(requestId);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.request.payment.status).toBe("PAID");
    expect(result.request.payment.transactionRef).toBe(
      `SQA-DET-PAY-${unique}`,
    );
    expect(result.request.payment.amount).toBeDefined();
  });

  it("TC-INT-ADM-DET-05: returns activity history newest first", async () => {
    const response = await retrieve(requestId);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.request.activities).toHaveLength(2);

    expect(result.request.activities[0].type).toBe(
      "COLLECTOR_ASSIGNED",
    );
    expect(result.request.activities[1].type).toBe(
      "REQUEST_CREATED",
    );
    expect(
      result.request.activities[0].createdBy.fullName,
    ).toBe("Admin DetailsTest");
  });

  it("TC-INT-ADM-DET-06: handles missing collector and payment", async () => {
    const response = await retrieve(unassignedRequestId);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.request.status).toBe("PENDING");
    expect(result.request.collector).toBeNull();
    expect(result.request.payment).toBeNull();
    expect(result.request.activities).toEqual([]);
  });

  it("TC-INT-ADM-DET-07: returns 404 for nonexistent request", async () => {
    const response = await retrieve(crypto.randomUUID());
    const result = await response.json();

    expect(response.status).toBe(404);
    expect(result.success).toBe(false);
  });

  it("TC-INT-ADM-DET-08: does not expose password fields", async () => {
    const response = await retrieve(requestId);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.request.resident).not.toHaveProperty(
      "password",
    );
    expect(result.request.collector).not.toHaveProperty(
      "password",
    );
    expect(result.request.activities[0].createdBy).not.toHaveProperty(
      "password",
    );
  });
});

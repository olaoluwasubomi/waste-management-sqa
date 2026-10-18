
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

describe("Admin request retrieval PostgreSQL integration", () => {
  let prisma: PrismaClient;
  let GET: typeof import(
    "@/app/api/admin/get-requests/route"
  ).GET;

  let residentAId: string;
  let residentBId: string;
  let addressAId: string;
  let addressBId: string;
  let wasteTypeId: string;

  let pendingRequestId: string;
  let approvedRequestId: string;
  let completedRequestId: string;

  let unique: string;
  let referencePrefix: string;

  const createRequest = (query = "") =>
    new NextRequest(
      `http://localhost:3000/api/admin/get-requests${query}`,
      { method: "GET" },
    );

  beforeAll(async () => {
    assertTestDatabase();

    const prismaModule = await import("@/lib/prisma");
    prisma = prismaModule.default;

    const routeModule = await import(
      "@/app/api/admin/get-requests/route"
    );
    GET = routeModule.GET;

    await prisma.$connect();

    unique = crypto.randomUUID();
    referencePrefix = `SQA-ADMIN-GET-${unique}`;

    const residentA = await prisma.user.create({
      data: {
        firstName: "AdminGetAlice",
        lastName: "Resident",
        email: `admin-get-a-${unique}@example.test`,
        password: "integration-test-only-not-a-real-password",
        role: "USER",
      },
    });
    residentAId = residentA.id;

    const residentB = await prisma.user.create({
      data: {
        firstName: "AdminGetBob",
        lastName: "Resident",
        email: `admin-get-b-${unique}@example.test`,
        password: "integration-test-only-not-a-real-password",
        role: "USER",
      },
    });
    residentBId = residentB.id;

    const wasteType = await prisma.wasteType.create({
      data: {
        name: `Admin Retrieval Waste ${unique}`,
        status: "ACTIVE",
        price: 1000,
      },
    });
    wasteTypeId = wasteType.id;

    const addressA = await prisma.address.create({
      data: {
        userId: residentAId,
        label: "Admin Retrieval Address A",
        street: "10 Admin Test Street",
        city: "Coventry",
        state: "West Midlands",
        country: "United Kingdom",
      },
    });
    addressAId = addressA.id;

    const addressB = await prisma.address.create({
      data: {
        userId: residentBId,
        label: "Admin Retrieval Address B",
        street: "20 Admin Test Street",
        city: "Birmingham",
        state: "West Midlands",
        country: "United Kingdom",
      },
    });
    addressBId = addressB.id;

    const commonData = {
      wasteTypeId,
      quantity: 2,
      quantityUnit: "BAG" as const,
      requestedPickupDate: new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000,
      ),
      pickupState: "West Midlands",
      pickupCountry: "United Kingdom",
    };

    const pending = await prisma.wasteRequest.create({
      data: {
        ...commonData,
        reference: `${referencePrefix}-PENDING`,
        userId: residentAId,
        addressId: addressAId,
        description: "Admin retrieval pending test",
        status: "PENDING",
        pickupStreet: addressA.street,
        pickupCity: addressA.city,
      },
    });
    pendingRequestId = pending.id;

    const approved = await prisma.wasteRequest.create({
      data: {
        ...commonData,
        reference: `${referencePrefix}-APPROVED`,
        userId: residentBId,
        addressId: addressBId,
        description: "Admin retrieval approved test",
        status: "APPROVED",
        pickupStreet: addressB.street,
        pickupCity: addressB.city,
      },
    });
    approvedRequestId = approved.id;

    const completed = await prisma.wasteRequest.create({
      data: {
        ...commonData,
        reference: `${referencePrefix}-COMPLETED`,
        userId: residentAId,
        addressId: addressAId,
        description: "Admin retrieval completed test",
        status: "COMPLETED",
        pickupStreet: addressA.street,
        pickupCity: addressA.city,
      },
    });
    completedRequestId = completed.id;

    mocks.verifyAuth.mockResolvedValue({
      id: "admin-integration-test",
      role: "ADMIN",
    });
  });

  afterAll(async () => {
    if (!prisma) return;

    try {
      const requestIds = [
        pendingRequestId,
        approvedRequestId,
        completedRequestId,
      ].filter((id): id is string => Boolean(id));

      if (requestIds.length > 0) {
        await prisma.wasteRequestActivity.deleteMany({
          where: { wasteRequestId: { in: requestIds } },
        });

        await prisma.payment.deleteMany({
          where: { wasteRequestId: { in: requestIds } },
        });

        await prisma.wasteRequest.deleteMany({
          where: { id: { in: requestIds } },
        });
      }

      const addressIds = [addressAId, addressBId].filter(
        (id): id is string => Boolean(id),
      );

      if (addressIds.length > 0) {
        await prisma.address.deleteMany({
          where: { id: { in: addressIds } },
        });
      }

      if (wasteTypeId) {
        await prisma.wasteType.deleteMany({
          where: { id: wasteTypeId },
        });
      }

      const residentIds = [residentAId, residentBId].filter(
        (id): id is string => Boolean(id),
      );

      if (residentIds.length > 0) {
        await prisma.user.deleteMany({
          where: { id: { in: residentIds } },
        });
      }
    } finally {
      await prisma.$disconnect();
    }
  });

  it("TC-INT-ADM-GET-01: retrieves requests from multiple Residents", async () => {
    const response = await GET(
      createRequest(`?search=${encodeURIComponent(referencePrefix)}&limit=100`),
    );
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.success).toBe(true);

    const ids = result.requests.map(
      (request: { id: string }) => request.id,
    );

    expect(ids).toContain(pendingRequestId);
    expect(ids).toContain(approvedRequestId);
    expect(ids).toContain(completedRequestId);
    expect(result.pagination.total).toBe(3);
  });

  it("TC-INT-ADM-GET-02: filters requests by status", async () => {
    const response = await GET(
      createRequest(
        `?status=PENDING&search=${encodeURIComponent(referencePrefix)}`,
      ),
    );
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.pagination.total).toBe(1);
    expect(result.requests).toHaveLength(1);
    expect(result.requests[0].id).toBe(pendingRequestId);
    expect(result.requests[0].status).toBe("PENDING");
  });

  it("TC-INT-ADM-GET-03: searches by request reference", async () => {
    const response = await GET(
      createRequest(
        `?search=${encodeURIComponent(`${referencePrefix}-APPROVED`)}`,
      ),
    );
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.pagination.total).toBe(1);
    expect(result.requests[0].id).toBe(approvedRequestId);
  });

  it("TC-INT-ADM-GET-04: searches by Resident name", async () => {
    const response = await GET(
      createRequest("?search=AdminGetBob"),
    );
    const result = await response.json();

    expect(response.status).toBe(200);

    const ids = result.requests.map(
      (request: { id: string }) => request.id,
    );

    expect(ids).toContain(approvedRequestId);
    expect(result.requests.some(
      (request: { resident: { firstName: string } }) =>
        request.resident.firstName === "AdminGetBob",
    )).toBe(true);
  });

  it("TC-INT-ADM-GET-05: applies pagination and descending sorting", async () => {
    const response = await GET(
      createRequest(
        `?search=${encodeURIComponent(referencePrefix)}&page=1&limit=2&order=desc`,
      ),
    );
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.requests).toHaveLength(2);
    expect(result.pagination.total).toBe(3);
    expect(result.pagination.totalPages).toBe(2);
    expect(result.pagination.hasNextPage).toBe(true);
    expect(result.pagination.hasPreviousPage).toBe(false);

    const dates = result.requests.map(
      (request: { createdAt: string }) =>
        new Date(request.createdAt).getTime(),
    );

    expect(dates[0]).toBeGreaterThanOrEqual(dates[1]);
  });

  it("TC-INT-ADM-GET-06: returns formatted related records", async () => {
    const response = await GET(
      createRequest(
        `?search=${encodeURIComponent(`${referencePrefix}-PENDING`)}`,
      ),
    );
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.requests).toHaveLength(1);

    const request = result.requests[0];

    expect(request.resident.id).toBe(residentAId);
    expect(request.resident.fullName).toBe(
      "AdminGetAlice Resident",
    );
    expect(request.wasteType.id).toBe(wasteTypeId);
    expect(request.pickupAddress.city).toBe("Coventry");
    expect(request.pickupAddress.formatted).toContain(
      "10 Admin Test Street",
    );
    expect(request.collector).toBeNull();
    expect(request.payment).toBeNull();
  });

  it("TC-INT-ADM-GET-07: returns accurate global statistics", async () => {
    const response = await GET(
      createRequest(
        `?search=${encodeURIComponent(referencePrefix)}`,
      ),
    );
    const result = await response.json();

    const [
      total,
      pending,
      approved,
      assigned,
      inProgress,
      completed,
      canceled,
      rejected,
    ] = await Promise.all([
      prisma.wasteRequest.count(),
      prisma.wasteRequest.count({ where: { status: "PENDING" } }),
      prisma.wasteRequest.count({ where: { status: "APPROVED" } }),
      prisma.wasteRequest.count({ where: { status: "ASSIGNED" } }),
      prisma.wasteRequest.count({ where: { status: "IN_PROGRESS" } }),
      prisma.wasteRequest.count({ where: { status: "COMPLETED" } }),
      prisma.wasteRequest.count({ where: { status: "CANCELED" } }),
      prisma.wasteRequest.count({ where: { status: "REJECTED" } }),
    ]);

    expect(response.status).toBe(200);
    expect(result.pagination.total).toBe(3);

    expect(result.stats).toMatchObject({
      totalRequests: total,
      pendingReview: pending,
      awaitingAssignment: approved,
      activeCollections: assigned + inProgress,
      pending,
      approved,
      assigned,
      inProgress,
      completed,
      canceled,
      rejected,
    });
  });
});

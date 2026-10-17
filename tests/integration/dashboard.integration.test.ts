
import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import type { PrismaClient, WasteRequestStatus } from "@prisma/client";
import { assertTestDatabase } from "./test-database";

// Mock authentication only. Prisma remains real.
const mocks = vi.hoisted(() => ({
  verifyAuth: vi.fn(),
}));

vi.mock("@/lib/verifyAuth", () => ({
  verifyAuth: mocks.verifyAuth,
}));

describe("Resident Dashboard PostgreSQL Integration Tests", () => {
  let prisma: PrismaClient;
  let GET: typeof import("@/app/api/user/dashboard/route").GET;
  let wasteTypeId: string;

  const userIds: string[] = [];
  const addressIds: string[] = [];
  const requestIds: string[] = [];

  const authenticateAs = (userId: string) => {
    mocks.verifyAuth.mockResolvedValue({
      id: userId,
      role: "USER",
    });
  };

  async function createResident() {
    const unique = crypto.randomUUID();

    const user = await prisma.user.create({
      data: {
        firstName: "Dashboard",
        lastName: "Test Resident",
        email: `dashboard-${unique}@example.test`,
        password: "integration-test-only-not-a-real-password",
        role: "USER",
      },
    });

    userIds.push(user.id);
    return user;
  }

  async function createAddress(userId: string) {
    const address = await prisma.address.create({
      data: {
        userId,
        label: "Home",
        street: "10 Dashboard Street",
        city: "Coventry",
        state: "West Midlands",
        postalCode: "CV1 1AA",
        country: "United Kingdom",
      },
    });

    addressIds.push(address.id);
    return address;
  }

  async function createRequest(
    userId: string,
    addressId: string,
    status: WasteRequestStatus,
    createdAt = new Date(),
  ) {
    const unique = crypto.randomUUID();

    const request = await prisma.wasteRequest.create({
      data: {
        reference: `SQA-DASH-${unique}`,
        description: "Dashboard integration test request",
        status,
        quantity: 2,
        quantityUnit: "BAG",
        requestedPickupDate: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000,
        ),
        userId,
        wasteTypeId,
        addressId,
        pickupStreet: "10 Dashboard Street",
        pickupCity: "Coventry",
        pickupState: "West Midlands",
        pickupPostalCode: "CV1 1AA",
        pickupCountry: "United Kingdom",
        createdAt,
      },
    });

    requestIds.push(request.id);
    return request;
  }

  beforeAll(async () => {
    // Protect the development database.
    assertTestDatabase();

    const prismaModule = await import("@/lib/prisma");
    prisma = prismaModule.default;

    const routeModule = await import(
      "@/app/api/user/dashboard/route"
    );
    GET = routeModule.GET;

    await prisma.$connect();

    const unique = crypto.randomUUID();

    const wasteType = await prisma.wasteType.create({
      data: {
        name: `Dashboard Test Waste ${unique}`,
        status: "ACTIVE",
        price: 1000,
      },
    });

    wasteTypeId = wasteType.id;
  });

  afterAll(async () => {
    if (!prisma) return;

    try {
      // Delete only fixtures created by this suite.
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

      if (addressIds.length > 0) {
        await prisma.address.deleteMany({
          where: {
            id: { in: addressIds },
          },
        });
      }

      if (wasteTypeId) {
        await prisma.wasteType.deleteMany({
          where: { id: wasteTypeId },
        });
      }

      if (userIds.length > 0) {
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

  it("TC-INT-DASH-01: retrieves accurate dashboard statistics from PostgreSQL", async () => {
    const resident = await createResident();
    const address = await createAddress(resident.id);

    await createRequest(resident.id, address.id, "PENDING");
    await createRequest(resident.id, address.id, "ASSIGNED");
    await createRequest(resident.id, address.id, "IN_PROGRESS");
    await createRequest(resident.id, address.id, "COMPLETED");

    authenticateAs(resident.id);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.stats).toEqual({
      activeRequests: 3,
      completedRequests: 1,
      addressCount: 1,
      hasAddress: true,
    });

    expect(body.recentRequests).toHaveLength(4);
  });

  it("TC-INT-DASH-02: excludes another Resident's database records", async () => {
    const residentA = await createResident();
    const residentB = await createResident();

    const addressA = await createAddress(residentA.id);
    const addressB = await createAddress(residentB.id);

    const ownRequest = await createRequest(
      residentA.id,
      addressA.id,
      "PENDING",
    );

    const otherRequest = await createRequest(
      residentB.id,
      addressB.id,
      "COMPLETED",
    );

    authenticateAs(residentA.id);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.stats.activeRequests).toBe(1);
    expect(body.stats.completedRequests).toBe(0);
    expect(body.stats.addressCount).toBe(1);

    expect(body.recentRequests).toHaveLength(1);
    expect(body.recentRequests[0].id).toBe(ownRequest.id);
    expect(
      body.recentRequests.some(
        (request: { id: string }) =>
          request.id === otherRequest.id,
      ),
    ).toBe(false);
  });

  it("TC-INT-DASH-03: returns zero statistics for a Resident without records", async () => {
    const resident = await createResident();

    authenticateAs(resident.id);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.stats).toEqual({
      activeRequests: 0,
      completedRequests: 0,
      addressCount: 0,
      hasAddress: false,
    });
    expect(body.recentRequests).toEqual([]);
  });

  it("TC-INT-DASH-04: updates hasAddress based on saved addresses", async () => {
    const resident = await createResident();

    authenticateAs(resident.id);

    const beforeResponse = await GET();
    const beforeBody = await beforeResponse.json();

    expect(beforeResponse.status).toBe(200);
    expect(beforeBody.stats.addressCount).toBe(0);
    expect(beforeBody.stats.hasAddress).toBe(false);

    await createAddress(resident.id);
    await createAddress(resident.id);

    const afterResponse = await GET();
    const afterBody = await afterResponse.json();

    expect(afterResponse.status).toBe(200);
    expect(afterBody.stats.addressCount).toBe(2);
    expect(afterBody.stats.hasAddress).toBe(true);
  });

  it("TC-INT-DASH-05: returns only five most recent requests in descending order", async () => {
    const resident = await createResident();
    const address = await createAddress(resident.id);

    const createdRequests = [];

    for (let index = 0; index < 7; index++) {
      const createdAt = new Date(
        Date.UTC(2026, 9, index + 1, 10, 0, 0),
      );

      const request = await createRequest(
        resident.id,
        address.id,
        "PENDING",
        createdAt,
      );

      createdRequests.push(request);
    }

    authenticateAs(resident.id);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.stats.activeRequests).toBe(7);
    expect(body.recentRequests).toHaveLength(5);

    const expectedIds = createdRequests
      .slice()
      .reverse()
      .slice(0, 5)
      .map((request) => request.id);

    expect(
      body.recentRequests.map(
        (request: { id: string }) => request.id,
      ),
    ).toEqual(expectedIds);

    expect(body.recentRequests[0].address).toBe(
      "10 Dashboard Street, Coventry",
    );

    expect(body.recentRequests[0].date).toBe(
      "2026-10-07T10:00:00.000Z",
    );
  });

  it("TC-INT-DASH-06: classifies request statuses according to the current implementation", async () => {
    const resident = await createResident();
    const address = await createAddress(resident.id);

    const statuses: WasteRequestStatus[] = [
      "PENDING",
      "APPROVED",
      "ASSIGNED",
      "IN_PROGRESS",
      "COMPLETED",
      "CANCELED",
      "REJECTED",
    ];

    for (const status of statuses) {
      await createRequest(resident.id, address.id, status);
    }

    authenticateAs(resident.id);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);

    // Current API implementation:
    // PENDING, ASSIGNED, IN_PROGRESS = active.
    // APPROVED is not included in active requests.
    expect(body.stats.activeRequests).toBe(3);
    expect(body.stats.completedRequests).toBe(1);

    // All statuses remain eligible for the recent list.
    expect(body.recentRequests).toHaveLength(5);
  });
});

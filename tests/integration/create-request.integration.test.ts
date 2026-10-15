
import { beforeAll, afterAll, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import type { PrismaClient } from "@prisma/client";
import { assertTestDatabase } from "./test-database";

// Mock authentication only. Prisma will remain real.
const mocks = vi.hoisted(() => ({
  verifyAuth: vi.fn(),
}));

vi.mock("@/lib/verifyAuth", () => ({
  verifyAuth: mocks.verifyAuth,
}));

describe("Resident waste request PostgreSQL integration", () => {
  let prisma: PrismaClient;
  let POST: typeof import("@/app/api/user/newrequests/route").POST;

  let residentId: string;
  let wasteTypeId: string;
  let addressId: string;
  let createdRequestId: string | undefined;
  let otherResidentId: string;
  let otherResidentAddressId: string;

  beforeAll(async () => {
 
    assertTestDatabase();

    const prismaModule = await import("@/lib/prisma");
    prisma = prismaModule.default;

    const routeModule = await import(
      "@/app/api/user/newrequests/route"
    );
    POST = routeModule.POST;

    await prisma.$connect();

    const unique = crypto.randomUUID();

    const resident = await prisma.user.create({
      data: {
        firstName: "Integration",
        lastName: "Resident",
        email: `integration-${unique}@example.test`,
        password: "integration-test-only-not-a-real-password",
        role: "USER",
      },
    });

    residentId = resident.id;

    const wasteType = await prisma.wasteType.create({
      data: {
        name: `Integration Household Waste ${unique}`,
        status: "ACTIVE",
        price: 1000,
      },
    });

    wasteTypeId = wasteType.id;

    const address = await prisma.address.create({
      data: {
        userId: residentId,
        label: "Test Home",
        street: "10 Integration Test Street",
        city: "Coventry",
        state: "West Midlands",
        country: "United Kingdom",
      },
    });

    addressId = address.id;

    mocks.verifyAuth.mockResolvedValue({
      id: residentId,
      email: resident.email,
      role: "USER",
    });

    const otherResident = await prisma.user.create({
        data: {
            firstName: "Other",
            lastName: "Resident",
            email: `other-resident-${unique}@example.test`,
            password: "integration-test-only-not-a-real-password",
            role: "USER",
        },
    });

    otherResidentId = otherResident.id;

    const otherAddress = await prisma.address.create({
        data: {
            userId: otherResidentId,
            label: "Other Resident Home",
            street: "25 Private Test Street",
            city: "Coventry",
            state: "West Midlands",
            country: "United Kingdom",
        },
    });

    otherResidentAddressId = otherAddress.id;
  });

  afterAll(async () => {
    if (!prisma) return;

    try {
      if (createdRequestId) {
        await prisma.wasteRequestActivity.deleteMany({
          where: { wasteRequestId: createdRequestId },
        });

        await prisma.wasteRequest.deleteMany({
          where: { id: createdRequestId },
        });
      }

      if (addressId) {
        await prisma.address.deleteMany({
          where: { id: addressId },
        });
      }
      if (otherResidentAddressId) {
        await prisma.address.deleteMany({
            where: { id: otherResidentAddressId },
        });
      }

      if (wasteTypeId) {
        await prisma.wasteType.deleteMany({
          where: { id: wasteTypeId },
        });
      }

      if (residentId) {
        await prisma.user.deleteMany({
          where: { id: residentId },
        });
      }
      
      if (otherResidentId) {
        await prisma.user.deleteMany({
            where: { id: otherResidentId },
        });
      }
    } finally {
      await prisma.$disconnect();
    }
   });

  it("TC-INT-01: persists a valid Resident waste request", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/user/newrequests",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wasteTypeId,
          addressId,
          description: "Household waste integration test",
          quantity: 1,
          quantityUnit: "BAG",
          requestedPickupDate: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000,
          ).toISOString(),
        }),
      },
    );

    const response = await POST(request);
    const result = await response.json();

    expect(response.status).toBe(201);
    expect(result.success).toBe(true);
    expect(result.request.id).toBeDefined();

    createdRequestId = result.request.id;

 
    const savedRequest = await prisma.wasteRequest.findUnique({
      where: { id: createdRequestId },
      include: {
        activities: true,
      },
    });

    expect(savedRequest).not.toBeNull();
    expect(savedRequest?.userId).toBe(residentId);
    expect(savedRequest?.wasteTypeId).toBe(wasteTypeId);
    expect(savedRequest?.addressId).toBe(addressId);
    expect(savedRequest?.status).toBe("PENDING");
    expect(savedRequest?.quantity).toBe(1);
    expect(savedRequest?.quantityUnit).toBe("BAG");

    expect(
      savedRequest?.activities.some(
        (activity) =>
          activity.type === "REQUEST_CREATED" &&
          activity.createdById === residentId,
      ),
    ).toBe(true);
  });


it("TC-INT-03: rejects another Resident's address", async () => {

  const otherAddress = await prisma.address.findUnique({
    where: { id: otherResidentAddressId },
  });

  expect(otherAddress).not.toBeNull();
  expect(otherAddress?.userId).toBe(otherResidentId);
  expect(otherAddress?.userId).not.toBe(residentId);


  const requestCountBefore = await prisma.wasteRequest.count({
    where: { userId: residentId },
  });

  // Resident A attempts to use Resident B's address.
  const request = new NextRequest(
    "http://localhost:3000/api/user/newrequests",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        wasteTypeId,
        addressId: otherResidentAddressId,
        description: "Attempt to use another Resident's address",
        quantity: 1,
        quantityUnit: "BAG",
        requestedPickupDate: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      }),
    },
  );

  const response = await POST(request);
  const result = await response.json();

  // Verify that the API rejects the request.
  expect(response.status).toBe(404);
  expect(result.success).toBe(false);
  expect(result.field).toBe("addressId");

  // Verify that PostgreSQL contains no additional request.
  const requestCountAfter = await prisma.wasteRequest.count({
    where: { userId: residentId },
  });

  expect(requestCountAfter).toBe(requestCountBefore);
});

});


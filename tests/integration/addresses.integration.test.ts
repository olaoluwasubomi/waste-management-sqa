
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type { PrismaClient } from "@prisma/client";
import { assertTestDatabase } from "./test-database";

const mocks = vi.hoisted(() => ({
  verifyAuth: vi.fn(),
}));

vi.mock("@/lib/verifyAuth", () => ({
  verifyAuth: mocks.verifyAuth,
}));

describe("Resident Address Management PostgreSQL integration", () => {
  let prisma: PrismaClient;

  let GET: typeof import("@/app/api/user/addresses/route").GET;
  let POST: typeof import("@/app/api/user/addresses/route").POST;
  let PUT: typeof import("@/app/api/user/addresses/[id]/route").PUT;
  let DELETE: typeof import("@/app/api/user/addresses/[id]/route").DELETE;

  let residentId: string;
  let otherResidentId: string;
  let addressId: string;
  let otherAddressId: string;
  let linkedAddressId: string;
  let wasteTypeId: string;
  let linkedRequestId: string;

  const baseUrl = "http://localhost:3000/api/user/addresses";

  function addressRequest(
    method: "POST" | "PUT",
    body: Record<string, unknown>,
    id?: string,
  ) {
    return new Request(id ? `${baseUrl}/${id}` : baseUrl, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  function routeContext(id: string) {
    return {
      params: Promise.resolve({ id }),
    };
  }

  beforeAll(async () => {
    // Never connect to or modify the development database.
    assertTestDatabase();

    const prismaModule = await import("@/lib/prisma");
    prisma = prismaModule.default;

    const addressesRoute = await import(
      "@/app/api/user/addresses/route"
    );

    const addressByIdRoute = await import(
      "@/app/api/user/addresses/[id]/route"
    );

    GET = addressesRoute.GET;
    POST = addressesRoute.POST;
    PUT = addressByIdRoute.PUT;
    DELETE = addressByIdRoute.DELETE;

    await prisma.$connect();

    const unique = crypto.randomUUID();

    const resident = await prisma.user.create({
      data: {
        firstName: "Address",
        lastName: "Resident",
        email: `address-resident-${unique}@example.test`,
        password: "integration-test-only-not-a-real-password",
        role: "USER",
      },
    });

    residentId = resident.id;

    const otherResident = await prisma.user.create({
      data: {
        firstName: "Other",
        lastName: "Resident",
        email: `address-other-${unique}@example.test`,
        password: "integration-test-only-not-a-real-password",
        role: "USER",
      },
    });

    otherResidentId = otherResident.id;

    const address = await prisma.address.create({
      data: {
        userId: residentId,
        label: "Integration Home",
        street: "10 Integration Street",
        city: "Coventry",
        state: "West Midlands",
        country: "United Kingdom",
      },
    });

    addressId = address.id;

    const otherAddress = await prisma.address.create({
      data: {
        userId: otherResidentId,
        label: "Other Resident Home",
        street: "20 Other Resident Street",
        city: "Birmingham",
        state: "West Midlands",
        country: "United Kingdom",
      },
    });

    otherAddressId = otherAddress.id;

    const linkedAddress = await prisma.address.create({
      data: {
        userId: residentId,
        label: "Linked Address",
        street: "30 Linked Request Street",
        city: "Coventry",
        state: "West Midlands",
        country: "United Kingdom",
      },
    });

    linkedAddressId = linkedAddress.id;

    const wasteType = await prisma.wasteType.create({
      data: {
        name: `Address Integration Waste ${unique}`,
        status: "ACTIVE",
        price: 1000,
      },
    });

    wasteTypeId = wasteType.id;

    const linkedRequest = await prisma.wasteRequest.create({
      data: {
        reference: `SQA-ADDR-${unique}`,
        userId: residentId,
        wasteTypeId,
        addressId: linkedAddressId,
        description: "Address deletion restriction test",
        quantity: 1,
        quantityUnit: "BAG",
        status: "PENDING",
        requestedPickupDate: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000,
        ),
        pickupStreet: linkedAddress.street,
        pickupCity: linkedAddress.city,
        pickupState: linkedAddress.state,
        pickupCountry: linkedAddress.country,
      },
    });

    linkedRequestId = linkedRequest.id;
  });

  beforeEach(() => {
    vi.resetAllMocks();

    mocks.verifyAuth.mockResolvedValue({
      id: residentId,
      role: "USER",
    });
  });

  afterAll(async () => {
    if (!prisma) return;

    try {
      // Remove only records created by this test suite.
      // Delete dependent records before their parent records.

      if (linkedRequestId) {
        await prisma.wasteRequest.deleteMany({
          where: { id: linkedRequestId },
        });
      }

      // Both user IDs were generated specifically for this suite.
      // This also removes addresses created through POST.
      const testResidentIds = [
        residentId,
        otherResidentId,
      ].filter((id): id is string => Boolean(id));

      if (testResidentIds.length > 0) {
        await prisma.address.deleteMany({
          where: {
            userId: { in: testResidentIds },
          },
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

  it("TC-INT-ADDR-01: creates and persists a Resident address", async () => {
    const response = await POST(
      addressRequest("POST", {
        street: "40 New Integration Street",
        city: "Coventry",
        state: "West Midlands",
        country: "United Kingdom",
        postalCode: "CV1 2AB",
      }),
    );

    expect(response.status).toBe(201);

    const result = await response.json();

    const savedAddress = await prisma.address.findUnique({
      where: { id: result.id },
    });

    expect(savedAddress).not.toBeNull();
    expect(savedAddress?.userId).toBe(residentId);
    expect(savedAddress?.street).toBe(
      "40 New Integration Street",
    );
    expect(savedAddress?.postalCode).toBe("CV1 2AB");
  });

  it("TC-INT-ADDR-02: retrieves only the authenticated Resident's addresses", async () => {
    const response = await GET();
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(result)).toBe(true);

    const returnedIds = result.map(
      (address: { id: string }) => address.id,
    );

    expect(returnedIds).toContain(addressId);
    expect(returnedIds).not.toContain(otherAddressId);

    const returnedAddresses = await prisma.address.findMany({
      where: { userId: residentId },
      select: { id: true },
    });

    expect(returnedIds.sort()).toEqual(
      returnedAddresses.map((address) => address.id).sort(),
    );
  });

  it("TC-INT-ADDR-03: updates an address and persists the changes", async () => {
    const response = await PUT(
      addressRequest(
        "PUT",
        {
          street: "55 Updated Integration Street",
          city: "Birmingham",
          state: "West Midlands",
          country: "United Kingdom",
          postalCode: "B1 1AA",
        },
        addressId,
      ),
      routeContext(addressId),
    );

    expect(response.status).toBe(200);

    const updatedAddress = await prisma.address.findUnique({
      where: { id: addressId },
    });

    expect(updatedAddress?.street).toBe(
      "55 Updated Integration Street",
    );
    expect(updatedAddress?.city).toBe("Birmingham");
    expect(updatedAddress?.postalCode).toBe("B1 1AA");
  });

  it("TC-INT-ADDR-04: prevents updating another Resident's address", async () => {
    const originalAddress = await prisma.address.findUnique({
      where: { id: otherAddressId },
    });

    const response = await PUT(
      addressRequest(
        "PUT",
        {
          street: "99 Unauthorized Street",
          city: "Coventry",
          state: "West Midlands",
        },
        otherAddressId,
      ),
      routeContext(otherAddressId),
    );

    expect(response.status).toBe(404);

    const savedAddress = await prisma.address.findUnique({
      where: { id: otherAddressId },
    });

    expect(savedAddress?.street).toBe(originalAddress?.street);
    expect(savedAddress?.userId).toBe(otherResidentId);
  });

  it("TC-INT-ADDR-05: deletes an unlinked address from PostgreSQL", async () => {
    // Create a separate address so other tests remain unaffected.
    const temporaryAddress = await prisma.address.create({
      data: {
        userId: residentId,
        label: "Temporary Delete Test",
        street: "60 Temporary Street",
        city: "Coventry",
        state: "West Midlands",
        country: "United Kingdom",
      },
    });

    const response = await DELETE(
      new Request(`${baseUrl}/${temporaryAddress.id}`, {
        method: "DELETE",
      }),
      routeContext(temporaryAddress.id),
    );

    expect(response.status).toBe(200);

    const deletedAddress = await prisma.address.findUnique({
      where: { id: temporaryAddress.id },
    });

    expect(deletedAddress).toBeNull();
  });

  it("TC-INT-ADDR-06: prevents deleting an address linked to a waste request", async () => {
    const response = await DELETE(
      new Request(`${baseUrl}/${linkedAddressId}`, {
        method: "DELETE",
      }),
      routeContext(linkedAddressId),
    );

    const result = await response.json();

    expect(response.status).toBe(400);
    expect(result.error).toBe(
      "This address is linked to pickup requests and cannot be deleted",
    );

    const savedAddress = await prisma.address.findUnique({
      where: { id: linkedAddressId },
    });

    const savedRequest = await prisma.wasteRequest.findUnique({
      where: { id: linkedRequestId },
    });

    expect(savedAddress).not.toBeNull();
    expect(savedRequest?.addressId).toBe(linkedAddressId);
  });

  it("TC-INT-ADDR-07: prevents deleting another Resident's address", async () => {
    const response = await DELETE(
      new Request(`${baseUrl}/${otherAddressId}`, {
        method: "DELETE",
      }),
      routeContext(otherAddressId),
    );

    expect(response.status).toBe(404);

    const savedAddress = await prisma.address.findUnique({
      where: { id: otherAddressId },
    });

    expect(savedAddress).not.toBeNull();
    expect(savedAddress?.userId).toBe(otherResidentId);
  });
});

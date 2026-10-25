import {
  beforeAll,
  afterAll,
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

describe("Resident waste request retrieval PostgreSQL integration", () => {
  let prisma: PrismaClient;
  let GET: typeof import("@/app/api/user/requests/route").GET;

  let residentId: string;
  let wasteTypeId: string;
  let addressId: string;
  let wasteRequestId: string;
  let otherResidentId: string;
  let otherAddressId: string;
  let otherWasteRequestId: string;
  let assignedRequestId: string;
  let completedRequestId: string;

  beforeAll(async () => {
    assertTestDatabase();

    const prismaModule = await import("@/lib/prisma");
    prisma = prismaModule.default;

    const routeModule = await import(
      "@/app/api/user/requests/route"
    );

    GET = routeModule.GET;

    await prisma.$connect();

    const unique = crypto.randomUUID();

    // Create a test Resident.
    const resident = await prisma.user.create({
      data: {
        firstName: "Retrieval",
        lastName: "Resident",
        email: `retrieval-${unique}@example.test`,
        password: "integration-test-only-not-a-real-password",
        role: "USER",
      },
    });

    residentId = resident.id;

    // Create a test waste type.
    const wasteType = await prisma.wasteType.create({
      data: {
        name: `Retrieval Household Waste ${unique}`,
        status: "ACTIVE",
        price: 1000,
      },
    });

    wasteTypeId = wasteType.id;

    // Create a test address belonging to the Resident.
    const address = await prisma.address.create({
      data: {
        userId: residentId,
        label: "Retrieval Test Home",
        street: "15 Retrieval Test Street",
        city: "Coventry",
        state: "West Midlands",
        country: "United Kingdom",
      },
    });

    addressId = address.id;

    // Create a waste request directly in PostgreSQL.
    const savedRequest = await prisma.wasteRequest.create({
      data: {
        reference: `SQA-GET-${unique}`,
        userId: residentId,
        wasteTypeId,
        addressId,
        description: "Household waste retrieval integration test",
        quantity: 2,
        quantityUnit: "BAG",
        status: "PENDING",
        requestedPickupDate: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000,
        ),
        pickupStreet: address.street,
        pickupCity: address.city,
        pickupState: address.state,
        pickupCountry: address.country,
      },
    });

    wasteRequestId = savedRequest.id;
    // Create an ASSIGNED request for the same Resident.
const assignedRequest = await prisma.wasteRequest.create({
  data: {
    reference: `SQA-ASSIGNED-${unique}`,
    userId: residentId,
    wasteTypeId,
    addressId,
    description: "Assigned waste collection integration test",
    quantity: 1,
    quantityUnit: "BAG",
    status: "ASSIGNED",
    requestedPickupDate: new Date(
      Date.now() + 8 * 24 * 60 * 60 * 1000,
    ),
    pickupStreet: address.street,
    pickupCity: address.city,
    pickupState: address.state,
    pickupCountry: address.country,
  },
});

assignedRequestId = assignedRequest.id;

// Create a COMPLETED request for the same Resident.
const completedRequest = await prisma.wasteRequest.create({
  data: {
    reference: `SQA-COMPLETED-${unique}`,
    userId: residentId,
    wasteTypeId,
    addressId,
    description: "Completed waste collection integration test",
    quantity: 1,
    quantityUnit: "BAG",
    status: "COMPLETED",
    requestedPickupDate: new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000,
    ),
    pickupStreet: address.street,
    pickupCity: address.city,
    pickupState: address.state,
    pickupCountry: address.country,
  },
});

completedRequestId = completedRequest.id;

    // Create a second Resident to test data isolation.
    const otherResident = await prisma.user.create({
    data: {
        firstName: "Other",
        lastName: "Retrieval Resident",
        email: `other-retrieval-${unique}@example.test`,
        password: "integration-test-only-not-a-real-password",
        role: "USER",
    },
    });

    otherResidentId = otherResident.id;

    // Create an address belonging to the second Resident.
    const otherAddress = await prisma.address.create({
    data: {
        userId: otherResidentId,
        label: "Other Resident Home",
        street: "25 Private Retrieval Street",
        city: "Coventry",
        state: "West Midlands",
        country: "United Kingdom",
    },
    });

    otherAddressId = otherAddress.id;

    // Create a waste request belonging to the second Resident.
    const otherWasteRequest = await prisma.wasteRequest.create({
    data: {
        reference: `SQA-OTHER-GET-${unique}`,
        userId: otherResidentId,
        wasteTypeId,
        addressId: otherAddressId,
        description: "Private waste request belonging to another Resident",
        quantity: 3,
        quantityUnit: "BAG",
        status: "PENDING",
        requestedPickupDate: new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000,
        ),
        pickupStreet: otherAddress.street,
        pickupCity: otherAddress.city,
        pickupState: otherAddress.state,
        pickupCountry: otherAddress.country,
    },
    });

    otherWasteRequestId = otherWasteRequest.id;

    // Simulate an authenticated Resident.
    mocks.verifyAuth.mockResolvedValue({
      id: residentId,
      email: resident.email,
      role: "USER",
    });
  });

  afterAll(async () => {
    if (!prisma) return;

    try {
      // STEP 1: Delete both Residents' waste requests first.
      // These records reference the Waste Type and Addresses.

      if (wasteRequestId) {
        await prisma.wasteRequest.deleteMany({
          where: { id: wasteRequestId },
        });
      }

      if (otherWasteRequestId) {
        await prisma.wasteRequest.deleteMany({
          where: { id: otherWasteRequestId },
        });
      }

      // STEP 2: Delete both Residents' addresses.
      // No waste requests should reference them now.

      if (assignedRequestId) {
  await prisma.wasteRequest.deleteMany({
    where: { id: assignedRequestId },
  });
}

if (completedRequestId) {
  await prisma.wasteRequest.deleteMany({
    where: { id: completedRequestId },
  });
}

      if (addressId) {
        await prisma.address.deleteMany({
          where: { id: addressId },
        });
      }

      if (otherAddressId) {
        await prisma.address.deleteMany({
          where: { id: otherAddressId },
        });
      }

      // STEP 3: Delete the shared Waste Type.
      // Both referencing waste requests have been removed.

      if (wasteTypeId) {
        await prisma.wasteType.deleteMany({
          where: { id: wasteTypeId },
        });
      }

      // STEP 4: Delete both test Residents.

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

  it(
    "TC-INT-GET-01: retrieves an existing Resident waste request",
    async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/user/requests?status=PENDING",
        {
          method: "GET",
        },
      );

      const response = await GET(request);
      const result = await response.json();

      // Verify the HTTP response.
      expect(response.status).toBe(200);
      expect(result.success).toBe(true);

      // Verify that the saved request was retrieved.
      expect(result.requests).toHaveLength(1);

      const retrievedRequest = result.requests[0];

      expect(retrievedRequest.id).toBe(wasteRequestId);
      expect(retrievedRequest.userId).toBeUndefined();
      expect(retrievedRequest.description).toBe(
        "Household waste retrieval integration test",
      );

      expect(retrievedRequest.status).toBe("PENDING");
      expect(retrievedRequest.quantity).toBe(2);

      // Verify related database records.
      expect(retrievedRequest.wasteType.id).toBe(wasteTypeId);
      expect(retrievedRequest.address.id).toBe(addressId);

      // Verify formatted pickup address.
      expect(retrievedRequest.pickupAddress.city).toBe(
        "Coventry",
      );

      // Verify pagination metadata.
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.totalPages).toBe(1);
    },
  );


  it(
    "TC-INT-GET-02: prevents a Resident from retrieving another Resident's requests",
    async () => {
      // Send a GET request as the authenticated Resident A.
      const request = new NextRequest(
        "http://localhost:3000/api/user/requests",
        {
          method: "GET",
        },
      );

      // Execute the actual API endpoint.
      const response = await GET(request);
      const result = await response.json();

      // Verify that the API request was successful.
      expect(response.status).toBe(200);
      expect(result.success).toBe(true);

      // Resident A has three waste requests:
      // PENDING, ASSIGNED, and COMPLETED.
      expect(result.requests).toHaveLength(3);

      // Extract the IDs of all returned requests.
      const returnedIds = result.requests.map(
        (item: { id: string }) => item.id,
      );

      // Verify that all three requests belonging to Resident A
      // are included in the API response.
      expect(returnedIds).toContain(wasteRequestId);
      expect(returnedIds).toContain(assignedRequestId);
      expect(returnedIds).toContain(completedRequestId);

      // Verify that Resident B's private request is excluded.
      expect(returnedIds).not.toContain(otherWasteRequestId);

      // Pagination must count only Resident A's requests.
      expect(result.pagination.total).toBe(3);

      // Confirm that Resident B's request actually exists
      // in the PostgreSQL database.
      const privateRequest = await prisma.wasteRequest.findUnique({
        where: {
          id: otherWasteRequestId,
        },
      });

      expect(privateRequest).not.toBeNull();
      expect(privateRequest?.userId).toBe(otherResidentId);
    },
  );

  it(
  "TC-INT-GET-03: filters Resident requests by collection view",
  async () => {
    const testCases = [
      {
        view: "WAITING",
        expectedId: wasteRequestId,
        expectedStatus: "PENDING",
      },
      {
        view: "UPCOMING",
        expectedId: assignedRequestId,
        expectedStatus: "ASSIGNED",
      },
      {
        view: "HISTORY",
        expectedId: completedRequestId,
        expectedStatus: "COMPLETED",
      },
    ];

    for (const testCase of testCases) {
      const request = new NextRequest(
        `http://localhost:3000/api/user/requests?view=${testCase.view}`,
        { method: "GET" },
      );

      const response = await GET(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);

      expect(result.requests).toHaveLength(1);
      expect(result.requests[0].id).toBe(testCase.expectedId);
      expect(result.requests[0].status).toBe(
        testCase.expectedStatus,
      );

      expect(result.pagination.total).toBe(1);
      expect(result.filters.view).toBe(testCase.view);
    }
  },
  );


  it(
    "TC-INT-GET-04: applies pagination and ascending sorting to Resident requests",
    async () => {
      // Retrieve the expected order directly from PostgreSQL.
      const expectedRequests = await prisma.wasteRequest.findMany({
        where: {
          userId: residentId,
        },
        orderBy: [
          { createdAt: "asc" },
          { id: "asc" },
        ],
        select: {
          id: true,
        },
      });

      expect(expectedRequests).toHaveLength(3);

      // Request the first page.
      const firstPageRequest = new NextRequest(
        "http://localhost:3000/api/user/requests?page=1&limit=2&order=asc",
        { method: "GET" },
      );

      const firstPageResponse = await GET(firstPageRequest);
      const firstPageResult = await firstPageResponse.json();

      expect(firstPageResponse.status).toBe(200);
      expect(firstPageResult.success).toBe(true);

      expect(firstPageResult.requests).toHaveLength(2);
      expect(firstPageResult.pagination).toMatchObject({
        page: 1,
        limit: 2,
        total: 3,
        totalPages: 2,
        hasNextPage: true,
        hasPreviousPage: false,
      });

      // Request the second page.
      const secondPageRequest = new NextRequest(
        "http://localhost:3000/api/user/requests?page=2&limit=2&order=asc",
        { method: "GET" },
      );

      const secondPageResponse = await GET(secondPageRequest);
      const secondPageResult = await secondPageResponse.json();

      expect(secondPageResponse.status).toBe(200);
      expect(secondPageResult.success).toBe(true);

      expect(secondPageResult.requests).toHaveLength(1);
      expect(secondPageResult.pagination).toMatchObject({
        page: 2,
        limit: 2,
        total: 3,
        totalPages: 2,
        hasNextPage: false,
        hasPreviousPage: true,
      });

      // Combine both pages and verify all three records were retrieved.
      const returnedIds = [
        ...firstPageResult.requests,
        ...secondPageResult.requests,
      ].map((request: { id: string }) => request.id);

      const expectedIds = expectedRequests.map(
        (request) => request.id,
      );

      expect(returnedIds).toEqual(expectedIds);
    },
  );

  it(
    "TC-INT-GET-05: searches Resident waste requests using PostgreSQL",
    async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/user/requests?search=completed%20waste%20collection",
        {
          method: "GET",
        },
      );

      const response = await GET(request);
      const result = await response.json();

      // Verify successful API response.
      expect(response.status).toBe(200);
      expect(result.success).toBe(true);

      // Only the matching Resident request should be returned.
      expect(result.requests).toHaveLength(1);

      expect(result.requests[0].id).toBe(completedRequestId);
      expect(result.requests[0].status).toBe("COMPLETED");

      expect(result.requests[0].description).toBe(
        "Completed waste collection integration test",
      );

      // Verify pagination reflects the filtered records.
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.totalPages).toBe(1);

      // Verify the search filter is included in the response.
      expect(result.filters.search).toBe(
        "completed waste collection",
      );

      // Confirm that unrelated requests are excluded.
      const returnedIds = result.requests.map(
        (item: { id: string }) => item.id,
      );

      expect(returnedIds).not.toContain(wasteRequestId);
      expect(returnedIds).not.toContain(assignedRequestId);
      expect(returnedIds).not.toContain(otherWasteRequestId);

      // Verify that the matching record exists in PostgreSQL.
      const savedRequest = await prisma.wasteRequest.findUnique({
        where: {
          id: completedRequestId,
        },
      });

      expect(savedRequest).not.toBeNull();
      expect(savedRequest?.description).toBe(
        "Completed waste collection integration test",
      );
    },
  );
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { WasteRequestStatus } from "@prisma/client";

const mocks = vi.hoisted(() => ({
  verifyAuth: vi.fn(),
  findMany: vi.fn(),
  count: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("@/lib/verifyAuth", () => ({
  verifyAuth: mocks.verifyAuth,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    wasteRequest: {
      findMany: mocks.findMany,
      count: mocks.count,
    },
    $transaction: mocks.transaction,
  },
}));

import { GET } from "@/app/api/admin/get-requests/route";

describe("GET /api/admin/get-requests - Unit Tests", () => {
  const createRequest = (query = "") =>
    new NextRequest(
      `http://localhost:3000/api/admin/get-requests${query}`,
    );

  const makeRequestRecord = (overrides: Record<string, unknown> = {}) => ({
    id: "request-001",
    reference: "WR-001",
    description: "Household waste",
    quantity: 2,
    quantityUnit: "BAG",
    status: WasteRequestStatus.PENDING,
    requestedPickupDate: new Date("2026-10-20T10:00:00.000Z"),
    scheduledPickupStart: null,
    scheduledPickupEnd: null,
    createdAt: new Date("2026-10-15T10:00:00.000Z"),
    updatedAt: new Date("2026-10-15T10:00:00.000Z"),
    pickupStreet: "10 Main Street",
    pickupCity: "Coventry",
    pickupState: "West Midlands",
    pickupPostalCode: "CV1 1AA",
    pickupCountry: "United Kingdom",
    user: {
      id: "resident-001",
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@example.com",
      image: null,
    },
    wasteType: {
      id: "waste-type-001",
      name: "General Waste",
      description: "Household waste",
      price: 20,
      imageUrl: null,
    },
    collector: null,
    payment: null,
    ...overrides,
  });

  beforeEach(() => {
    vi.resetAllMocks();

    mocks.verifyAuth.mockResolvedValue({
      id: "admin-001",
      role: "ADMIN",
    });

    mocks.findMany.mockResolvedValue([]);
    mocks.count.mockResolvedValue(0);

    mocks.transaction.mockImplementation(
      async (operations: Promise<unknown>[]) =>
        Promise.all(operations),
    );
  });

  it("TC-ADM-GET-01: retrieves requests successfully", async () => {
    mocks.findMany.mockResolvedValue([makeRequestRecord()]);
    mocks.count.mockResolvedValue(1);

    const response = await GET(createRequest());
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.success).toBe(true);
    expect(result.requests).toHaveLength(1);
    expect(result.requests[0].reference).toBe("WR-001");
  });

  it("TC-ADM-GET-02: returns 401 for unauthenticated users", async () => {
    mocks.verifyAuth.mockResolvedValue(null);

    const response = await GET(createRequest());
    const result = await response.json();

    expect(response.status).toBe(401);
    expect(result.success).toBe(false);
    expect(result.error).toBe("Unauthorized");
    expect(mocks.findMany).not.toHaveBeenCalled();
  });

  it("TC-ADM-GET-03: returns 403 for Residents", async () => {
    mocks.verifyAuth.mockResolvedValue({
      id: "resident-001",
      role: "USER",
    });

    const response = await GET(createRequest());
    const result = await response.json();

    expect(response.status).toBe(403);
    expect(result.success).toBe(false);
    expect(result.error).toBe(
      "Only administrators can access request management",
    );
    expect(mocks.findMany).not.toHaveBeenCalled();
  });

  it("TC-ADM-GET-04: applies default pagination", async () => {
    await GET(createRequest());

    expect(mocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
        take: 20,
      }),
    );
  });

  it("TC-ADM-GET-05: applies custom pagination", async () => {
    const response = await GET(createRequest("?page=3&limit=10"));
    const result = await response.json();

    expect(mocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 20,
        take: 10,
      }),
    );

    expect(result.pagination.page).toBe(3);
    expect(result.pagination.limit).toBe(10);
  });

  it("TC-ADM-GET-06: caps the limit at 100", async () => {
    const response = await GET(createRequest("?limit=500"));
    const result = await response.json();

    expect(result.pagination.limit).toBe(100);
    expect(mocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 100 }),
    );
  });

  it("TC-ADM-GET-07: defaults invalid nonpositive pagination values", async () => {
    const response = await GET(createRequest("?page=0&limit=-5"));
    const result = await response.json();

    expect(result.pagination.page).toBe(1);
    expect(result.pagination.limit).toBe(20);
  });

  it("TC-ADM-GET-08: applies a valid status filter", async () => {
    const response = await GET(createRequest("?status=pending"));
    const result = await response.json();

    expect(mocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: WasteRequestStatus.PENDING },
      }),
    );

    expect(result.filters.status).toBe("PENDING");
  });

  it("TC-ADM-GET-09: ignores an invalid status filter", async () => {
    const response = await GET(createRequest("?status=UNKNOWN"));
    const result = await response.json();

    expect(result.filters.status).toBeNull();
    expect(mocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} }),
    );
  });

  it("TC-ADM-GET-10: builds case-insensitive search conditions", async () => {
    const response = await GET(createRequest("?search=Coventry"));
    const result = await response.json();

    const query = mocks.findMany.mock.calls[0][0];

    expect(query.where.OR).toHaveLength(9);
    expect(query.where.OR).toContainEqual({
      pickupCity: {
        contains: "Coventry",
        mode: "insensitive",
      },
    });
    expect(result.filters.search).toBe("Coventry");
  });

  it("TC-ADM-GET-11: ignores blank search input", async () => {
    const response = await GET(createRequest("?search=%20%20"));
    const result = await response.json();

    expect(result.filters.search).toBeNull();
    expect(mocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} }),
    );
  });

  it("TC-ADM-GET-12: applies ascending sorting", async () => {
    const response = await GET(createRequest("?order=asc"));
    const result = await response.json();

    expect(mocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { createdAt: "asc" },
      }),
    );
    expect(result.filters.order).toBe("asc");
  });

  it("TC-ADM-GET-13: defaults invalid sorting to descending", async () => {
    const response = await GET(createRequest("?order=random"));
    const result = await response.json();

    expect(mocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { createdAt: "desc" },
      }),
    );
    expect(result.filters.order).toBe("desc");
  });

  it("TC-ADM-GET-14: retrieves requests without a Resident restriction", async () => {
    await GET(createRequest());

    const query = mocks.findMany.mock.calls[0][0];

    expect(query.where).not.toHaveProperty("userId");
    expect(mocks.count).toHaveBeenCalledWith({ where: {} });
  });

  it("TC-ADM-GET-15: formats related request information", async () => {
    mocks.findMany.mockResolvedValue([makeRequestRecord()]);

    const response = await GET(createRequest());
    const result = await response.json();
    const request = result.requests[0];

    expect(request.resident.fullName).toBe("Jane Doe");
    expect(request.resident.email).toBe("jane@example.com");
    expect(request.wasteType.name).toBe("General Waste");
    expect(request.pickupAddress.formatted).toBe(
      "10 Main Street, Coventry, West Midlands, CV1 1AA, United Kingdom",
    );
    expect(request.payment).toBeNull();
  });

  it("TC-ADM-GET-16: returns null for an unassigned collector", async () => {
    mocks.findMany.mockResolvedValue([makeRequestRecord()]);

    const response = await GET(createRequest());
    const result = await response.json();

    expect(result.requests[0].collector).toBeNull();
  });

  it("TC-ADM-GET-17: calculates summary statistics", async () => {
    mocks.count
      .mockResolvedValueOnce(12) // Matching requests
      .mockResolvedValueOnce(4)  // Pending
      .mockResolvedValueOnce(3)  // Approved
      .mockResolvedValueOnce(2)  // Assigned
      .mockResolvedValueOnce(1)  // In progress
      .mockResolvedValueOnce(1)  // Completed
      .mockResolvedValueOnce(1)  // Canceled
      .mockResolvedValueOnce(0)  // Rejected
      .mockResolvedValueOnce(12); // All requests

    const response = await GET(createRequest());
    const result = await response.json();

    expect(result.stats).toMatchObject({
      totalRequests: 12,
      pendingReview: 4,
      awaitingAssignment: 3,
      activeCollections: 3,
      pending: 4,
      approved: 3,
      assigned: 2,
      inProgress: 1,
      completed: 1,
      canceled: 1,
      rejected: 0,
    });
  });

  it("TC-ADM-GET-18: calculates pagination metadata", async () => {
    mocks.count.mockResolvedValue(45);

    const response = await GET(createRequest("?page=2&limit=20"));
    const result = await response.json();

    expect(result.pagination).toEqual({
      page: 2,
      limit: 20,
      total: 45,
      totalPages: 3,
      hasNextPage: true,
      hasPreviousPage: true,
    });
  });

  it("TC-ADM-GET-19: returns an empty result when no requests exist", async () => {
    const response = await GET(createRequest());
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.requests).toEqual([]);
    expect(result.pagination.total).toBe(0);
    expect(result.pagination.totalPages).toBe(0);
    expect(result.pagination.hasNextPage).toBe(false);
    expect(result.stats.totalRequests).toBe(0);
  });

  it("TC-ADM-GET-20: returns 500 when a database query fails", async () => {
    const errorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    try {
      mocks.findMany.mockRejectedValue(new Error("Database unavailable"));

      const response = await GET(createRequest());
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.success).toBe(false);
      expect(result.error).toBe(
        "Unable to retrieve pickup requests",
      );
    } finally {
      errorSpy.mockRestore();
    }
  });

  it("TC-ADM-GET-21: defaults malformed page input", async () => {
  const response = await GET(createRequest("?page=2abc"));
  const result = await response.json();

  expect(response.status).toBe(200);
  expect(result.pagination.page).toBe(1);
  expect(mocks.findMany).toHaveBeenCalledWith(
    expect.objectContaining({
      skip: 0,
    }),
  );
 });

it("TC-ADM-GET-22: defaults malformed limit input", async () => {
  const response = await GET(createRequest("?limit=5xyz"));
  const result = await response.json();

  expect(response.status).toBe(200);
  expect(result.pagination.limit).toBe(20);
  expect(mocks.findMany).toHaveBeenCalledWith(
    expect.objectContaining({
      take: 20,
    }),
  );
});
});

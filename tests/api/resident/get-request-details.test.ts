
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  verifyAuth: vi.fn(),
  findFirst: vi.fn(),
}));

vi.mock("@/lib/verifyAuth", () => ({
  verifyAuth: mocks.verifyAuth,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    wasteRequest: {
      findFirst: mocks.findFirst,
    },
  },
}));

import { GET } from "@/app/api/user/requests/[id]/route";

describe("GET /api/user/requests/[id] - Unit Tests", () => {
  const residentId = "resident-001";
  const requestId = "request-001";

  const createRequest = (id = requestId) =>
    new NextRequest(
      `http://localhost:3000/api/user/requests/${id || "missing"}`,
    );

  const routeContext = (id = requestId) => ({
    params: Promise.resolve({ id }),
  });

  const sampleWasteRequest = () => ({
    id: requestId,
    reference: "WM-001",
    description: "Household waste collection",
    quantity: 2,
    quantityUnit: "BAG",
    status: "PENDING",

    requestedPickupDate: new Date("2026-12-01T10:00:00Z"),
    scheduledPickupStart: null,
    scheduledPickupEnd: null,

    approvedAt: null,
    assignedAt: null,
    startedAt: null,
    completedAt: null,
    canceledAt: null,
    rejectedAt: null,

    cancellationReason: null,
    rejectionReason: null,

    pickupStreet: "10 Test Street",
    pickupCity: "Coventry",
    pickupState: "West Midlands",
    pickupPostalCode: "CV1 1AA",
    pickupCountry: "United Kingdom",

    createdAt: new Date("2026-10-01T10:00:00Z"),
    updatedAt: new Date("2026-10-01T10:00:00Z"),

    wasteType: {
      id: "waste-type-001",
      name: "Household Waste",
      description: "General household waste",
      price: 1000,
      imageUrl: null,
      status: "ACTIVE",
    },

    address: {
      id: "address-001",
      label: "Home",
    },

    collector: null,
    payment: null,
    activities: [],
  });

  beforeEach(() => {
    vi.resetAllMocks();

    mocks.verifyAuth.mockResolvedValue({
      id: residentId,
      role: "USER",
    });
  });

  it("TC-RES-DETAIL-01: retrieves an existing Resident request", async () => {
    mocks.findFirst.mockResolvedValue(sampleWasteRequest());

    const response = await GET(
      createRequest(),
      routeContext(),
    );

    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.success).toBe(true);
    expect(result.request.id).toBe(requestId);
    expect(result.request.reference).toBe("WM-001");
    expect(result.request.quantity).toBe(2);
    expect(result.request.status).toBe("PENDING");
    expect(result.request.wasteType.name).toBe("Household Waste");
    expect(result.request.savedAddress.label).toBe("Home");

    expect(mocks.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: requestId,
          userId: residentId,
        },
      }),
    );
  });

  it("TC-RES-DETAIL-02: returns 401 when unauthenticated", async () => {
    mocks.verifyAuth.mockResolvedValue(null);

    const response = await GET(
      createRequest(),
      routeContext(),
    );

    const result = await response.json();

    expect(response.status).toBe(401);
    expect(result.success).toBe(false);
    expect(result.error).toBe("Unauthorized");
    expect(mocks.findFirst).not.toHaveBeenCalled();
  });

  it("TC-RES-DETAIL-03: returns 403 for an Admin", async () => {
    mocks.verifyAuth.mockResolvedValue({
      id: "admin-001",
      role: "ADMIN",
    });

    const response = await GET(
      createRequest(),
      routeContext(),
    );

    const result = await response.json();

    expect(response.status).toBe(403);
    expect(result.error).toBe(
      "Only residents can access this endpoint",
    );
    expect(mocks.findFirst).not.toHaveBeenCalled();
  });

  it("TC-RES-DETAIL-04: returns 400 when request ID is missing", async () => {
    const response = await GET(
      createRequest(),
      routeContext(""),
    );

    const result = await response.json();

    expect(response.status).toBe(400);
    expect(result.error).toBe("Request ID is required");
    expect(mocks.findFirst).not.toHaveBeenCalled();
  });

  it("TC-RES-DETAIL-05: returns 404 when request does not exist", async () => {
    mocks.findFirst.mockResolvedValue(null);

    const response = await GET(
      createRequest("nonexistent-request"),
      routeContext("nonexistent-request"),
    );

    const result = await response.json();

    expect(response.status).toBe(404);
    expect(result.error).toBe("Pickup request not found");
  });

  it("TC-RES-DETAIL-06: prevents retrieving another Resident's request", async () => {
    mocks.findFirst.mockResolvedValue(null);

    const response = await GET(
      createRequest("other-resident-request"),
      routeContext("other-resident-request"),
    );

    expect(response.status).toBe(404);

    expect(mocks.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "other-resident-request",
          userId: residentId,
        },
      }),
    );
  });

  it("TC-RES-DETAIL-07: formats the pickup address correctly", async () => {
    mocks.findFirst.mockResolvedValue(sampleWasteRequest());

    const response = await GET(
      createRequest(),
      routeContext(),
    );

    const result = await response.json();

    expect(response.status).toBe(200);

    expect(result.request.pickupAddress).toEqual({
      street: "10 Test Street",
      city: "Coventry",
      state: "West Midlands",
      postalCode: "CV1 1AA",
      country: "United Kingdom",
      formatted:
        "10 Test Street, Coventry, West Midlands, CV1 1AA, United Kingdom",
    });
  });

  it("TC-RES-DETAIL-08: includes the assigned collector's full name", async () => {
    mocks.findFirst.mockResolvedValue({
      ...sampleWasteRequest(),
      collector: {
        id: "collector-001",
        firstName: "John",
        lastName: "Smith",
        phone: "07000000000",
        image: null,
        collectorProfile: {
          zone: "Coventry",
          isActive: true,
          vehicleRegistration: "CV12 ABC",
        },
      },
    });

    const response = await GET(
      createRequest(),
      routeContext(),
    );

    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.request.collector.fullName).toBe("John Smith");
    expect(result.request.collector.collectorProfile.zone).toBe(
      "Coventry",
    );
  });

  it("TC-RES-DETAIL-09: handles requests without collector or payment", async () => {
    mocks.findFirst.mockResolvedValue(sampleWasteRequest());

    const response = await GET(
      createRequest(),
      routeContext(),
    );

    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.request.collector).toBeNull();
    expect(result.request.payment).toBeNull();
    expect(result.request.activities).toEqual([]);
  });

  it("TC-RES-DETAIL-10: includes activity creator full names", async () => {
    mocks.findFirst.mockResolvedValue({
      ...sampleWasteRequest(),
      activities: [
        {
          id: "activity-001",
          type: "REQUEST_CREATED",
          status: "PENDING",
          title: "Pickup request created",
          description: "Resident submitted a request",
          createdAt: new Date("2026-10-01T10:00:00Z"),
          createdBy: {
            id: residentId,
            firstName: "Esther",
            lastName: "Abiola",
            role: "USER",
          },
        },
        {
          id: "activity-002",
          type: "REQUEST_UPDATED",
          status: "PENDING",
          title: "Pickup request updated",
          description: "Details changed",
          createdAt: new Date("2026-10-02T10:00:00Z"),
          createdBy: null,
        },
      ],
    });

    const response = await GET(
      createRequest(),
      routeContext(),
    );

    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.request.activities).toHaveLength(2);

    expect(
      result.request.activities[0].createdBy.fullName,
    ).toBe("Esther Abiola");

    expect(
      result.request.activities[1].createdBy,
    ).toBeNull();

    expect(mocks.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          activities: expect.objectContaining({
            orderBy: {
              createdAt: "asc",
            },
          }),
        }),
      }),
    );
  });

  it("TC-RES-DETAIL-11: returns 500 when database retrieval fails", async () => {
    mocks.findFirst.mockRejectedValue(
      new Error("Simulated database failure"),
    );

    const consoleSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    try {
      const response = await GET(
        createRequest(),
        routeContext(),
      );

      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.success).toBe(false);
      expect(result.error).toBe(
        "Unable to retrieve pickup request details",
      );
    } finally {
      consoleSpy.mockRestore();
    }
  });
});

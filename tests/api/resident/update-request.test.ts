
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  RequestActivityType,
  WasteRequestStatus,
} from "@prisma/client";

const mocks = vi.hoisted(() => ({
  verifyAuth: vi.fn(),
  findFirst: vi.fn(),
  wasteTypeFindUnique: vi.fn(),
  addressFindFirst: vi.fn(),
  update: vi.fn(),
  activityCreate: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("@/lib/verifyAuth", () => ({
  verifyAuth: mocks.verifyAuth,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    wasteRequest: {
      findFirst: mocks.findFirst,
    },
    wasteType: {
      findUnique: mocks.wasteTypeFindUnique,
    },
    address: {
      findFirst: mocks.addressFindFirst,
    },
    $transaction: mocks.transaction,
  },
}));

import { PATCH } from "@/app/api/user/requests/[id]/route";

describe("PATCH /api/user/requests/[id] - Unit Tests", () => {
  const residentId = "resident-001";
  const requestId = "request-001";
  const wasteTypeId = "waste-type-001";
  const addressId = "address-001";

  const originalDate = new Date("2099-12-01T10:00:00Z");
  const changedDate = new Date("2099-12-05T10:00:00Z");

  const existingRequest = () => ({
    id: requestId,
    reference: "WR-001",
    status: WasteRequestStatus.PENDING,
    wasteTypeId,
    addressId,
    description: "Household waste",
    quantity: 2,
    quantityUnit: "BAG",
    requestedPickupDate: originalDate,
    pickupStreet: "10 Test Street",
    pickupCity: "Coventry",
    pickupState: "West Midlands",
    pickupPostalCode: "CV1 1AA",
    pickupCountry: "United Kingdom",
  });

  const selectedAddress = () => ({
    id: addressId,
    label: "Home",
    street: "10 Test Street",
    city: "Coventry",
    state: "West Midlands",
    postalCode: "CV1 1AA",
    country: "United Kingdom",
  });

  const updatedRequest = () => ({
    ...existingRequest(),
    description: "Updated household waste",
    createdAt: new Date("2026-10-01T10:00:00Z"),
    updatedAt: new Date("2026-10-02T10:00:00Z"),
    wasteType: {
      id: wasteTypeId,
      name: "Household Waste",
      description: null,
      price: 1000,
      imageUrl: null,
    },
    address: {
      id: addressId,
      label: "Home",
    },
  });

  const routeContext = (id = requestId) => ({
    params: Promise.resolve({ id }),
  });

  const createRequest = (
    body: unknown,
    id = requestId,
  ) =>
    new NextRequest(
      `http://localhost:3000/api/user/requests/${id || "missing"}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    );

  beforeEach(() => {
    vi.resetAllMocks();

    mocks.verifyAuth.mockResolvedValue({
      id: residentId,
      role: "USER",
    });

    mocks.findFirst.mockResolvedValue(existingRequest());

    mocks.wasteTypeFindUnique.mockResolvedValue({
      id: wasteTypeId,
      name: "Household Waste",
      status: "ACTIVE",
      price: 1000,
    });

    mocks.addressFindFirst.mockResolvedValue(selectedAddress());

    mocks.update.mockResolvedValue(updatedRequest());

    mocks.activityCreate.mockResolvedValue({
      id: "activity-001",
    });

    mocks.transaction.mockImplementation(
      async (callback: (transaction: unknown) => Promise<unknown>) =>
        callback({
          wasteRequest: {
            update: mocks.update,
          },
          wasteRequestActivity: {
            create: mocks.activityCreate,
          },
        }),
    );
  });

  it("TC-RES-UPDATE-01: updates general request details", async () => {
    const response = await PATCH(
      createRequest({ description: "Updated household waste" }),
      routeContext(),
    );

    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.success).toBe(true);
    expect(result.message).toBe(
      "Pickup request updated successfully",
    );

    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: requestId },
        data: expect.objectContaining({
          description: "Updated household waste",
        }),
      }),
    );

    expect(mocks.activityCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        wasteRequestId: requestId,
        createdById: residentId,
        type: RequestActivityType.REQUEST_UPDATED,
      }),
    });

    expect(mocks.activityCreate).toHaveBeenCalledTimes(1);
  });

  it("TC-RES-UPDATE-02: reschedules the pickup date", async () => {
    const response = await PATCH(
      createRequest({
        requestedPickupDate: changedDate.toISOString(),
      }),
      routeContext(),
    );

    expect(response.status).toBe(200);

    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          requestedPickupDate: changedDate,
        }),
      }),
    );

    expect(mocks.activityCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: RequestActivityType.REQUEST_RESCHEDULED,
      }),
    });

    expect(mocks.activityCreate).toHaveBeenCalledTimes(1);
  });

  it("TC-RES-UPDATE-03: records both activities when details and date change", async () => {
    const response = await PATCH(
      createRequest({
        description: "Updated household waste",
        requestedPickupDate: changedDate.toISOString(),
      }),
      routeContext(),
    );

    expect(response.status).toBe(200);

    expect(mocks.activityCreate).toHaveBeenCalledTimes(2);

    const activityTypes = mocks.activityCreate.mock.calls.map(
      ([argument]) => argument.data.type,
    );

    expect(activityTypes).toEqual([
      RequestActivityType.REQUEST_UPDATED,
      RequestActivityType.REQUEST_RESCHEDULED,
    ]);
  });

  it("TC-RES-UPDATE-04: returns no changes when submitted details are unchanged", async () => {
    const response = await PATCH(
      createRequest({}),
      routeContext(),
    );

    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.message).toBe("No changes were made");
    expect(mocks.transaction).not.toHaveBeenCalled();
    expect(mocks.activityCreate).not.toHaveBeenCalled();
  });

  it("TC-RES-UPDATE-05: returns 401 when unauthenticated", async () => {
    mocks.verifyAuth.mockResolvedValue(null);

    const response = await PATCH(
      createRequest({ quantity: 3 }),
      routeContext(),
    );

    expect(response.status).toBe(401);
    expect(mocks.findFirst).not.toHaveBeenCalled();
  });

  it("TC-RES-UPDATE-06: returns 403 for an Admin", async () => {
    mocks.verifyAuth.mockResolvedValue({
      id: "admin-001",
      role: "ADMIN",
    });

    const response = await PATCH(
      createRequest({ quantity: 3 }),
      routeContext(),
    );

    expect(response.status).toBe(403);
    expect(mocks.findFirst).not.toHaveBeenCalled();
  });

  it("TC-RES-UPDATE-07: returns 400 for missing request ID", async () => {
    const response = await PATCH(
      createRequest({ quantity: 3 }),
      routeContext(""),
    );

    expect(response.status).toBe(400);
    expect(mocks.findFirst).not.toHaveBeenCalled();
  });

  it("TC-RES-UPDATE-08: returns 400 for malformed JSON", async () => {
    const request = new NextRequest(
      `http://localhost:3000/api/user/requests/${requestId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: "{invalid-json",
      },
    );

    const response = await PATCH(request, routeContext());

    expect(response.status).toBe(400);
    expect(mocks.findFirst).not.toHaveBeenCalled();
  });

  it("TC-RES-UPDATE-09: returns 404 for a missing or unowned request", async () => {
    mocks.findFirst.mockResolvedValue(null);

    const response = await PATCH(
      createRequest({ quantity: 3 }),
      routeContext(),
    );

    expect(response.status).toBe(404);

    expect(mocks.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: requestId,
          userId: residentId,
        },
      }),
    );
  });

  it("TC-RES-UPDATE-10: prevents editing non-pending requests", async () => {
    mocks.findFirst.mockResolvedValue({
      ...existingRequest(),
      status: WasteRequestStatus.APPROVED,
    });

    const response = await PATCH(
      createRequest({ quantity: 3 }),
      routeContext(),
    );

    expect(response.status).toBe(409);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("TC-RES-UPDATE-11: rejects invalid quantities", async () => {
    for (const quantity of [0, -1, 1.5]) {
      const response = await PATCH(
        createRequest({ quantity }),
        routeContext(),
      );

      expect(response.status).toBe(400);
    }

    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("TC-RES-UPDATE-12: rejects an invalid quantity unit", async () => {
    const response = await PATCH(
      createRequest({ quantityUnit: "INVALID_UNIT" }),
      routeContext(),
    );

    expect(response.status).toBe(400);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("TC-RES-UPDATE-13: rejects an invalid pickup date", async () => {
    const response = await PATCH(
      createRequest({ requestedPickupDate: "not-a-date" }),
      routeContext(),
    );

    expect(response.status).toBe(400);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("TC-RES-UPDATE-14: rejects a past pickup date", async () => {
    const response = await PATCH(
      createRequest({
        requestedPickupDate: "2020-01-01T10:00:00Z",
      }),
      routeContext(),
    );

    expect(response.status).toBe(400);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("TC-RES-UPDATE-15: rejects descriptions longer than 500 characters", async () => {
    const response = await PATCH(
      createRequest({ description: "A".repeat(501) }),
      routeContext(),
    );

    expect(response.status).toBe(400);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("TC-RES-UPDATE-16: returns 404 for an unknown waste type", async () => {
    mocks.wasteTypeFindUnique.mockResolvedValue(null);

    const response = await PATCH(
      createRequest({ quantity: 3 }),
      routeContext(),
    );

    expect(response.status).toBe(404);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("TC-RES-UPDATE-17: rejects an inactive waste type", async () => {
    mocks.wasteTypeFindUnique.mockResolvedValue({
      id: wasteTypeId,
      name: "Household Waste",
      status: "INACTIVE",
      price: 1000,
    });

    const response = await PATCH(
      createRequest({ quantity: 3 }),
      routeContext(),
    );

    expect(response.status).toBe(400);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("TC-RES-UPDATE-18: prevents using another Resident's address", async () => {
    mocks.addressFindFirst.mockResolvedValue(null);

    const response = await PATCH(
      createRequest({ addressId: "other-address" }),
      routeContext(),
    );

    expect(response.status).toBe(404);

    expect(mocks.addressFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "other-address",
          userId: residentId,
        },
      }),
    );

    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("TC-RES-UPDATE-19: updates the pickup address snapshot", async () => {
    mocks.addressFindFirst.mockResolvedValue({
      id: "address-002",
      label: "Office",
      street: "50 New Street",
      city: "Birmingham",
      state: "West Midlands",
      postalCode: "B1 1AA",
      country: "United Kingdom",
    });

    const response = await PATCH(
      createRequest({ addressId: "address-002" }),
      routeContext(),
    );

    expect(response.status).toBe(200);

    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          addressId: "address-002",
          pickupStreet: "50 New Street",
          pickupCity: "Birmingham",
          pickupPostalCode: "B1 1AA",
        }),
      }),
    );
  });

  it("TC-RES-UPDATE-20: returns 500 for unexpected database failure", async () => {
    mocks.transaction.mockRejectedValue(
      new Error("Simulated transaction failure"),
    );

    const consoleSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    try {
      const response = await PATCH(
        createRequest({ quantity: 3 }),
        routeContext(),
      );

      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.error).toBe(
        "Unable to update the pickup request",
      );
    } finally {
      consoleSpy.mockRestore();
    }
  });

  it("TC-RES-UPDATE-21: handles Prisma foreign key errors", async () => {
    // Prisma P2003 is a known foreign key constraint error.
    const { Prisma } = await import("@prisma/client");

    const error = new Prisma.PrismaClientKnownRequestError(
      "Foreign key constraint failed",
      {
        code: "P2003",
        clientVersion: "6.19.0",
      },
    );

    mocks.transaction.mockRejectedValue(error);

    const consoleSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    try {
      const response = await PATCH(
        createRequest({ quantity: 3 }),
        routeContext(),
      );

      expect(response.status).toBe(400);
    } finally {
      consoleSpy.mockRestore();
    }
  });

  it("TC-RES-UPDATE-22: rejects a null JSON request body", async () => {
    const consoleSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    try {
      const response = await PATCH(
        createRequest(null),
        routeContext(),
      );

      // Expected validation behaviour: malformed input is a client error.
      expect(response.status).toBe(400);
      expect(mocks.update).not.toHaveBeenCalled();
    } finally {
      consoleSpy.mockRestore();
    }
  });
});

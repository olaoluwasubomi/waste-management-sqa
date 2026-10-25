
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  RequestActivityType,
  Role,
  WasteRequestStatus,
} from "@prisma/client";

const mocks = vi.hoisted(() => ({
  verifyAuth: vi.fn(),
  findRequest: vi.fn(),
  findCollector: vi.fn(),
  updateMany: vi.fn(),
  findUniqueOrThrow: vi.fn(),
  createActivity: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("@/lib/verifyAuth", () => ({
  verifyAuth: mocks.verifyAuth,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    wasteRequest: {
      findUnique: mocks.findRequest,
    },
    user: {
      findFirst: mocks.findCollector,
    },
    $transaction: mocks.transaction,
  },
}));

import { PATCH } from "@/app/api/admin/get-requests/[id]/assign/route";

describe("PATCH /api/admin/get-requests/[id]/assign - Unit Tests", () => {
  const createRequest = (
    body: unknown = { collectorId: "collector-001" },
  ) =>
    new NextRequest(
      "http://localhost:3000/api/admin/get-requests/request-001/assign",
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );

  const createContext = (id = "request-001") => ({
    params: Promise.resolve({ id }),
  });

  const existingRequest = (
    status: WasteRequestStatus = WasteRequestStatus.APPROVED,
  ) => ({
    id: "request-001",
    reference: "WR-001",
    status,
    collectorId: null,
  });

  const collector = () => ({
    id: "collector-001",
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    phone: "07000000000",
    image: null,
    collectorProfile: {
      zone: "Central",
      isActive: true,
      vehicleRegistration: "ABC-123",
    },
  });

  const assignedRequest = () => ({
    id: "request-001",
    reference: "WR-001",
    status: WasteRequestStatus.ASSIGNED,
    assignedAt: new Date("2026-10-18T10:00:00.000Z"),
    updatedAt: new Date("2026-10-18T10:00:00.000Z"),
    collector: collector(),
  });

  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});

    mocks.verifyAuth.mockResolvedValue({
      id: "admin-001",
      role: Role.ADMIN,
    });

    mocks.findRequest.mockResolvedValue(existingRequest());
    mocks.findCollector.mockResolvedValue(collector());
    mocks.updateMany.mockResolvedValue({ count: 1 });
    mocks.findUniqueOrThrow.mockResolvedValue(assignedRequest());
    mocks.createActivity.mockResolvedValue({ id: "activity-001" });

    mocks.transaction.mockImplementation(
    async (
        callback: (transaction: {
        wasteRequest: {
            updateMany: typeof mocks.updateMany;
            findUniqueOrThrow: typeof mocks.findUniqueOrThrow;
        };
        wasteRequestActivity: {
            create: typeof mocks.createActivity;
        };
        }) => Promise<unknown>,
    ) =>
        callback({
        wasteRequest: {
            updateMany: mocks.updateMany,
            findUniqueOrThrow: mocks.findUniqueOrThrow,
        },
        wasteRequestActivity: {
            create: mocks.createActivity,
        },
        }),
    );
  });

  it("TC-ADM-ASG-01: assigns an active collector successfully", async () => {
    const response = await PATCH(createRequest(), createContext());
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.success).toBe(true);
    expect(result.message).toBe("Collector assigned successfully");
    expect(result.request.status).toBe(WasteRequestStatus.ASSIGNED);
  });

  it("TC-ADM-ASG-02: rejects unauthenticated users", async () => {
    mocks.verifyAuth.mockResolvedValue(null);

    const response = await PATCH(createRequest(), createContext());

    expect(response.status).toBe(401);
    expect(mocks.findRequest).not.toHaveBeenCalled();
  });

  it("TC-ADM-ASG-03: rejects non-admin users", async () => {
    mocks.verifyAuth.mockResolvedValue({
      id: "resident-001",
      role: Role.USER,
    });

    const response = await PATCH(createRequest(), createContext());

    expect(response.status).toBe(403);
    expect(mocks.findRequest).not.toHaveBeenCalled();
  });

  it("TC-ADM-ASG-04: rejects an empty request ID", async () => {
    const response = await PATCH(createRequest(), createContext(""));

    expect(response.status).toBe(400);
  });

  it("TC-ADM-ASG-05: rejects a whitespace-only request ID", async () => {
    const response = await PATCH(createRequest(), createContext("   "));

    expect(response.status).toBe(400);
  });

  it("TC-ADM-ASG-06: rejects malformed JSON", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/admin/get-requests/request-001/assign",
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: "{invalid-json",
      },
    );

    const response = await PATCH(request, createContext());

    expect(response.status).toBe(400);
  });

  it("TC-ADM-ASG-07: rejects a missing collector ID", async () => {
    const response = await PATCH(createRequest({}), createContext());
    const result = await response.json();

    expect(response.status).toBe(400);
    expect(result.field).toBe("collectorId");
  });

  it("TC-ADM-ASG-08: rejects a whitespace-only collector ID", async () => {
    const response = await PATCH(
      createRequest({ collectorId: "   " }),
      createContext(),
    );

    expect(response.status).toBe(400);
  });

  it("TC-ADM-ASG-09: returns 404 for a nonexistent request", async () => {
    mocks.findRequest.mockResolvedValue(null);

    const response = await PATCH(createRequest(), createContext());

    expect(response.status).toBe(404);
    expect(mocks.findCollector).not.toHaveBeenCalled();
  });

  const invalidStatuses = [
    {
      id: "TC-ADM-ASG-10",
      status: WasteRequestStatus.PENDING,
    },
    {
      id: "TC-ADM-ASG-11",
      status: WasteRequestStatus.ASSIGNED,
    },
    {
      id: "TC-ADM-ASG-12",
      status: WasteRequestStatus.COMPLETED,
    },
  ];

  for (const testCase of invalidStatuses) {
    it(`${testCase.id}: rejects requests with ${testCase.status} status`, async () => {
      mocks.findRequest.mockResolvedValue(
        existingRequest(testCase.status),
      );

      const response = await PATCH(createRequest(), createContext());

      expect(response.status).toBe(409);
      expect(mocks.transaction).not.toHaveBeenCalled();
    });
  }

  it("TC-ADM-ASG-13: rejects a nonexistent collector", async () => {
    mocks.findCollector.mockResolvedValue(null);

    const response = await PATCH(createRequest(), createContext());

    expect(response.status).toBe(404);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("TC-ADM-ASG-14: rejects an inactive collector", async () => {
   
    mocks.findCollector.mockResolvedValue(null);

    const response = await PATCH(createRequest(), createContext());

    expect(response.status).toBe(404);
  });

  it("TC-ADM-ASG-15: queries only active users with the collector role", async () => {
    await PATCH(createRequest(), createContext());

    expect(mocks.findCollector).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "collector-001",
          role: Role.COLLECTOR,
          collectorProfile: {
            is: {
              isActive: true,
            },
          },
        },
      }),
    );
  });

    it("TC-ADM-ASG-16: atomically updates collector, status and assignment timestamp", async () => {
    await PATCH(createRequest(), createContext());

    expect(mocks.updateMany).toHaveBeenCalledWith({
        where: {
        id: "request-001",
        status: WasteRequestStatus.APPROVED,
        },
        data: {
        collectorId: "collector-001",
        status: WasteRequestStatus.ASSIGNED,
        assignedAt: expect.any(Date),
        },
    });
    }); 

  it("TC-ADM-ASG-17: creates an assignment activity linked to the admin", async () => {
    await PATCH(createRequest(), createContext());

    expect(mocks.createActivity).toHaveBeenCalledWith({
      data: {
        wasteRequestId: "request-001",
        createdById: "admin-001",
        type: RequestActivityType.COLLECTOR_ASSIGNED,
        status: WasteRequestStatus.ASSIGNED,
        title: "Collector assigned",
        description:
          "John Doe was assigned to this pickup request.",
      },
    });
  });

  it("TC-ADM-ASG-18: returns the collector's full name", async () => {
    const response = await PATCH(createRequest(), createContext());
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.request.collector.fullName).toBe("John Doe");
  });

  it("TC-ADM-ASG-19: returns 500 when the request lookup fails", async () => {
    mocks.findRequest.mockRejectedValue(new Error("Database unavailable"));

    const response = await PATCH(createRequest(), createContext());

    expect(response.status).toBe(500);
  });

  it("TC-ADM-ASG-20: returns 500 when the transaction fails", async () => {
    mocks.transaction.mockRejectedValue(
      new Error("Transaction failed"),
    );

    const response = await PATCH(createRequest(), createContext());

    expect(response.status).toBe(500);
  });

  it("TC-ADM-ASG-21: rejects a null JSON body with HTTP 400", async () => {
    const response = await PATCH(createRequest(null), createContext());

    expect(response.status).toBe(400);
  });

  it("TC-ADM-ASG-22: rejects a numeric collector ID with HTTP 400", async () => {
    const response = await PATCH(
      createRequest({ collectorId: 123 }),
      createContext(),
    );

    expect(response.status).toBe(400);
  });


  it("TC-ADM-ASG-23: prevents assignment when another operation has already changed the status", async () => {
  mocks.updateMany.mockResolvedValue({ count: 0 });

  const response = await PATCH(
    createRequest(),
    createContext(),
  );

  const result = await response.json();

  expect(response.status).toBe(409);
  expect(result.success).toBe(false);

  expect(mocks.createActivity).not.toHaveBeenCalled();
  expect(mocks.findUniqueOrThrow).not.toHaveBeenCalled();
});
});

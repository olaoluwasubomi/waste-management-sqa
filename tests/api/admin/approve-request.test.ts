
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  RequestActivityType,
  WasteRequestStatus,
} from "@prisma/client";


const mocks = vi.hoisted(() => ({
  verifyAuth: vi.fn(),
  findUnique: vi.fn(),
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
      findUnique: mocks.findUnique,
    },
    $transaction: mocks.transaction,
  },
}));

import { PATCH } from "@/app/api/admin/get-requests/[id]/approve/route";

describe("PATCH /api/admin/get-requests/[id]/approve - Unit Tests", () => {
  const createRequest = () =>
    new NextRequest(
      "http://localhost:3000/api/admin/get-requests/request-001/approve",
      { method: "PATCH" },
    );

  const createContext = (id = "request-001") => ({
    params: Promise.resolve({ id }),
  });

  const existingRequest = (
    status: WasteRequestStatus = WasteRequestStatus.PENDING,
  ) => ({
    id: "request-001",
    reference: "WR-001",
    status,
    approvedAt: null,
    canceledAt: null,
    rejectedAt: null,
  });

  const approvedRequest = () => ({
    id: "request-001",
    reference: "WR-001",
    status: WasteRequestStatus.APPROVED,
    approvedAt: new Date("2026-10-18T10:00:00.000Z"),
    updatedAt: new Date("2026-10-18T10:00:00.000Z"),
  });

  beforeEach(() => {
    vi.resetAllMocks();

    mocks.verifyAuth.mockResolvedValue({
      id: "admin-001",
      role: "ADMIN",
    });

    mocks.findUnique.mockResolvedValue(existingRequest());

    mocks.updateMany.mockResolvedValue({ count: 1 });
    mocks.findUniqueOrThrow.mockResolvedValue(approvedRequest());
    mocks.createActivity.mockResolvedValue({
      id: "activity-001",
    });


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

  it("TC-ADM-APP-01: approves a pending request successfully", async () => {
    const response = await PATCH(createRequest(), createContext());
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.success).toBe(true);
    expect(result.message).toBe(
      "Pickup request approved successfully",
    );
    expect(result.request.status).toBe("APPROVED");
  });

  it("TC-ADM-APP-02: returns 401 for an unauthenticated user", async () => {
    mocks.verifyAuth.mockResolvedValue(null);

    const response = await PATCH(createRequest(), createContext());
    const result = await response.json();

    expect(response.status).toBe(401);
    expect(result.error).toBe("Unauthorized");
    expect(mocks.findUnique).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("TC-ADM-APP-03: returns 403 when a Resident attempts approval", async () => {
    mocks.verifyAuth.mockResolvedValue({
      id: "resident-001",
      role: "USER",
    });

    const response = await PATCH(createRequest(), createContext());
    const result = await response.json();

    expect(response.status).toBe(403);
    expect(result.error).toBe(
      "Only administrators can approve pickup requests",
    );
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });

  it("TC-ADM-APP-04: returns 400 when request ID is empty", async () => {
    const response = await PATCH(createRequest(), createContext(""));
    const result = await response.json();

    expect(response.status).toBe(400);
    expect(result.error).toBe("Request ID is required");
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });

  it("TC-ADM-APP-05: returns 400 for whitespace-only request ID", async () => {
    const response = await PATCH(
      createRequest(),
      createContext("   "),
    );
    const result = await response.json();

    expect(response.status).toBe(400);
    expect(result.error).toBe("Request ID is required");
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });

  it("TC-ADM-APP-06: returns 404 when the request does not exist", async () => {
    mocks.findUnique.mockResolvedValue(null);

    const response = await PATCH(createRequest(), createContext());
    const result = await response.json();

    expect(response.status).toBe(404);
    expect(result.error).toBe("Pickup request not found");
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("TC-ADM-APP-07: returns 409 for an already approved request", async () => {
    mocks.findUnique.mockResolvedValue(
      existingRequest(WasteRequestStatus.APPROVED),
    );

    const response = await PATCH(createRequest(), createContext());
    const result = await response.json();

    expect(response.status).toBe(409);
    expect(result.error).toBe(
      "This pickup request has already been approved",
    );
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("TC-ADM-APP-08: rejects approval of a cancelled request", async () => {
    mocks.findUnique.mockResolvedValue(
      existingRequest(WasteRequestStatus.CANCELED),
    );

    const response = await PATCH(createRequest(), createContext());
    const result = await response.json();

    expect(response.status).toBe(400);
    expect(result.error).toBe(
      "A cancelled pickup request cannot be approved",
    );
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("TC-ADM-APP-09: rejects approval of a rejected request", async () => {
    mocks.findUnique.mockResolvedValue(
      existingRequest(WasteRequestStatus.REJECTED),
    );

    const response = await PATCH(createRequest(), createContext());
    const result = await response.json();

    expect(response.status).toBe(400);
    expect(result.error).toBe(
      "A rejected pickup request cannot be approved",
    );
  });

  it("TC-ADM-APP-10: rejects approval of an assigned request", async () => {
    mocks.findUnique.mockResolvedValue(
      existingRequest(WasteRequestStatus.ASSIGNED),
    );

    const response = await PATCH(createRequest(), createContext());
    const result = await response.json();

    expect(response.status).toBe(400);
    expect(result.error).toBe(
      "Only pending pickup requests can be approved",
    );
  });

  it("TC-ADM-APP-11: rejects approval of an in-progress request", async () => {
    mocks.findUnique.mockResolvedValue(
      existingRequest(WasteRequestStatus.IN_PROGRESS),
    );

    const response = await PATCH(createRequest(), createContext());
    const result = await response.json();

    expect(response.status).toBe(400);
    expect(result.error).toBe(
      "Only pending pickup requests can be approved",
    );
  });

  it("TC-ADM-APP-12: rejects approval of a completed request", async () => {
    mocks.findUnique.mockResolvedValue(
      existingRequest(WasteRequestStatus.COMPLETED),
    );

    const response = await PATCH(createRequest(), createContext());
    const result = await response.json();

    expect(response.status).toBe(400);
    expect(result.error).toBe(
      "Only pending pickup requests can be approved",
    );
  });


  it("TC-ADM-APP-13: conditionally updates status and approval timestamp", async () => {
    const response = await PATCH(createRequest(), createContext());

    expect(response.status).toBe(200);

    expect(mocks.updateMany).toHaveBeenCalledWith({
        where: {
        id: "request-001",
        status: WasteRequestStatus.PENDING,
        },
        data: {
        status: WasteRequestStatus.APPROVED,
        approvedAt: expect.any(Date),
        },
    });

    expect(mocks.updateMany).toHaveBeenCalledTimes(1);
    expect(mocks.findUniqueOrThrow).toHaveBeenCalledTimes(1);
    expect(mocks.transaction).toHaveBeenCalledTimes(1);
 });


  it("TC-ADM-APP-14: creates an approval activity record", async () => {
    const response = await PATCH(createRequest(), createContext());

    expect(response.status).toBe(200);

    expect(mocks.createActivity).toHaveBeenCalledWith({
      data: {
        wasteRequestId: "request-001",
        createdById: "admin-001",
        type: RequestActivityType.REQUEST_APPROVED,
        status: WasteRequestStatus.APPROVED,
        title: "Pickup request approved",
        description:
          "The pickup request was reviewed and approved by an administrator.",
      },
    });

    expect(mocks.createActivity).toHaveBeenCalledTimes(1);
  });

  it("TC-ADM-APP-15: returns 500 when the database lookup fails", async () => {
    mocks.findUnique.mockRejectedValue(
      new Error("Simulated database lookup failure"),
    );

    const response = await PATCH(createRequest(), createContext());
    const result = await response.json();

    expect(response.status).toBe(500);
    expect(result.success).toBe(false);
    expect(result.error).toBe(
      "Unable to approve the pickup request",
    );
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("TC-ADM-APP-16: returns 500 when the transaction fails", async () => {
    mocks.transaction.mockRejectedValue(
      new Error("Simulated transaction failure"),
    );

    const response = await PATCH(createRequest(), createContext());
    const result = await response.json();

    expect(response.status).toBe(500);
    expect(result.success).toBe(false);
    expect(result.error).toBe(
      "Unable to approve the pickup request",
    );
  });

  it("TC-ADM-APP-17: returns 500 when activity creation fails", async () => {
    mocks.createActivity.mockRejectedValue(
      new Error("Simulated activity creation failure"),
    );

    const response = await PATCH(createRequest(), createContext());
    const result = await response.json();

    expect(response.status).toBe(500);
    expect(result.success).toBe(false);
    expect(result.error).toBe(
      "Unable to approve the pickup request",
    );
   expect(mocks.updateMany).toHaveBeenCalledTimes(1);
    expect(mocks.createActivity).toHaveBeenCalledTimes(1);
  });

  it("TC-ADM-APP-18: does not create an activity when the update fails", async () => {
    mocks.updateMany.mockRejectedValue(
    new Error("Simulated update failure"),
    );

    const response = await PATCH(createRequest(), createContext());
    const result = await response.json();

    expect(response.status).toBe(500);
    expect(mocks.createActivity).not.toHaveBeenCalled();
  });



    it("TC-ADM-APP-19: prevents duplicate approval when status changes concurrently", async () => {
    // Another transaction has already approved the request.
    mocks.updateMany.mockResolvedValue({ count: 0 });

    const response = await PATCH(createRequest(), createContext());
    const result = await response.json();

    expect(response.status).toBe(409);
    expect(result.success).toBe(false);
    expect(result.error).toBe(
        "This pickup request has already been approved",
    );

    expect(mocks.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
        where: {
            id: "request-001",
            status: WasteRequestStatus.PENDING,
        },
        }),
    );

    expect(mocks.createActivity).not.toHaveBeenCalled();
    expect(mocks.findUniqueOrThrow).not.toHaveBeenCalled();
    });

});

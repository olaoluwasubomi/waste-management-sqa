
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  RequestActivityType,
  WasteRequestStatus,
} from "@prisma/client";

// Mock authentication and Prisma operations.
const mocks = vi.hoisted(() => ({
  verifyAuth: vi.fn(),
  findFirst: vi.fn(),
  update: vi.fn(),
  activityCreate: vi.fn(),
}));

vi.mock("@/lib/verifyAuth", () => ({
  verifyAuth: mocks.verifyAuth,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    wasteRequest: {
      findFirst: mocks.findFirst,
    },
    $transaction: vi.fn(
      async (callback: (transaction: unknown) => Promise<unknown>) =>
        callback({
          wasteRequest: {
            update: mocks.update,
          },
          wasteRequestActivity: {
            create: mocks.activityCreate,
          },
        }),
    ),
  },
}));

import { PATCH } from "@/app/api/user/requests/[id]/cancel/route";

describe("Resident waste request cancellation unit tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("TC-RES-CANCEL-01: cancels a PENDING request successfully", async () => {
    const residentId = "resident-001";
    const requestId = "waste-request-001";

    // Simulate an authenticated Resident.
    mocks.verifyAuth.mockResolvedValue({
      id: residentId,
      role: "USER",
    });

    // Simulate a PENDING request belonging to the Resident.
    mocks.findFirst.mockResolvedValue({
      id: requestId,
      reference: "WR-001",
      status: WasteRequestStatus.PENDING,
      canceledAt: null,
    });

    // Simulate the updated request returned by Prisma.
    mocks.update.mockResolvedValue({
      id: requestId,
      reference: "WR-001",
      status: WasteRequestStatus.CANCELED,
      cancellationReason: "No longer required",
      canceledAt: new Date(),
      updatedAt: new Date(),
    });

    // Simulate successful activity creation.
    mocks.activityCreate.mockResolvedValue({
      id: "activity-001",
    });

    const request = new NextRequest(
      `http://localhost:3000/api/user/requests/${requestId}/cancel`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reason: "No longer required",
        }),
      },
    );

    // Next.js dynamic route parameters are asynchronous.
    const context = {
      params: Promise.resolve({
        id: requestId,
      }),
    };

    const response = await PATCH(request, context);
    const result = await response.json();

    // Verify the HTTP response.
    expect(response.status).toBe(200);
    expect(result.success).toBe(true);
    expect(result.message).toBe(
      "Pickup request cancelled successfully",
    );

    // Verify the request's updated status.
    expect(result.request.status).toBe(
      WasteRequestStatus.CANCELED,
    );

    expect(result.request.cancellationReason).toBe(
      "No longer required",
    );

    // Verify ownership was checked.
    expect(mocks.findFirst).toHaveBeenCalledWith({
      where: {
        id: requestId,
        userId: residentId,
      },
      select: {
        id: true,
        reference: true,
        status: true,
        canceledAt: true,
      },
    });

    // Verify the cancellation update.
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: requestId,
        },
        data: expect.objectContaining({
          status: WasteRequestStatus.CANCELED,
          cancellationReason: "No longer required",
          canceledAt: expect.any(Date),
        }),
      }),
    );

    // Verify a cancellation activity was created.
    expect(mocks.activityCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          wasteRequestId: requestId,
          createdById: residentId,
          type: RequestActivityType.REQUEST_CANCELED,
          status: WasteRequestStatus.CANCELED,
          title: "Pickup request cancelled",
        }),
      }),
    );
  });


it("TC-RES-CANCEL-02: cancels an APPROVED request successfully", async () => {
  const residentId = "resident-001";
  const requestId = "waste-request-002";

  mocks.verifyAuth.mockResolvedValue({
    id: residentId,
    role: "USER",
  });

  // Simulate an APPROVED request owned by the Resident.
  mocks.findFirst.mockResolvedValue({
    id: requestId,
    reference: "WR-002",
    status: WasteRequestStatus.APPROVED,
    canceledAt: null,
  });

  mocks.update.mockResolvedValue({
    id: requestId,
    reference: "WR-002",
    status: WasteRequestStatus.CANCELED,
    cancellationReason: "Pickup no longer needed",
    canceledAt: new Date(),
    updatedAt: new Date(),
  });

  mocks.activityCreate.mockResolvedValue({
    id: "activity-002",
  });

  const request = new NextRequest(
    `http://localhost:3000/api/user/requests/${requestId}/cancel`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reason: "Pickup no longer needed",
      }),
    },
  );

  const context = {
    params: Promise.resolve({
      id: requestId,
    }),
  };

  const response = await PATCH(request, context);
  const result = await response.json();

  // Verify successful cancellation.
  expect(response.status).toBe(200);
  expect(result.success).toBe(true);
  expect(result.request.status).toBe(
    WasteRequestStatus.CANCELED,
  );

  // Verify the original request was checked for ownership.
  expect(mocks.findFirst).toHaveBeenCalledWith(
    expect.objectContaining({
      where: {
        id: requestId,
        userId: residentId,
      },
    }),
  );

  // Verify the cancellation update.
  expect(mocks.update).toHaveBeenCalledWith(
    expect.objectContaining({
      where: {
        id: requestId,
      },
      data: expect.objectContaining({
        status: WasteRequestStatus.CANCELED,
        cancellationReason: "Pickup no longer needed",
        canceledAt: expect.any(Date),
      }),
    }),
  );

  // Verify the cancellation activity was created.
  expect(mocks.activityCreate).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({
        wasteRequestId: requestId,
        createdById: residentId,
        type: RequestActivityType.REQUEST_CANCELED,
        status: WasteRequestStatus.CANCELED,
      }),
    }),
  );
});


it("TC-RES-CANCEL-03: rejects unauthenticated cancellation requests", async () => {
  const requestId = "waste-request-003";

  // Simulate an unauthenticated user.
  mocks.verifyAuth.mockResolvedValue(null);

  const request = new NextRequest(
    `http://localhost:3000/api/user/requests/${requestId}/cancel`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reason: "No longer required",
      }),
    },
  );

  const context = {
    params: Promise.resolve({
      id: requestId,
    }),
  };

  // Execute the cancellation API handler.
  const response = await PATCH(request, context);
  const result = await response.json();

  // Verify that unauthenticated access is rejected.
  expect(response.status).toBe(401);
  expect(result.success).toBe(false);
  expect(result.error).toBe("Unauthorized");

  // Verify that authentication was checked.
  expect(mocks.verifyAuth).toHaveBeenCalledOnce();

  // Verify that no database lookup or modification occurred.
  expect(mocks.findFirst).not.toHaveBeenCalled();
  expect(mocks.update).not.toHaveBeenCalled();
  expect(mocks.activityCreate).not.toHaveBeenCalled();
});



it("TC-RES-CANCEL-04: rejects Administrator cancellation requests", async () => {
  const requestId = "waste-request-004";

  // Simulate an authenticated Administrator.
  mocks.verifyAuth.mockResolvedValue({
    id: "admin-001",
    role: "ADMIN",
  });

  const request = new NextRequest(
    `http://localhost:3000/api/user/requests/${requestId}/cancel`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reason: "Cancel this request",
      }),
    },
  );

  const context = {
    params: Promise.resolve({
      id: requestId,
    }),
  };

  // Execute the actual cancellation API handler.
  const response = await PATCH(request, context);
  const result = await response.json();

  // Verify that Administrator access is rejected.
  expect(response.status).toBe(403);
  expect(result.success).toBe(false);
  expect(result.error).toBe(
    "Only residents can cancel pickup requests",
  );

  // Verify that authentication was checked.
  expect(mocks.verifyAuth).toHaveBeenCalledOnce();

  // Verify that no database operations were performed.
  expect(mocks.findFirst).not.toHaveBeenCalled();
  expect(mocks.update).not.toHaveBeenCalled();
  expect(mocks.activityCreate).not.toHaveBeenCalled();
});




it("TC-RES-CANCEL-05: rejects cancellation when the request ID is missing", async () => {
  // Simulate an authenticated Resident.
  mocks.verifyAuth.mockResolvedValue({
    id: "resident-001",
    role: "USER",
  });

  const request = new NextRequest(
    "http://localhost:3000/api/user/requests/placeholder/cancel",
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reason: "No longer required",
      }),
    },
  );

  // Simulate an empty dynamic route parameter.
  const context = {
    params: Promise.resolve({
      id: "",
    }),
  };

  const response = await PATCH(request, context);
  const result = await response.json();

  // Verify the validation response.
  expect(response.status).toBe(400);
  expect(result.success).toBe(false);
  expect(result.error).toBe("Request ID is required");

  // Verify that no database operations were performed.
  expect(mocks.findFirst).not.toHaveBeenCalled();
  expect(mocks.update).not.toHaveBeenCalled();
  expect(mocks.activityCreate).not.toHaveBeenCalled();
});



it("TC-RES-CANCEL-06: rejects cancellation reasons exceeding 500 characters", async () => {
  const requestId = "waste-request-006";

  // Simulate an authenticated Resident.
  mocks.verifyAuth.mockResolvedValue({
    id: "resident-001",
    role: "USER",
  });

  // Generate a cancellation reason containing 501 characters.
  const longReason = "A".repeat(501);

  const request = new NextRequest(
    `http://localhost:3000/api/user/requests/${requestId}/cancel`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reason: longReason,
      }),
    },
  );

  const context = {
    params: Promise.resolve({
      id: requestId,
    }),
  };

  // Execute the cancellation API handler.
  const response = await PATCH(request, context);
  const result = await response.json();

  // Verify that the reason exceeds the permitted limit.
  expect(longReason.length).toBe(501);

  // Verify the validation response.
  expect(response.status).toBe(400);
  expect(result.success).toBe(false);
  expect(result.error).toBe(
    "Cancellation reason cannot exceed 500 characters",
  );
  expect(result.field).toBe("reason");

  // Verify that invalid input does not trigger database operations.
  expect(mocks.findFirst).not.toHaveBeenCalled();
  expect(mocks.update).not.toHaveBeenCalled();
  expect(mocks.activityCreate).not.toHaveBeenCalled();
});



it("TC-RES-CANCEL-07: rejects cancellation of a request not owned by the Resident", async () => {
  const residentId = "resident-001";
  const requestId = "waste-request-007";

  // Simulate an authenticated Resident.
  mocks.verifyAuth.mockResolvedValue({
    id: residentId,
    role: "USER",
  });

  
  mocks.findFirst.mockResolvedValue(null);

  const request = new NextRequest(
    `http://localhost:3000/api/user/requests/${requestId}/cancel`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reason: "No longer required",
      }),
    },
  );

  const context = {
    params: Promise.resolve({
      id: requestId,
    }),
  };

  // Execute the cancellation API handler.
  const response = await PATCH(request, context);
  const result = await response.json();

  // Verify the HTTP response.
  expect(response.status).toBe(404);
  expect(result.success).toBe(false);
  expect(result.error).toBe("Pickup request not found");

  // Verify that the database lookup includes ownership.
  expect(mocks.findFirst).toHaveBeenCalledWith({
    where: {
      id: requestId,
      userId: residentId,
    },
    select: {
      id: true,
      reference: true,
      status: true,
      canceledAt: true,
    },
  });

  // Verify that no cancellation update or activity was created.
  expect(mocks.update).not.toHaveBeenCalled();
  expect(mocks.activityCreate).not.toHaveBeenCalled();
});


it("TC-RES-CANCEL-08: rejects cancellation of an already cancelled request", async () => {
  const residentId = "resident-001";
  const requestId = "waste-request-008";

  // Simulate an authenticated Resident.
  mocks.verifyAuth.mockResolvedValue({
    id: residentId,
    role: "USER",
  });

  // Simulate a request that has already been cancelled.
  mocks.findFirst.mockResolvedValue({
    id: requestId,
    reference: "WR-008",
    status: WasteRequestStatus.CANCELED,
    canceledAt: new Date("2026-10-15T10:00:00Z"),
  });

  const request = new NextRequest(
    `http://localhost:3000/api/user/requests/${requestId}/cancel`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reason: "Cancel again",
      }),
    },
  );

  const context = {
    params: Promise.resolve({
      id: requestId,
    }),
  };

  // Execute the cancellation API handler.
  const response = await PATCH(request, context);
  const result = await response.json();

  // Verify the conflict response.
  expect(response.status).toBe(409);
  expect(result.success).toBe(false);
  expect(result.error).toBe(
    "This pickup request has already been cancelled",
  );

  // Verify that the request was retrieved using its ID
  // and the authenticated Resident's ID.
  expect(mocks.findFirst).toHaveBeenCalledWith(
    expect.objectContaining({
      where: {
        id: requestId,
        userId: residentId,
      },
    }),
  );

  // Verify that the request is not updated again.
  expect(mocks.update).not.toHaveBeenCalled();

  // Verify that no duplicate cancellation activity is created.
  expect(mocks.activityCreate).not.toHaveBeenCalled();
});



it("TC-RES-CANCEL-09: rejects cancellation of a COMPLETED request", async () => {
  const residentId = "resident-001";
  const requestId = "waste-request-009";

  // Simulate an authenticated Resident.
  mocks.verifyAuth.mockResolvedValue({
    id: residentId,
    role: "USER",
  });

  // Simulate a completed waste collection request.
  mocks.findFirst.mockResolvedValue({
    id: requestId,
    reference: "WR-009",
    status: WasteRequestStatus.COMPLETED,
    canceledAt: null,
  });

  const request = new NextRequest(
    `http://localhost:3000/api/user/requests/${requestId}/cancel`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reason: "I want to cancel this request",
      }),
    },
  );

  const context = {
    params: Promise.resolve({
      id: requestId,
    }),
  };

  // Execute the cancellation API handler.
  const response = await PATCH(request, context);
  const result = await response.json();

  // Verify that the API rejects cancellation.
  expect(response.status).toBe(400);
  expect(result.success).toBe(false);
  expect(result.error).toBe(
    "A completed pickup request cannot be cancelled",
  );

  // Verify that the request was retrieved using
  // its ID and the authenticated Resident's ID.
  expect(mocks.findFirst).toHaveBeenCalledWith(
    expect.objectContaining({
      where: {
        id: requestId,
        userId: residentId,
      },
    }),
  );

  // Verify that no cancellation update occurred.
  expect(mocks.update).not.toHaveBeenCalled();

  // Verify that no cancellation activity was created.
  expect(mocks.activityCreate).not.toHaveBeenCalled();
});


it("TC-RES-CANCEL-10: rejects cancellation of a REJECTED request", async () => {
  const residentId = "resident-001";
  const requestId = "waste-request-010";

  // Simulate an authenticated Resident.
  mocks.verifyAuth.mockResolvedValue({
    id: residentId,
    role: "USER",
  });

  // Simulate a rejected waste collection request.
  mocks.findFirst.mockResolvedValue({
    id: requestId,
    reference: "WR-010",
    status: WasteRequestStatus.REJECTED,
    canceledAt: null,
  });

  const request = new NextRequest(
    `http://localhost:3000/api/user/requests/${requestId}/cancel`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reason: "I want to cancel this request",
      }),
    },
  );

  const context = {
    params: Promise.resolve({
      id: requestId,
    }),
  };

  // Execute the cancellation API handler.
  const response = await PATCH(request, context);
  const result = await response.json();

  // Verify that cancellation is rejected.
  expect(response.status).toBe(400);
  expect(result.success).toBe(false);
  expect(result.error).toBe(
    "A rejected pickup request cannot be cancelled",
  );

  // Verify that the request lookup checks ownership.
  expect(mocks.findFirst).toHaveBeenCalledWith(
    expect.objectContaining({
      where: {
        id: requestId,
        userId: residentId,
      },
    }),
  );

  // Verify that no database modifications were attempted.
  expect(mocks.update).not.toHaveBeenCalled();
  expect(mocks.activityCreate).not.toHaveBeenCalled();
});



it("TC-RES-CANCEL-11: rejects cancellation of an ASSIGNED request", async () => {
  const residentId = "resident-001";
  const requestId = "waste-request-011";

  // Simulate an authenticated Resident.
  mocks.verifyAuth.mockResolvedValue({
    id: residentId,
    role: "USER",
  });

  // Simulate a waste collection request assigned to a collector.
  mocks.findFirst.mockResolvedValue({
    id: requestId,
    reference: "WR-011",
    status: WasteRequestStatus.ASSIGNED,
    canceledAt: null,
  });

  const request = new NextRequest(
    `http://localhost:3000/api/user/requests/${requestId}/cancel`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reason: "I no longer need this collection",
      }),
    },
  );

  const context = {
    params: Promise.resolve({
      id: requestId,
    }),
  };

  // Execute the cancellation API handler.
  const response = await PATCH(request, context);
  const result = await response.json();

  // Verify that cancellation is rejected.
  expect(response.status).toBe(400);
  expect(result.success).toBe(false);
  expect(result.error).toBe(
    "This pickup request can no longer be cancelled because collection processing has started",
  );

  // Verify that the request lookup checks ownership.
  expect(mocks.findFirst).toHaveBeenCalledWith(
    expect.objectContaining({
      where: {
        id: requestId,
        userId: residentId,
      },
    }),
  );

  // Verify that no cancellation update occurred.
  expect(mocks.update).not.toHaveBeenCalled();

  // Verify that no cancellation activity was created.
  expect(mocks.activityCreate).not.toHaveBeenCalled();
});


it("TC-RES-CANCEL-12: rejects cancellation of an IN_PROGRESS request", async () => {
  const residentId = "resident-001";
  const requestId = "waste-request-012";

  // Simulate an authenticated Resident.
  mocks.verifyAuth.mockResolvedValue({
    id: residentId,
    role: "USER",
  });

  // Simulate a waste collection request already in progress.
  mocks.findFirst.mockResolvedValue({
    id: requestId,
    reference: "WR-012",
    status: WasteRequestStatus.IN_PROGRESS,
    canceledAt: null,
  });

  const request = new NextRequest(
    `http://localhost:3000/api/user/requests/${requestId}/cancel`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reason: "I want to cancel the collection",
      }),
    },
  );

  const context = {
    params: Promise.resolve({
      id: requestId,
    }),
  };

  // Execute the cancellation API handler.
  const response = await PATCH(request, context);
  const result = await response.json();

  // Verify that cancellation is rejected.
  expect(response.status).toBe(400);
  expect(result.success).toBe(false);
  expect(result.error).toBe(
    "This pickup request can no longer be cancelled because collection processing has started",
  );

  // Verify that the request lookup includes ownership.
  expect(mocks.findFirst).toHaveBeenCalledWith(
    expect.objectContaining({
      where: {
        id: requestId,
        userId: residentId,
      },
    }),
  );

  // Verify that no cancellation update occurred.
  expect(mocks.update).not.toHaveBeenCalled();

  // Verify that no cancellation activity was created.
  expect(mocks.activityCreate).not.toHaveBeenCalled();
});



it("TC-RES-CANCEL-13: cancels a request without providing a reason", async () => {
  const residentId = "resident-001";
  const requestId = "waste-request-013";

  // Simulate an authenticated Resident.
  mocks.verifyAuth.mockResolvedValue({
    id: residentId,
    role: "USER",
  });

  // Simulate a PENDING request belonging to the Resident.
  mocks.findFirst.mockResolvedValue({
    id: requestId,
    reference: "WR-013",
    status: WasteRequestStatus.PENDING,
    canceledAt: null,
  });

  // Simulate the updated request returned by Prisma.
  mocks.update.mockResolvedValue({
    id: requestId,
    reference: "WR-013",
    status: WasteRequestStatus.CANCELED,
    cancellationReason: null,
    canceledAt: new Date(),
    updatedAt: new Date(),
  });

  mocks.activityCreate.mockResolvedValue({
    id: "activity-013",
  });

  const request = new NextRequest(
    `http://localhost:3000/api/user/requests/${requestId}/cancel`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      // Empty JSON object: no cancellation reason supplied.
      body: JSON.stringify({}),
    },
  );

  const context = {
    params: Promise.resolve({
      id: requestId,
    }),
  };

  // Execute the cancellation API handler.
  const response = await PATCH(request, context);
  const result = await response.json();

  // Verify successful cancellation.
  expect(response.status).toBe(200);
  expect(result.success).toBe(true);
  expect(result.message).toBe(
    "Pickup request cancelled successfully",
  );

  // Verify the updated request.
  expect(result.request.status).toBe(
    WasteRequestStatus.CANCELED,
  );
  expect(result.request.cancellationReason).toBeNull();

  // Verify that the cancellation reason is stored as null.
  expect(mocks.update).toHaveBeenCalledWith(
    expect.objectContaining({
      where: {
        id: requestId,
      },
      data: expect.objectContaining({
        status: WasteRequestStatus.CANCELED,
        cancellationReason: null,
        canceledAt: expect.any(Date),
      }),
    }),
  );

  // Verify that the default activity description is used.
  expect(mocks.activityCreate).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({
        wasteRequestId: requestId,
        createdById: residentId,
        type: RequestActivityType.REQUEST_CANCELED,
        status: WasteRequestStatus.CANCELED,
        title: "Pickup request cancelled",
        description:
          "The pickup request was cancelled by the resident.",
      }),
    }),
  );
});



it("TC-RES-CANCEL-14: returns HTTP 500 when the cancellation transaction fails", async () => {
  const residentId = "resident-001";
  const requestId = "waste-request-014";

  // Simulate an authenticated Resident.
  mocks.verifyAuth.mockResolvedValue({
    id: residentId,
    role: "USER",
  });

  // Simulate an eligible PENDING request.
  mocks.findFirst.mockResolvedValue({
    id: requestId,
    reference: "WR-014",
    status: WasteRequestStatus.PENDING,
    canceledAt: null,
  });

  // Simulate a successful update inside the transaction.
  mocks.update.mockResolvedValue({
    id: requestId,
    reference: "WR-014",
    status: WasteRequestStatus.CANCELED,
    cancellationReason: "No longer required",
    canceledAt: new Date(),
    updatedAt: new Date(),
  });

  // Simulate a database failure when creating the activity.
  mocks.activityCreate.mockRejectedValue(
    new Error("Simulated database transaction failure"),
  );

  const request = new NextRequest(
    `http://localhost:3000/api/user/requests/${requestId}/cancel`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reason: "No longer required",
      }),
    },
  );

  const context = {
    params: Promise.resolve({
      id: requestId,
    }),
  };

  // Execute the cancellation API handler.
  const response = await PATCH(request, context);
  const result = await response.json();

  // Verify that the API returns an internal server error.
  expect(response.status).toBe(500);
  expect(result.success).toBe(false);
  expect(result.error).toBe(
    "Unable to cancel the pickup request",
  );

  // Verify that the request update was attempted.
  expect(mocks.update).toHaveBeenCalledWith(
    expect.objectContaining({
      where: {
        id: requestId,
      },
      data: expect.objectContaining({
        status: WasteRequestStatus.CANCELED,
      }),
    }),
  );

  // Verify that activity creation was attempted.
  expect(mocks.activityCreate).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({
        wasteRequestId: requestId,
        createdById: residentId,
        type: RequestActivityType.REQUEST_CANCELED,
      }),
    }),
  );
});





});

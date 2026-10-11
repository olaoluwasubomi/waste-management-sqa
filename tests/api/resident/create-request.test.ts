
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/user/newrequests/route";

// Mock authentication and database dependencies.
const mocks = vi.hoisted(() => ({
  verifyAuth: vi.fn(),
  wasteTypeFindUnique: vi.fn(),
  addressFindFirst: vi.fn(),
  requestFindUnique: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("@/lib/verifyAuth", () => ({
  verifyAuth: mocks.verifyAuth,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    wasteType: {
      findUnique: mocks.wasteTypeFindUnique,
    },
    address: {
      findFirst: mocks.addressFindFirst,
    },
    wasteRequest: {
      findUnique: mocks.requestFindUnique,
    },
    $transaction: mocks.transaction,
  },
}));

function createRequest(overrides = {}) {
  const body = {
    wasteTypeId: "waste-type-1",
    addressId: "address-1",
    quantity: 1,
    quantityUnit: "BAG",
    requestedPickupDate: "2099-12-20T10:00:00.000Z",
    description: "Household waste",
    ...overrides,
  };

  return new NextRequest(
    "http://localhost:3000/api/user/newrequests",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );
}

describe("Resident waste request API", () => {
  beforeEach(() => {
    vi.resetAllMocks();

    mocks.verifyAuth.mockResolvedValue({
      id: "resident-1",
      email: "resident@example.com",
      role: "USER",
    });
  });

  it("TC-RES-04A: rejects quantity zero", async () => {
    const response = await POST(
      createRequest({ quantity: 0 })
    );

    const result = await response.json();

    expect(response.status).toBe(400);
    expect(result.field).toBe("quantity");
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("TC-RES-04B: rejects negative quantity", async () => {
    const response = await POST(
      createRequest({ quantity: -1 })
    );

    const result = await response.json();

    expect(response.status).toBe(400);
    expect(result.field).toBe("quantity");
  });

  it("TC-RES-04C: rejects decimal quantity", async () => {
    const response = await POST(
      createRequest({ quantity: 1.5 })
    );

    expect(response.status).toBe(400);
  });

  it("TC-RES-09A: rejects a past pickup date", async () => {
    const response = await POST(
      createRequest({
        requestedPickupDate: "2020-01-01T10:00:00.000Z",
      })
    );

    const result = await response.json();

    expect(response.status).toBe(400);
    expect(result.field).toBe("requestedPickupDate");
  });

  it("TC-RES-12B: rejects descriptions over 500 characters", async () => {
    const response = await POST(
      createRequest({
        description: "A".repeat(501),
      })
    );

    const result = await response.json();

    expect(response.status).toBe(400);
    expect(result.field).toBe("description");
  });

  it("rejects unauthenticated users", async () => {
    mocks.verifyAuth.mockResolvedValue(null);

    const response = await POST(createRequest());

    expect(response.status).toBe(401);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("rejects Admin users creating resident requests", async () => {
    mocks.verifyAuth.mockResolvedValue({
      id: "admin-1",
      email: "admin@example.com",
      role: "ADMIN",
    });

    const response = await POST(createRequest());

    expect(response.status).toBe(403);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
});

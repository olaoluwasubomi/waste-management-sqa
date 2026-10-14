
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

  wasteRequestCreate: vi.fn(),
  wasteRequestActivityCreate: vi.fn(),
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

  it("TC-RES-AUTH-01:rejects unauthenticated users", async () => {
    mocks.verifyAuth.mockResolvedValue(null);

    const response = await POST(createRequest());

    expect(response.status).toBe(401);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("TC-RES-AUTH-02:rejects Admin users creating resident requests", async () => {
    mocks.verifyAuth.mockResolvedValue({
      id: "admin-1",
      email: "admin@example.com",
      role: "ADMIN",
    });

    const response = await POST(createRequest());

    expect(response.status).toBe(403);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  
  it("TC-RES-03: creates a valid waste request successfully", async () => {
    mocks.wasteTypeFindUnique.mockResolvedValue({
        id: "waste-type-1",
        name: "Household Waste",
        status: "ACTIVE",
        price: 1500,
    });

    mocks.addressFindFirst.mockResolvedValue({
        id: "address-1",
        userId: "resident-1",
        label: "Home",
        street: "10 Test Street",
        city: "Lagos",
        state: "Lagos",
        postalCode: "100001",
        country: "Nigeria",
    });

    mocks.requestFindUnique.mockResolvedValue(null);

    const createdRequest = {
        id: "request-1",
        reference: "WR-20991220-TEST1234",
        description: "Household waste",
        quantity: 1,
        quantityUnit: "BAG",
        requestedPickupDate: new Date("2099-12-20T10:00:00.000Z"),
        status: "PENDING",
        createdAt: new Date(),
        wasteType: {
            id: "waste-type-1",
            name: "Household Waste",
            price: 1500,
            imageUrl: null,
        },
        address: {
            id: "address-1",
            label: "Home",
            street: "10 Test Street",
            city: "Lagos",
            state: "Lagos",
            postalCode: "100001",
            country: "Nigeria",
        },
    };

    mocks.wasteRequestCreate.mockResolvedValue(createdRequest);

    mocks.wasteRequestActivityCreate.mockResolvedValue({
        id: "activity-1",
    });


    mocks.transaction.mockImplementation(async (callback) => {
        return callback({
            wasteRequest: {
            create: mocks.wasteRequestCreate,
        },
        wasteRequestActivity: {
            create: mocks.wasteRequestActivityCreate,
        },
    });
  });

    const response = await POST(createRequest());

    
    expect(response.status).toBe(201);

    expect(mocks.wasteRequestCreate).toHaveBeenCalledOnce();

    expect(mocks.wasteRequestCreate).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({
        userId: "resident-1",
        quantity: 1,
        status: "PENDING",
      }),
    })
    );

  
    expect(mocks.wasteRequestActivityCreate).toHaveBeenCalledOnce();

    expect(mocks.wasteRequestActivityCreate).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({
        wasteRequestId: "request-1",
        createdById: "resident-1",
        type: "REQUEST_CREATED",
        status: "PENDING",
      }),
    })
    );
});

it("TC-RES-05A: rejects a nonexistent waste type", async () => {

  mocks.wasteTypeFindUnique.mockResolvedValue(null);


  mocks.addressFindFirst.mockResolvedValue({
    id: "address-1",
    userId: "resident-1",
  });

  const response = await POST(createRequest());
  const result = await response.json();

  expect(response.status).toBe(404);
  expect(result.field).toBe("wasteTypeId");
  expect(mocks.transaction).not.toHaveBeenCalled();
});

it("TC-RES-05B: rejects an inactive waste type", async () => {
  // Simulate an existing but inactive waste type.
  mocks.wasteTypeFindUnique.mockResolvedValue({
    id: "waste-type-1",
    name: "Household Waste",
    status: "INACTIVE",
  });

  mocks.addressFindFirst.mockResolvedValue({
    id: "address-1",
    userId: "resident-1",
  });

  const response = await POST(createRequest());
  const result = await response.json();

  expect(response.status).toBe(400);
  expect(result.field).toBe("wasteTypeId");
  expect(mocks.transaction).not.toHaveBeenCalled();
});

it("TC-RES-06A: rejects a nonexistent address", async () => {
  // Simulate a valid, active waste type.
  mocks.wasteTypeFindUnique.mockResolvedValue({
    id: "waste-type-1",
    name: "Household Waste",
    status: "ACTIVE",
  });

  // Simulate an address that cannot be found.
  mocks.addressFindFirst.mockResolvedValue(null);

  const response = await POST(createRequest());
  const result = await response.json();

  expect(response.status).toBe(404);
  expect(result.field).toBe("addressId");
  expect(mocks.transaction).not.toHaveBeenCalled();
});

it("TC-RES-06B: rejects an address belonging to another resident", async () => {
  mocks.wasteTypeFindUnique.mockResolvedValue({
    id: "waste-type-1",
    name: "Household Waste",
    status: "ACTIVE",
  });

  // The database returns no matching address because
  // the requested address is not owned by resident-1.
  mocks.addressFindFirst.mockResolvedValue(null);

  const response = await POST(
    createRequest({ addressId: "address-2" })
  );

  const result = await response.json();

  expect(response.status).toBe(404);
  expect(result.field).toBe("addressId");

  // Verify that the database lookup includes ownership.
  expect(mocks.addressFindFirst).toHaveBeenCalledWith(
    expect.objectContaining({
      where: {
        id: "address-2",
        userId: "resident-1",
      },
    })
  );

  // No waste request should be created.
  expect(mocks.transaction).not.toHaveBeenCalled();
});

});

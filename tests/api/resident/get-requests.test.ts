
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

// Mock authentication and Prisma before importing the route.
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

import { GET } from "@/app/api/user/requests/route";

describe("GET /api/user/requests - Unit Tests", () => {
  beforeEach(() => {
    vi.resetAllMocks();

    // Simulate Prisma returning the results of its two queries.
    mocks.transaction.mockImplementation(
      async (operations: Promise<unknown>[]) =>
        Promise.all(operations),
    );
  });

  const createRequest = (query = "") =>
    new NextRequest(
      `http://localhost:3000/api/user/requests${query}`,
    );

  it("TC-RES-GET-01: returns 401 when unauthenticated", async () => {
    mocks.verifyAuth.mockResolvedValue(null);

    const response = await GET(createRequest());
    const result = await response.json();

    expect(response.status).toBe(401);
    expect(result.success).toBe(false);
    expect(result.error).toBe("Unauthorized");

    expect(mocks.findMany).not.toHaveBeenCalled();
  });

  it("TC-RES-GET-02: returns 403 for an Admin", async () => {
    mocks.verifyAuth.mockResolvedValue({
      id: "admin-001",
      role: "ADMIN",
    });

    const response = await GET(createRequest());
    const result = await response.json();

    expect(response.status).toBe(403);
    expect(result.success).toBe(false);

    expect(mocks.findMany).not.toHaveBeenCalled();
  });

  it("TC-RES-GET-03: retrieves Resident requests successfully", async () => {
    mocks.verifyAuth.mockResolvedValue({
      id: "resident-001",
      role: "USER",
    });

    mocks.findMany.mockResolvedValue([]);
    mocks.count.mockResolvedValue(0);

    const response = await GET(createRequest());
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.success).toBe(true);
    expect(result.requests).toEqual([]);

    expect(mocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: "resident-001",
        },
        skip: 0,
        take: 10,
        orderBy: {
          createdAt: "desc",
        },
      }),
    );

    expect(mocks.count).toHaveBeenCalledWith({
      where: {
        userId: "resident-001",
      },
    });
  });


  it("TC-RES-GET-04: returns an empty list when Resident has no requests", async () => {
    mocks.verifyAuth.mockResolvedValue({
      id: "resident-001",
      role: "USER",
    });

    mocks.findMany.mockResolvedValue([]);
    mocks.count.mockResolvedValue(0);

    const response = await GET(createRequest());
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.success).toBe(true);
    expect(result.requests).toEqual([]);

    expect(result.pagination).toEqual({
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    });

    expect(mocks.count).toHaveBeenCalledWith({
      where: {
        userId: "resident-001",
      },
    });
  });



  it("TC-RES-GET-05: applies default pagination", async () => {
    mocks.verifyAuth.mockResolvedValue({
      id: "resident-001",
      role: "USER",
    });

    mocks.findMany.mockResolvedValue([]);
    mocks.count.mockResolvedValue(25);

    const response = await GET(createRequest());
    const result = await response.json();

    expect(response.status).toBe(200);

    expect(mocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
        take: 10,
      }),
    );

    expect(result.pagination).toEqual({
      page: 1,
      limit: 10,
      total: 25,
      totalPages: 3,
      hasNextPage: true,
      hasPreviousPage: false,
    });
  });

  it("TC-RES-GET-06: applies custom pagination", async () => {
    mocks.verifyAuth.mockResolvedValue({
      id: "resident-001",
      role: "USER",
    });

    mocks.findMany.mockResolvedValue([]);
    mocks.count.mockResolvedValue(25);

    const response = await GET(
      createRequest("?page=3&limit=5"),
    );

    const result = await response.json();

    expect(response.status).toBe(200);

    expect(mocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10,
        take: 5,
      }),
    );

    expect(result.pagination).toEqual({
      page: 3,
      limit: 5,
      total: 25,
      totalPages: 5,
      hasNextPage: true,
      hasPreviousPage: true,
    });
  });


  it("TC-RES-GET-07: caps the page limit at 50", async () => {
    mocks.verifyAuth.mockResolvedValue({
      id: "resident-001",
      role: "USER",
    });

    mocks.findMany.mockResolvedValue([]);
    mocks.count.mockResolvedValue(120);

    const response = await GET(
      createRequest("?page=1&limit=100"),
    );

    const result = await response.json();

    expect(response.status).toBe(200);

    // Prisma must never retrieve more than 50 records.
    expect(mocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
        take: 50,
      }),
    );

    expect(result.pagination.limit).toBe(50);
    expect(result.pagination.totalPages).toBe(3);
    expect(result.pagination.hasNextPage).toBe(true);
  });

  it("TC-RES-GET-08: uses defaults for invalid pagination", async () => {
    mocks.verifyAuth.mockResolvedValue({
      id: "resident-001",
      role: "USER",
    });

    mocks.findMany.mockResolvedValue([]);
    mocks.count.mockResolvedValue(5);

    const response = await GET(
      createRequest("?page=-3&limit=0"),
    );

    const result = await response.json();

    expect(response.status).toBe(200);

    expect(mocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
        take: 10,
      }),
    );

    expect(result.pagination).toEqual({
      page: 1,
      limit: 10,
      total: 5,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    });
  });


  it("TC-RES-GET-09: filters WAITING requests", async () => {
    mocks.verifyAuth.mockResolvedValue({
      id: "resident-001",
      role: "USER",
    });

    mocks.findMany.mockResolvedValue([]);
    mocks.count.mockResolvedValue(0);

    const response = await GET(
      createRequest("?view=WAITING"),
    );

    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.filters.view).toBe("WAITING");

    expect(mocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: "resident-001",
          status: {
            in: ["PENDING", "APPROVED"],
          },
        },
      }),
    );

    expect(mocks.count).toHaveBeenCalledWith({
      where: {
        userId: "resident-001",
        status: {
          in: ["PENDING", "APPROVED"],
        },
      },
    });
  });

  it("TC-RES-GET-10: filters UPCOMING requests", async () => {
    mocks.verifyAuth.mockResolvedValue({
      id: "resident-001",
      role: "USER",
    });

    mocks.findMany.mockResolvedValue([]);
    mocks.count.mockResolvedValue(0);

    const response = await GET(
      createRequest("?view=UPCOMING"),
    );

    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.filters.view).toBe("UPCOMING");

    expect(mocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: "resident-001",
          status: {
            in: ["ASSIGNED", "IN_PROGRESS"],
          },
        },
      }),
    );
  });

  it("TC-RES-GET-11: filters HISTORY requests", async () => {
    mocks.verifyAuth.mockResolvedValue({
      id: "resident-001",
      role: "USER",
    });

    mocks.findMany.mockResolvedValue([]);
    mocks.count.mockResolvedValue(0);

    const response = await GET(
      createRequest("?view=HISTORY"),
    );

    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.filters.view).toBe("HISTORY");

    expect(mocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: "resident-001",
          status: {
            in: ["COMPLETED", "CANCELED", "REJECTED"],
          },
        },
      }),
    );
  });

  it("TC-RES-GET-12: exact status overrides view filter", async () => {
    mocks.verifyAuth.mockResolvedValue({
      id: "resident-001",
      role: "USER",
    });

    mocks.findMany.mockResolvedValue([]);
    mocks.count.mockResolvedValue(0);

    const response = await GET(
      createRequest("?view=WAITING&status=COMPLETED"),
    );

    const result = await response.json();

    expect(response.status).toBe(200);

    expect(result.filters.view).toBe("WAITING");
    expect(result.filters.status).toBe("COMPLETED");

    expect(mocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: "resident-001",
          status: "COMPLETED",
        },
      }),
    );
  });


  it("TC-RES-GET-13: applies search filters to Resident requests", async () => {
    mocks.verifyAuth.mockResolvedValue({
      id: "resident-001",
      role: "USER",
    });

    mocks.findMany.mockResolvedValue([]);
    mocks.count.mockResolvedValue(0);

    const response = await GET(
      createRequest("?search=plastic"),
    );

    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.filters.search).toBe("plastic");

    const expectedWhere = {
      userId: "resident-001",
      OR: [
        {
          reference: {
            contains: "plastic",
            mode: "insensitive",
          },
        },
        {
          description: {
            contains: "plastic",
            mode: "insensitive",
          },
        },
        {
          wasteType: {
            name: {
              contains: "plastic",
              mode: "insensitive",
            },
          },
        },
        {
          pickupStreet: {
            contains: "plastic",
            mode: "insensitive",
          },
        },
        {
          pickupCity: {
            contains: "plastic",
            mode: "insensitive",
          },
        },
        {
          pickupState: {
            contains: "plastic",
            mode: "insensitive",
          },
        },
      ],
    };

    expect(mocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expectedWhere,
      }),
    );

    expect(mocks.count).toHaveBeenCalledWith({
      where: expectedWhere,
    });
  });


  it("TC-RES-GET-14: sorts requests in ascending order", async () => {
    mocks.verifyAuth.mockResolvedValue({
      id: "resident-001",
      role: "USER",
    });

    mocks.findMany.mockResolvedValue([]);
    mocks.count.mockResolvedValue(0);

    const response = await GET(
      createRequest("?order=asc"),
    );

    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.filters.order).toBe("asc");

    expect(mocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: {
          createdAt: "asc",
        },
      }),
    );
  });

  it("TC-RES-GET-14B: defaults to descending order for invalid input", async () => {
    mocks.verifyAuth.mockResolvedValue({
      id: "resident-001",
      role: "USER",
    });

    mocks.findMany.mockResolvedValue([]);
    mocks.count.mockResolvedValue(0);

    const response = await GET(
      createRequest("?order=random"),
    );

    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.filters.order).toBe("desc");

    expect(mocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: {
          createdAt: "desc",
        },
      }),
    );
  });


  it("TC-RES-GET-15: restricts requests to the authenticated Resident", async () => {
    mocks.verifyAuth.mockResolvedValue({
      id: "resident-001",
      role: "USER",
    });

    mocks.findMany.mockResolvedValue([]);
    mocks.count.mockResolvedValue(0);

    const response = await GET(
      createRequest(
        "?view=WAITING&search=plastic&page=2&limit=5",
      ),
    );

    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.success).toBe(true);

    // Verify the authenticated Resident owns the query.
    const findManyArgs = mocks.findMany.mock.calls[0][0];
    const countArgs = mocks.count.mock.calls[0][0];

    expect(findManyArgs.where.userId).toBe("resident-001");
    expect(countArgs.where.userId).toBe("resident-001");

    // Verify filters cannot remove the ownership restriction.
    expect(findManyArgs.where.status).toEqual({
      in: ["PENDING", "APPROVED"],
    });

    expect(findManyArgs.where.OR).toBeDefined();

    // Verify pagination still works alongside the filters.
    expect(findManyArgs.skip).toBe(5);
    expect(findManyArgs.take).toBe(5);
  });


  it("TC-RES-GET-16: formats pickup address and collector name", async () => {
    mocks.verifyAuth.mockResolvedValue({
      id: "resident-001",
      role: "USER",
    });

    const mockWasteRequest = {
      id: "request-001",
      reference: "WR-001",
      description: "Household waste",
      status: "ASSIGNED",
      pickupStreet: "12 King Street",
      pickupCity: "Coventry",
      pickupState: "West Midlands",
      pickupPostalCode: "CV1 1AA",
      pickupCountry: "United Kingdom",
      collector: {
        id: "collector-001",
        firstName: "John",
        lastName: "Smith",
        phone: "07123456789",
      },
    };

    mocks.findMany.mockResolvedValue([mockWasteRequest]);
    mocks.count.mockResolvedValue(1);

    const response = await GET(createRequest());
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.success).toBe(true);
    expect(result.requests).toHaveLength(1);

    const request = result.requests[0];

    expect(request.pickupAddress).toEqual({
      street: "12 King Street",
      city: "Coventry",
      state: "West Midlands",
      postalCode: "CV1 1AA",
      country: "United Kingdom",
      formatted:
        "12 King Street, Coventry, West Midlands, CV1 1AA, United Kingdom",
    });

    expect(request.collector.fullName).toBe("John Smith");

    // Existing request information should be preserved.
    expect(request.reference).toBe("WR-001");
    expect(request.status).toBe("ASSIGNED");
  });


  it("TC-RES-GET-17: returns 500 when database retrieval fails", async () => {
    mocks.verifyAuth.mockResolvedValue({
      id: "resident-001",
      role: "USER",
    });

    // Simulate a database failure.
    mocks.findMany.mockRejectedValue(
      new Error("Database connection failed"),
    );

    mocks.count.mockResolvedValue(0);

    // Suppress the expected console error during this test.
    const consoleSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    try {
      const response = await GET(createRequest());
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.success).toBe(false);

      expect(result.error).toBe(
        "Unable to retrieve pickup requests",
      );

      // Internal database details must not be exposed.
      expect(JSON.stringify(result)).not.toContain(
        "Database connection failed",
      );

      expect(consoleSpy).toHaveBeenCalled();
    } finally {
      consoleSpy.mockRestore();
    }
  });

  it("TC-RES-GET-18: defaults malformed pagination parameters", async () => {
    mocks.verifyAuth.mockResolvedValue({
      id: "resident-001",
      role: "USER",
    });

    mocks.findMany.mockResolvedValue([]);
    mocks.count.mockResolvedValue(0);

    const response = await GET(
      createRequest("?page=2abc&limit=5xyz"),
    );

    const result = await response.json();

    expect(response.status).toBe(200);

    // Malformed values should use default pagination.
    expect(mocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
        take: 10,
      }),
    );

    expect(result.pagination.page).toBe(1);
    expect(result.pagination.limit).toBe(10);
  });




});

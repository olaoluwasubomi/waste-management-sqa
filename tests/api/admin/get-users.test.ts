
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const mocks = vi.hoisted(() => ({
  verifyAuth: vi.fn(),
  findMany: vi.fn(),
}));

vi.mock("@/lib/verifyAuth", () => ({
  verifyAuth: mocks.verifyAuth,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    user: {
      findMany: mocks.findMany,
    },
  },
}));

import { GET } from "@/app/api/admin/get-users/route";

const mockUsers = [
  {
    id: "user-001",
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    role: "USER",
    mustChangePassword: false,
    createdAt: new Date("2026-10-01"),
  },
  {
    id: "user-002",
    firstName: "Jane",
    lastName: "Smith",
    email: "jane@example.com",
    role: "USER",
    mustChangePassword: true,
    createdAt: new Date("2026-10-02"),
  },
];

function createRequest(
  query: Record<string, string> = {},
): Request {
  const url = new URL(
    "http://localhost:3000/api/admin/get-users",
  );

  Object.entries(query).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  return new Request(url.toString(), {
    method: "GET",
  });
}

describe("GET /api/admin/get-users - Unit Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.verifyAuth.mockResolvedValue({
      id: "admin-001",
      role: "ADMIN",
    });

    mocks.findMany.mockResolvedValue(mockUsers);

    vi.spyOn(console, "error").mockImplementation(
      () => {},
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // SUCCESSFUL RETRIEVAL

  it("TC-ADM-GETUSR-01: returns residents successfully", async () => {
    const response = await GET(createRequest());
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result).toHaveLength(2);
    expect(mocks.findMany).toHaveBeenCalledTimes(1);
  });

  // AUTHENTICATION AND AUTHORISATION

  it("TC-ADM-GETUSR-02: rejects unauthenticated requests", async () => {
    mocks.verifyAuth.mockResolvedValue(null);

    const response = await GET(createRequest());

    expect(response.status).toBe(401);
    expect(mocks.findMany).not.toHaveBeenCalled();
  });

  it("TC-ADM-GETUSR-03: rejects resident users", async () => {
    mocks.verifyAuth.mockResolvedValue({
      id: "resident-001",
      role: "USER",
    });

    const response = await GET(createRequest());

    expect(response.status).toBe(403);
    expect(mocks.findMany).not.toHaveBeenCalled();
  });

  it("TC-ADM-GETUSR-04: rejects collector users", async () => {
    mocks.verifyAuth.mockResolvedValue({
      id: "collector-001",
      role: "COLLECTOR",
    });

    const response = await GET(createRequest());

    expect(response.status).toBe(403);
    expect(mocks.findMany).not.toHaveBeenCalled();
  });

  // ROLE RESTRICTION

  it("TC-ADM-GETUSR-05: retrieves only USER accounts", async () => {
    await GET(createRequest());

    expect(mocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          role: "USER",
        }),
      }),
    );
  });

  // NAME FILTERING

  it("TC-ADM-GETUSR-06: filters by first name", async () => {
    await GET(createRequest({ name: "John" }));

    expect(mocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.arrayContaining([
            expect.objectContaining({
              OR: expect.arrayContaining([
                {
                  firstName: {
                    contains: "John",
                    mode: "insensitive",
                  },
                },
              ]),
            }),
          ]),
        }),
      }),
    );
  });

  it("TC-ADM-GETUSR-07: filters by last name", async () => {
    await GET(createRequest({ name: "Doe" }));

    expect(mocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.arrayContaining([
            expect.objectContaining({
              OR: expect.arrayContaining([
                {
                  lastName: {
                    contains: "Doe",
                    mode: "insensitive",
                  },
                },
              ]),
            }),
          ]),
        }),
      }),
    );
  });

  it("TC-ADM-GETUSR-08: matches both parts of a full name", async () => {
    await GET(createRequest({ name: "John Doe" }));

    const query = mocks.findMany.mock.calls[0][0];
    const filters = query.where.AND;

    const nameFilter = filters.find(
      (filter: Record<string, unknown>) =>
        "AND" in filter || "OR" in filter,
    );

    expect(nameFilter).toEqual({
      AND: [
        {
          firstName: {
            contains: "John",
            mode: "insensitive",
          },
        },
        {
          lastName: {
            contains: "Doe",
            mode: "insensitive",
          },
        },
      ],
    });
  });

  it("TC-ADM-GETUSR-09: trims whitespace from name filter", async () => {
    await GET(
      createRequest({
        name: "  John  ",
      }),
    );

    const query = mocks.findMany.mock.calls[0][0];
    const serialized = JSON.stringify(query.where);

    expect(serialized).toContain('"John"');
    expect(serialized).not.toContain('"  John  "');
  });

  it("TC-ADM-GETUSR-10: handles extra spaces in full names", async () => {
    await GET(
      createRequest({
        name: "John   Doe",
      }),
    );

    const query = mocks.findMany.mock.calls[0][0];

    expect(query.where.AND).toEqual(
      expect.arrayContaining([
        {
          AND: [
            {
              firstName: {
                contains: "John",
                mode: "insensitive",
              },
            },
            {
              lastName: {
                contains: "Doe",
                mode: "insensitive",
              },
            },
          ],
        },
      ]),
    );
  });

  it("TC-ADM-GETUSR-11: ignores empty name filters", async () => {
    await GET(createRequest({ name: "   " }));

    const query = mocks.findMany.mock.calls[0][0];

    expect(
      JSON.stringify(query.where),
    ).not.toContain('"contains":""');
  });

  // EMAIL FILTERING

  it("TC-ADM-GETUSR-12: filters by email", async () => {
    await GET(
      createRequest({
        email: "john@example.com",
      }),
    );

    expect(mocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.arrayContaining([
            {
              email: {
                contains: "john@example.com",
                mode: "insensitive",
              },
            },
          ]),
        }),
      }),
    );
  });

  it("TC-ADM-GETUSR-13: trims email filter whitespace", async () => {
    await GET(
      createRequest({
        email: "  john@example.com  ",
      }),
    );

    const query = mocks.findMany.mock.calls[0][0];

    expect(query.where.AND).toEqual(
      expect.arrayContaining([
        {
          email: {
            contains: "john@example.com",
            mode: "insensitive",
          },
        },
      ]),
    );
  });

  it("TC-ADM-GETUSR-14: uses case-insensitive email matching", async () => {
    await GET(
      createRequest({
        email: "JOHN@EXAMPLE.COM",
      }),
    );

    const query = mocks.findMany.mock.calls[0][0];

    expect(query.where.AND).toEqual(
      expect.arrayContaining([
        {
          email: {
            contains: "JOHN@EXAMPLE.COM",
            mode: "insensitive",
          },
        },
      ]),
    );
  });

  // STATUS FILTERING

  it("TC-ADM-GETUSR-15: filters ACTIVE residents", async () => {
    await GET(createRequest({ status: "ACTIVE" }));

    const query = mocks.findMany.mock.calls[0][0];

    expect(query.where.AND).toEqual(
      expect.arrayContaining([
        {
          mustChangePassword: false,
        },
      ]),
    );
  });

  it("TC-ADM-GETUSR-16: filters PENDING residents", async () => {
    await GET(createRequest({ status: "PENDING" }));

    const query = mocks.findMany.mock.calls[0][0];

    expect(query.where.AND).toEqual(
      expect.arrayContaining([
        {
          mustChangePassword: true,
        },
      ]),
    );
  });

  it("TC-ADM-GETUSR-17: rejects unsupported status values", async () => {
    const response = await GET(
      createRequest({
        status: "UNKNOWN",
      }),
    );

    expect(response.status).toBe(400);
    expect(mocks.findMany).not.toHaveBeenCalled();
  });

  it("TC-ADM-GETUSR-18: accepts lowercase status values", async () => {
    const response = await GET(
      createRequest({
        status: "active",
      }),
    );

    expect(response.status).toBe(200);

    const query = mocks.findMany.mock.calls[0][0];

    expect(query.where.AND).toEqual(
      expect.arrayContaining([
        {
          mustChangePassword: false,
        },
      ]),
    );
  });

  // COMBINED FILTERING

  it("TC-ADM-GETUSR-19: combines name, email and status filters", async () => {
    await GET(
      createRequest({
        name: "John",
        email: "john@example.com",
        status: "ACTIVE",
      }),
    );

    const query = mocks.findMany.mock.calls[0][0];

    expect(query.where.AND).toEqual(
      expect.arrayContaining([
        {
          email: {
            contains: "john@example.com",
            mode: "insensitive",
          },
        },
        {
          mustChangePassword: false,
        },
      ]),
    );

    expect(
      JSON.stringify(query.where),
    ).toContain("John");
  });

  // SORTING

  it("TC-ADM-GETUSR-20: sorts residents by newest first", async () => {
    await GET(createRequest());

    expect(mocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: {
          createdAt: "desc",
        },
      }),
    );
  });

  // RESPONSE FORMATTING

  it("TC-ADM-GETUSR-21: combines first and last names", async () => {
    const response = await GET(createRequest());
    const result = await response.json();

    expect(result[0].name).toBe("John Doe");
    expect(result[1].name).toBe("Jane Smith");
  });

  it("TC-ADM-GETUSR-22: maps mustChangePassword=false to ACTIVE", async () => {
    const response = await GET(createRequest());
    const result = await response.json();

    expect(result[0].status).toBe("ACTIVE");
  });

  it("TC-ADM-GETUSR-23: maps mustChangePassword=true to PENDING", async () => {
    const response = await GET(createRequest());
    const result = await response.json();

    expect(result[1].status).toBe("PENDING");
  });

  it("TC-ADM-GETUSR-24: returns only the expected response fields", async () => {
    const response = await GET(createRequest());
    const result = await response.json();

    expect(result[0]).toEqual({
      id: "user-001",
      name: "John Doe",
      email: "john@example.com",
      role: "USER",
      status: "ACTIVE",
    });
  });

  // DATA PROTECTION

  it("TC-ADM-GETUSR-25: excludes sensitive database fields", async () => {
    await GET(createRequest());

    const query = mocks.findMany.mock.calls[0][0];

    expect(query.select.password).toBeUndefined();
    expect(query.select.phone).toBeUndefined();
    expect(query.select.image).toBeUndefined();
  });

  // EMPTY RESULTS

  it("TC-ADM-GETUSR-26: returns an empty array when no users match", async () => {
    mocks.findMany.mockResolvedValue([]);

    const response = await GET(createRequest());
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result).toEqual([]);
  });

  // DATABASE ERRORS

  it("TC-ADM-GETUSR-27: handles database failures", async () => {
    mocks.findMany.mockRejectedValue(
      new Error("Database unavailable"),
    );

    const response = await GET(createRequest());
    const result = await response.json();

    expect(response.status).toBe(500);
    expect(result.error).toBe("Server error");
  });

  // AUTHENTICATION ERRORS

  it("TC-ADM-GETUSR-28: handles authentication service failures", async () => {
    mocks.verifyAuth.mockRejectedValue(
      new Error("Authentication service failed"),
    );

    const response = await GET(createRequest());

    expect(response.status).toBe(500);
    expect(mocks.findMany).not.toHaveBeenCalled();
  });
});

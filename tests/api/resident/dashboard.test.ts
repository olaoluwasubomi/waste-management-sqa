
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Role, WasteRequestStatus } from "@prisma/client";

const mocks = vi.hoisted(() => ({
  verifyAuth: vi.fn(),
  requestCount: vi.fn(),
  addressCount: vi.fn(),
  requestFindMany: vi.fn(),
}));

vi.mock("@/lib/verifyAuth", () => ({
  verifyAuth: mocks.verifyAuth,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    wasteRequest: {
      count: mocks.requestCount,
      findMany: mocks.requestFindMany,
    },
    address: {
      count: mocks.addressCount,
    },
  },
}));

import { GET } from "@/app/api/user/dashboard/route";

describe("GET /api/user/dashboard - Unit Tests", () => {
  const residentId = "resident-001";

  const recentRequest = {
    id: "request-001",
    status: WasteRequestStatus.PENDING,
    createdAt: new Date("2026-10-01T10:00:00.000Z"),
    wasteType: {
      name: "Household Waste",
    },
    address: {
      street: "10 Test Street",
      city: "Coventry",
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mocks.verifyAuth.mockResolvedValue({
      id: residentId,
      role: Role.USER,
    });

    mocks.requestCount
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(2);

    mocks.addressCount.mockResolvedValue(1);
    mocks.requestFindMany.mockResolvedValue([recentRequest]);
  });

  it("TC-RES-DASH-01: returns dashboard statistics successfully", async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.stats).toEqual({
      activeRequests: 3,
      completedRequests: 2,
      addressCount: 1,
      hasAddress: true,
    });
    expect(body.recentRequests).toHaveLength(1);
  });

  it("TC-RES-DASH-02: returns 401 when unauthenticated", async () => {
    mocks.verifyAuth.mockResolvedValue(null);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
    expect(mocks.requestCount).not.toHaveBeenCalled();
    expect(mocks.addressCount).not.toHaveBeenCalled();
    expect(mocks.requestFindMany).not.toHaveBeenCalled();
  });

  it("TC-RES-DASH-03: returns 401 when an Admin accesses the dashboard", async () => {
    mocks.verifyAuth.mockResolvedValue({
      id: "admin-001",
      role: Role.ADMIN,
    });

    const response = await GET();

    expect(response.status).toBe(401);
    expect(mocks.requestCount).not.toHaveBeenCalled();
  });

  it("TC-RES-DASH-04: counts only the implemented active statuses", async () => {
    await GET();

    expect(mocks.requestCount).toHaveBeenNthCalledWith(1, {
      where: {
        userId: residentId,
        status: {
          in: [
            WasteRequestStatus.PENDING,
            WasteRequestStatus.ASSIGNED,
            WasteRequestStatus.IN_PROGRESS,
          ],
        },
      },
    });
  });

  it("TC-RES-DASH-05: counts only completed requests", async () => {
    await GET();

    expect(mocks.requestCount).toHaveBeenNthCalledWith(2, {
      where: {
        userId: residentId,
        status: WasteRequestStatus.COMPLETED,
      },
    });
  });

  it("TC-RES-DASH-06: scopes all dashboard queries to the authenticated Resident", async () => {
    await GET();

    expect(mocks.requestCount).toHaveBeenCalledTimes(2);

    for (const [query] of mocks.requestCount.mock.calls) {
      expect(query.where.userId).toBe(residentId);
    }

    expect(mocks.addressCount).toHaveBeenCalledWith({
      where: { userId: residentId },
    });

    expect(mocks.requestFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: residentId },
      }),
    );
  });

  it("TC-RES-DASH-07: returns zero statistics for an empty dashboard", async () => {
    mocks.requestCount.mockReset();
    mocks.requestCount
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);

    mocks.addressCount.mockResolvedValue(0);
    mocks.requestFindMany.mockResolvedValue([]);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.stats).toEqual({
      activeRequests: 0,
      completedRequests: 0,
      addressCount: 0,
      hasAddress: false,
    });
    expect(body.recentRequests).toEqual([]);
  });

  it("TC-RES-DASH-08: sets hasAddress to true when addresses exist", async () => {
    mocks.addressCount.mockResolvedValue(2);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.stats.addressCount).toBe(2);
    expect(body.stats.hasAddress).toBe(true);
  });

  it("TC-RES-DASH-09: requests the five most recent records", async () => {
    await GET();

    expect(mocks.requestFindMany).toHaveBeenCalledWith({
      where: { userId: residentId },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        wasteType: {
          select: { name: true },
        },
        address: {
          select: {
            street: true,
            city: true,
          },
        },
      },
    });
  });

  it("TC-RES-DASH-10: formats recent request details correctly", async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.recentRequests).toEqual([
      {
        id: "request-001",
        wasteType: "Household Waste",
        status: WasteRequestStatus.PENDING,
        address: "10 Test Street, Coventry",
        date: "2026-10-01T10:00:00.000Z",
      },
    ]);
  });

  it("TC-RES-DASH-11: returns 500 when a database query fails", async () => {
    mocks.requestCount.mockReset();
    mocks.requestCount.mockRejectedValue(
      new Error("Database connection failed"),
    );

    const consoleSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    try {
      const response = await GET();
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error).toBe("Server error");
    } finally {
      consoleSpy.mockRestore();
    }
  });
});

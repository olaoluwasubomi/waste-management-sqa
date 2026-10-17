
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "@/app/api/user/addresses/route";

const mocks = vi.hoisted(() => ({
  verifyAuth: vi.fn(),
  findMany: vi.fn(),
  create: vi.fn(),
}));

vi.mock("@/lib/verifyAuth", () => ({
  verifyAuth: mocks.verifyAuth,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    address: {
      findMany: mocks.findMany,
      create: mocks.create,
    },
  },
}));

// import { GET } from "@/app/api/user/addresses/route";

describe("Resident Address Management unit tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("TC-RES-ADDR-01: retrieves addresses belonging to the authenticated Resident", async () => {
    mocks.verifyAuth.mockResolvedValue({
      id: "resident-001",
      email: "resident@example.test",
      role: "USER",
    });

    const addresses = [
      {
        id: "address-001",
        street: "10 Test Street",
        city: "Coventry",
        state: "West Midlands",
        postalCode: "CV1 1AA",
        country: "United Kingdom",
      },
    ];

    mocks.findMany.mockResolvedValue(addresses);

    const response = await GET();
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result).toEqual(addresses);

    expect(mocks.findMany).toHaveBeenCalledWith({
      where: {
        userId: "resident-001",
      },
      orderBy: {
        id: "desc",
      },
      select: {
        id: true,
        street: true,
        city: true,
        state: true,
        postalCode: true,
        country: true,
      },
    });
  });



  it("TC-RES-ADDR-02: returns an empty array when the Resident has no addresses", async () => {
    mocks.verifyAuth.mockResolvedValue({
      id: "resident-001",
      role: "USER",
    });

    mocks.findMany.mockResolvedValue([]);

    const response = await GET();
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result).toEqual([]);
    expect(mocks.findMany).toHaveBeenCalledTimes(1);
  });

  it("TC-RES-ADDR-03: rejects unauthenticated address retrieval", async () => {
    mocks.verifyAuth.mockResolvedValue(null);

    const response = await GET();
    const result = await response.json();

    expect(response.status).toBe(401);
    expect(result.error).toBe("Unauthorized");
    expect(mocks.findMany).not.toHaveBeenCalled();
  });

  it("TC-RES-ADDR-04: rejects address retrieval by an Administrator", async () => {
    mocks.verifyAuth.mockResolvedValue({
      id: "admin-001",
      role: "ADMIN",
    });

    const response = await GET();
    const result = await response.json();

    expect(response.status).toBe(401);
    expect(result.error).toBe("Unauthorized");
    expect(mocks.findMany).not.toHaveBeenCalled();
  });

  it("TC-RES-ADDR-05: returns HTTP 500 when address retrieval fails", async () => {
    mocks.verifyAuth.mockResolvedValue({
      id: "resident-001",
      role: "USER",
    });

    mocks.findMany.mockRejectedValue(
      new Error("Simulated database retrieval failure"),
    );

    const response = await GET();
    const result = await response.json();

    expect(response.status).toBe(500);
    expect(result.error).toBe("Server error");
  });

  it("TC-RES-ADDR-06: creates a valid Resident address", async () => {
    mocks.verifyAuth.mockResolvedValue({
      id: "resident-001",
      role: "USER",
    });

    const address = {
      id: "address-002",
      street: "15 Test Street",
      city: "Coventry",
      state: "West Midlands",
      postalCode: "CV2 2AA",
      country: "United Kingdom",
    };

    mocks.create.mockResolvedValue(address);

    const request = new Request(
      "http://localhost:3000/api/user/addresses",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          street: "  15 Test Street  ",
          city: "  Coventry  ",
          state: "  West Midlands  ",
          postalCode: "  CV2 2AA  ",
          country: "  United Kingdom  ",
        }),
      },
    );

    const response = await POST(request);
    const result = await response.json();

    expect(response.status).toBe(201);
    expect(result).toEqual(address);

    expect(mocks.create).toHaveBeenCalledWith({
      data: {
        street: "15 Test Street",
        city: "Coventry",
        state: "West Midlands",
        postalCode: "CV2 2AA",
        country: "United Kingdom",
        userId: "resident-001",
      },
      select: {
        id: true,
        street: true,
        city: true,
        state: true,
        postalCode: true,
        country: true,
      },
    });
  });

  it("TC-RES-ADDR-07: rejects unauthenticated address creation", async () => {
    mocks.verifyAuth.mockResolvedValue(null);

    const request = new Request(
      "http://localhost:3000/api/user/addresses",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          street: "15 Test Street",
          city: "Coventry",
          state: "West Midlands",
        }),
      },
    );

    const response = await POST(request);
    const result = await response.json();

    expect(response.status).toBe(401);
    expect(result.error).toBe("Unauthorized");
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("TC-RES-ADDR-08: rejects address creation by an Administrator", async () => {
    mocks.verifyAuth.mockResolvedValue({
      id: "admin-001",
      role: "ADMIN",
    });

    const request = new Request(
      "http://localhost:3000/api/user/addresses",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          street: "15 Test Street",
          city: "Coventry",
          state: "West Midlands",
        }),
      },
    );

    const response = await POST(request);
    const result = await response.json();

    expect(response.status).toBe(401);
    expect(result.error).toBe("Unauthorized");
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("TC-RES-ADDR-09: rejects missing required address fields", async () => {
    mocks.verifyAuth.mockResolvedValue({
      id: "resident-001",
      role: "USER",
    });

    const request = new Request(
      "http://localhost:3000/api/user/addresses",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          street: "15 Test Street",
          city: "Coventry",
        }),
      },
    );

    const response = await POST(request);
    const result = await response.json();

    expect(response.status).toBe(400);
    expect(result.error).toBe(
      "Street, city, and state are required",
    );
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("TC-RES-ADDR-10: rejects invalid address field types", async () => {
    mocks.verifyAuth.mockResolvedValue({
      id: "resident-001",
      role: "USER",
    });

    const request = new Request(
      "http://localhost:3000/api/user/addresses",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          street: 12345,
          city: "Coventry",
          state: "West Midlands",
        }),
      },
    );

    const response = await POST(request);
    const result = await response.json();

    expect(response.status).toBe(400);
    expect(result.error).toBe("Invalid address fields");
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("TC-RES-ADDR-11: rejects street addresses shorter than five characters", async () => {
    mocks.verifyAuth.mockResolvedValue({
      id: "resident-001",
      role: "USER",
    });

    const request = new Request(
      "http://localhost:3000/api/user/addresses",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          street: "1234",
          city: "Coventry",
          state: "West Midlands",
        }),
      },
    );

    const response = await POST(request);
    const result = await response.json();

    expect(response.status).toBe(400);
    expect(result.error).toBe(
      "Street address must be at least 5 characters",
    );
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("TC-RES-ADDR-12: rejects a city or state shorter than two characters", async () => {
    mocks.verifyAuth.mockResolvedValue({
      id: "resident-001",
      role: "USER",
    });

    const request = new Request(
      "http://localhost:3000/api/user/addresses",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          street: "15 Test Street",
          city: "C",
          state: "West Midlands",
        }),
      },
    );

    const response = await POST(request);
    const result = await response.json();

    expect(response.status).toBe(400);
    expect(result.error).toBe(
      "City and state must be at least 2 characters",
    );
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("TC-RES-ADDR-13: stores null when the postal code is omitted", async () => {
    mocks.verifyAuth.mockResolvedValue({
      id: "resident-001",
      role: "USER",
    });

    mocks.create.mockResolvedValue({
      id: "address-003",
      street: "15 Test Street",
      city: "Coventry",
      state: "West Midlands",
      postalCode: null,
      country: "United Kingdom",
    });

    const request = new Request(
      "http://localhost:3000/api/user/addresses",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          street: "15 Test Street",
          city: "Coventry",
          state: "West Midlands",
          country: "United Kingdom",
        }),
      },
    );

    const response = await POST(request);

    expect(response.status).toBe(201);
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          postalCode: null,
        }),
      }),
    );
  });

  it("TC-RES-ADDR-14: defaults the country to Nigeria when omitted", async () => {
    mocks.verifyAuth.mockResolvedValue({
      id: "resident-001",
      role: "USER",
    });

    mocks.create.mockResolvedValue({
      id: "address-004",
      street: "15 Test Street",
      city: "Coventry",
      state: "West Midlands",
      postalCode: null,
      country: "Nigeria",
    });

    const request = new Request(
      "http://localhost:3000/api/user/addresses",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          street: "15 Test Street",
          city: "Coventry",
          state: "West Midlands",
        }),
      },
    );

    const response = await POST(request);

    expect(response.status).toBe(201);
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          country: "Nigeria",
        }),
      }),
    );
  });

  it("TC-RES-ADDR-15: returns HTTP 500 when address creation fails", async () => {
    mocks.verifyAuth.mockResolvedValue({
      id: "resident-001",
      role: "USER",
    });

    mocks.create.mockRejectedValue(
      new Error("Simulated database creation failure"),
    );

    const request = new Request(
      "http://localhost:3000/api/user/addresses",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          street: "15 Test Street",
          city: "Coventry",
          state: "West Midlands",
        }),
      },
    );

    const response = await POST(request);
    const result = await response.json();

    expect(response.status).toBe(500);
    expect(result.error).toBe("Server error");
  });

  it("TC-RES-ADDR-16: rejects a null JSON body with HTTP 400", async () => {
    mocks.verifyAuth.mockResolvedValue({
      id: "resident-001",
      role: "USER",
    });

    const request = new Request(
      "http://localhost:3000/api/user/addresses",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "null",
      },
    );

    const response = await POST(request);
    const result = await response.json();

    // Expected validation behaviour: reject malformed input.
    expect(response.status).toBe(400);
    expect(result.error).toBeDefined();
    expect(mocks.create).not.toHaveBeenCalled();
  });

});

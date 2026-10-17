
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  verifyAuth: vi.fn(),
  findFirst: vi.fn(),
  update: vi.fn(),
  deleteAddress: vi.fn(),
  count: vi.fn(),
}));

vi.mock("@/lib/verifyAuth", () => ({
  verifyAuth: mocks.verifyAuth,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    address: {
      findFirst: mocks.findFirst,
      update: mocks.update,
      delete: mocks.deleteAddress,
    },
    wasteRequest: {
      count: mocks.count,
    },
  },
}));

import {
  PUT,
  DELETE,
} from "@/app/api/user/addresses/[id]/route";

const resident = {
  id: "resident-001",
  role: "USER",
};

const existingAddress = {
  id: "address-001",
  userId: "resident-001",
  street: "10 Test Street",
  city: "Coventry",
  state: "West Midlands",
  postalCode: null,
  country: "Nigeria",
};

const validAddressBody = {
  street: "25 Updated Street",
  city: "Birmingham",
  state: "West Midlands",
  postalCode: "B1 1AA",
  country: "United Kingdom",
};

function makePutRequest(body: unknown) {
  return new Request(
    "http://localhost:3000/api/user/addresses/address-001",
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
}

function makeDeleteRequest() {
  return new Request(
    "http://localhost:3000/api/user/addresses/address-001",
    { method: "DELETE" },
  );
}

function routeContext(id = "address-001") {
  return {
    params: Promise.resolve({ id }),
  };
}

describe("Resident Address Management — PUT and DELETE unit tests", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.verifyAuth.mockResolvedValue(resident);
    mocks.findFirst.mockResolvedValue(existingAddress);
    mocks.count.mockResolvedValue(0);
  });

  it("TC-RES-ADDR-17: successfully updates an owned address", async () => {
    const updatedAddress = {
      id: "address-001",
      ...validAddressBody,
    };

    mocks.update.mockResolvedValue(updatedAddress);

    const response = await PUT(
      makePutRequest(validAddressBody),
      routeContext(),
    );
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result).toEqual(updatedAddress);

    expect(mocks.findFirst).toHaveBeenCalledWith({
      where: {
        id: "address-001",
        userId: "resident-001",
      },
    });

    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: "address-001" },
      data: validAddressBody,
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

  it("TC-RES-ADDR-18: rejects unauthenticated address updates", async () => {
    mocks.verifyAuth.mockResolvedValue(null);

    const response = await PUT(
      makePutRequest(validAddressBody),
      routeContext(),
    );

    expect(response.status).toBe(401);
    expect(mocks.findFirst).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("TC-RES-ADDR-19: rejects address updates by an Administrator", async () => {
    mocks.verifyAuth.mockResolvedValue({
      id: "admin-001",
      role: "ADMIN",
    });

    const response = await PUT(
      makePutRequest(validAddressBody),
      routeContext(),
    );

    expect(response.status).toBe(401);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("TC-RES-ADDR-20: rejects updates to addresses not owned by the Resident", async () => {
    mocks.findFirst.mockResolvedValue(null);

    const response = await PUT(
      makePutRequest(validAddressBody),
      routeContext("another-address"),
    );
    const result = await response.json();

    expect(response.status).toBe(404);
    expect(result.error).toBe("Address not found");

    expect(mocks.findFirst).toHaveBeenCalledWith({
      where: {
        id: "another-address",
        userId: "resident-001",
      },
    });

    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("TC-RES-ADDR-21: rejects updates with missing required fields", async () => {
    const response = await PUT(
      makePutRequest({
        street: "25 Updated Street",
        city: "Birmingham",
      }),
      routeContext(),
    );

    expect(response.status).toBe(400);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("TC-RES-ADDR-22: rejects updates with invalid field types", async () => {
    const response = await PUT(
      makePutRequest({
        street: 12345,
        city: "Birmingham",
        state: "West Midlands",
      }),
      routeContext(),
    );

    expect(response.status).toBe(400);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("TC-RES-ADDR-23: rejects updates with a short street address", async () => {
    const response = await PUT(
      makePutRequest({
        ...validAddressBody,
        street: "1234",
      }),
      routeContext(),
    );

    expect(response.status).toBe(400);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("TC-RES-ADDR-24: rejects updates with a short city name", async () => {
    const response = await PUT(
      makePutRequest({
        ...validAddressBody,
        city: "B",
      }),
      routeContext(),
    );

    expect(response.status).toBe(400);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("TC-RES-ADDR-25: handles a database update failure", async () => {
    mocks.update.mockRejectedValue(
      new Error("Simulated update failure"),
    );

    const response = await PUT(
      makePutRequest(validAddressBody),
      routeContext(),
    );
    const result = await response.json();

    expect(response.status).toBe(500);
    expect(result.error).toBe("Server error");
  });

  it("TC-RES-ADDR-26: rejects a null JSON update body with HTTP 400", async () => {
    const response = await PUT(
      makePutRequest(null),
      routeContext(),
    );

    expect(response.status).toBe(400);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("TC-RES-ADDR-27: successfully deletes an unlinked owned address", async () => {
    mocks.deleteAddress.mockResolvedValue(existingAddress);

    const response = await DELETE(
      makeDeleteRequest(),
      routeContext(),
    );
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.message).toBe(
      "Address deleted successfully",
    );

    expect(mocks.findFirst).toHaveBeenCalledWith({
      where: {
        id: "address-001",
        userId: "resident-001",
      },
    });

    expect(mocks.count).toHaveBeenCalledWith({
      where: { addressId: "address-001" },
    });

    expect(mocks.deleteAddress).toHaveBeenCalledWith({
      where: { id: "address-001" },
    });
  });

  it("TC-RES-ADDR-28: rejects unauthenticated address deletion", async () => {
    mocks.verifyAuth.mockResolvedValue(null);

    const response = await DELETE(
      makeDeleteRequest(),
      routeContext(),
    );

    expect(response.status).toBe(401);
    expect(mocks.deleteAddress).not.toHaveBeenCalled();
  });

  it("TC-RES-ADDR-29: rejects address deletion by an Administrator", async () => {
    mocks.verifyAuth.mockResolvedValue({
      id: "admin-001",
      role: "ADMIN",
    });

    const response = await DELETE(
      makeDeleteRequest(),
      routeContext(),
    );

    expect(response.status).toBe(401);
    expect(mocks.deleteAddress).not.toHaveBeenCalled();
  });

  it("TC-RES-ADDR-30: rejects deletion of an address not owned by the Resident", async () => {
    mocks.findFirst.mockResolvedValue(null);

    const response = await DELETE(
      makeDeleteRequest(),
      routeContext("another-address"),
    );
    const result = await response.json();

    expect(response.status).toBe(404);
    expect(result.error).toBe("Address not found");
    expect(mocks.count).not.toHaveBeenCalled();
    expect(mocks.deleteAddress).not.toHaveBeenCalled();
  });

  it("TC-RES-ADDR-31: prevents deletion of an address linked to waste requests", async () => {
    mocks.count.mockResolvedValue(2);

    const response = await DELETE(
      makeDeleteRequest(),
      routeContext(),
    );
    const result = await response.json();

    expect(response.status).toBe(400);
    expect(result.error).toBe(
      "This address is linked to pickup requests and cannot be deleted",
    );
    expect(mocks.deleteAddress).not.toHaveBeenCalled();
  });

  it("TC-RES-ADDR-32: handles a database deletion failure", async () => {
    mocks.deleteAddress.mockRejectedValue(
      new Error("Simulated deletion failure"),
    );

    const response = await DELETE(
      makeDeleteRequest(),
      routeContext(),
    );
    const result = await response.json();

    expect(response.status).toBe(500);
    expect(result.error).toBe("Server error");
  });
});

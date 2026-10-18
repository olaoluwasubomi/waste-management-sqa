
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
  findUnique: vi.fn(),
  createUser: vi.fn(),
  createAddress: vi.fn(),
  hash: vi.fn(),
  nanoid: vi.fn(),
}));

vi.mock("@/lib/verifyAuth", () => ({
  verifyAuth: mocks.verifyAuth,
}));


vi.mock("@/lib/prisma", () => ({
  default: {
    user: {
      findUnique: mocks.findUnique,
      create: mocks.createUser,
    },
    address: {
      create: mocks.createAddress,
    },
    $transaction: async (
      callback: (tx: {
        user: { create: typeof mocks.createUser };
        address: { create: typeof mocks.createAddress };
      }) => Promise<unknown>
    ) => {
      return callback({
        user: {
          create: mocks.createUser,
        },
        address: {
          create: mocks.createAddress,
        },
      });
    },
  },
}));


vi.mock("bcrypt", () => ({
  default: {
    hash: mocks.hash,
  },
}));

vi.mock("nanoid", () => ({
  nanoid: mocks.nanoid,
}));

import { POST } from "@/app/api/admin/create-users/route";

const validUser = {
  firstName: "Jane",
  lastName: "Smith",
  email: "jane@example.com",
  phone: "07123456789",
};

const createdUser = {
  id: "resident-001",
  ...validUser,
  role: "USER",
  mustChangePassword: true,
};

const createRequest = (
  body: Record<string, unknown> = validUser,
) =>
  new Request(
    "http://localhost:3000/api/admin/create-users",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );

describe("POST /api/admin/create-users - Unit Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.verifyAuth.mockResolvedValue({
      id: "admin-001",
      role: "ADMIN",
    });

    mocks.findUnique.mockResolvedValue(null);
    mocks.nanoid.mockReturnValue("TempPass12");
    mocks.hash.mockResolvedValue("hashed-password");
    mocks.createUser.mockResolvedValue(createdUser);

    mocks.createAddress.mockResolvedValue({
      id: "address-001",
      userId: "resident-001",
    });

    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // SUCCESSFUL ACCOUNT CREATION

  it("TC-ADM-USR-01: creates a valid resident", async () => {
    const response = await POST(createRequest());
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.message).toBe(
      "User created successfully",
    );
    expect(mocks.createUser).toHaveBeenCalledTimes(1);
  });

  // AUTHENTICATION AND AUTHORISATION

  it("TC-ADM-USR-02: rejects unauthenticated requests", async () => {
    mocks.verifyAuth.mockResolvedValue(null);

    const response = await POST(createRequest());

    expect(response.status).toBe(401);
    expect(mocks.createUser).not.toHaveBeenCalled();
  });

  it("TC-ADM-USR-03: rejects resident users", async () => {
    mocks.verifyAuth.mockResolvedValue({
      id: "resident-001",
      role: "USER",
    });

    const response = await POST(createRequest());

    expect(response.status).toBe(403);
    expect(mocks.createUser).not.toHaveBeenCalled();
  });

  it("TC-ADM-USR-04: rejects collector users", async () => {
    mocks.verifyAuth.mockResolvedValue({
      id: "collector-001",
      role: "COLLECTOR",
    });

    const response = await POST(createRequest());

    expect(response.status).toBe(403);
    expect(mocks.createUser).not.toHaveBeenCalled();
  });

  // REQUIRED FIELD VALIDATION

  it("TC-ADM-USR-05: rejects missing first name", async () => {
    const response = await POST(
      createRequest({
        lastName: "Smith",
        email: "jane@example.com",
      }),
    );

    expect(response.status).toBe(400);
    expect(mocks.createUser).not.toHaveBeenCalled();
  });

  it("TC-ADM-USR-06: rejects missing last name", async () => {
    const response = await POST(
      createRequest({
        firstName: "Jane",
        email: "jane@example.com",
      }),
    );

    expect(response.status).toBe(400);
    expect(mocks.createUser).not.toHaveBeenCalled();
  });

  it("TC-ADM-USR-07: rejects missing email", async () => {
    const response = await POST(
      createRequest({
        firstName: "Jane",
        lastName: "Smith",
      }),
    );

    expect(response.status).toBe(400);
    expect(mocks.createUser).not.toHaveBeenCalled();
  });

  it("TC-ADM-USR-08: rejects whitespace-only names", async () => {
    const response = await POST(
      createRequest({
        ...validUser,
        firstName: "   ",
      }),
    );

    expect(response.status).toBe(400);
    expect(mocks.createUser).not.toHaveBeenCalled();
  });

  it("TC-ADM-USR-09: rejects invalid email format", async () => {
    const response = await POST(
      createRequest({
        ...validUser,
        email: "invalid-email",
      }),
    );

    expect(response.status).toBe(400);
    expect(mocks.createUser).not.toHaveBeenCalled();
  });

  // DUPLICATE EMAIL HANDLING

  it("TC-ADM-USR-10: rejects duplicate email", async () => {
    mocks.findUnique.mockResolvedValue(createdUser);

    const response = await POST(createRequest());
    const result = await response.json();

    expect(response.status).toBe(400);
    expect(result.error).toBe("Email already exists");
    expect(mocks.createUser).not.toHaveBeenCalled();
  });

  it("TC-ADM-USR-11: normalises email before duplicate lookup", async () => {
    const response = await POST(
      createRequest({
        ...validUser,
        email: "  JANE@EXAMPLE.COM  ",
      }),
    );

    expect(response.status).toBe(200);

    expect(mocks.findUnique).toHaveBeenCalledWith({
      where: {
        email: "jane@example.com",
      },
    });
  });

  // TEMPORARY PASSWORD SECURITY

  it("TC-ADM-USR-12: generates a temporary password", async () => {
    const response = await POST(createRequest());
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(mocks.nanoid).toHaveBeenCalledWith(10);
    expect(result.tempPassword).toBe("TempPass12");
  });

  it("TC-ADM-USR-13: hashes the temporary password", async () => {
    await POST(createRequest());

    expect(mocks.hash).toHaveBeenCalledWith(
      "TempPass12",
      10,
    );

    expect(mocks.createUser).toHaveBeenCalledWith({
      data: expect.objectContaining({
        password: "hashed-password",
      }),
    });
  });

  it("TC-ADM-USR-14: requires password change on first login", async () => {
    await POST(createRequest());

    expect(mocks.createUser).toHaveBeenCalledWith({
      data: expect.objectContaining({
        mustChangePassword: true,
      }),
    });
  });

  // ROLE ASSIGNMENT

  it("TC-ADM-USR-15: assigns the USER role explicitly", async () => {
    await POST(createRequest());

    expect(mocks.createUser).toHaveBeenCalledWith({
      data: expect.objectContaining({
        role: "USER",
      }),
    });
  });

  // OPTIONAL ADDRESS

  it("TC-ADM-USR-16: creates an optional address", async () => {
    const response = await POST(
      createRequest({
        ...validUser,
        address: "10 Main Street",
      }),
    );

    expect(response.status).toBe(200);

    expect(mocks.createAddress).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "resident-001",
        street: "10 Main Street",
      }),
    });
  });

  it("TC-ADM-USR-17: creates resident without an address", async () => {
    const response = await POST(createRequest());

    expect(response.status).toBe(200);
    expect(mocks.createAddress).not.toHaveBeenCalled();
  });

  // ERROR HANDLING

  it("TC-ADM-USR-18: handles password hashing failure", async () => {
    mocks.hash.mockRejectedValue(
      new Error("Hashing failed"),
    );

    const response = await POST(createRequest());
    const result = await response.json();

    expect(response.status).toBe(500);
    expect(result.error).toBe("Server error");
    expect(mocks.createUser).not.toHaveBeenCalled();
  });

  it("TC-ADM-USR-19: handles user insertion failure", async () => {
    mocks.createUser.mockRejectedValue(
      new Error("Database insertion failed"),
    );

    const response = await POST(createRequest());
    const result = await response.json();

    expect(response.status).toBe(500);
    expect(result.error).toBe("Server error");
  });

  it("TC-ADM-USR-20: handles address creation failure", async () => {
    mocks.createAddress.mockRejectedValue(
      new Error("Address insertion failed"),
    );

    const response = await POST(
      createRequest({
        ...validUser,
        address: "10 Main Street",
      }),
    );

    expect(response.status).toBe(500);
  });

  it("TC-ADM-USR-21: handles malformed JSON", async () => {
    const request = new Request(
      "http://localhost:3000/api/admin/create-users",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: "{invalid-json",
      },
    );

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(mocks.createUser).not.toHaveBeenCalled();
  });

  // RESPONSE STRUCTURE

  it("TC-ADM-USR-22: returns expected success response", async () => {
    const response = await POST(createRequest());
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result).toEqual({
      message: "User created successfully",
      tempPassword: "TempPass12",
    });

    expect(result).not.toHaveProperty("password");
    expect(result).not.toHaveProperty("hashedPassword");
  });

  // SENSITIVE INFORMATION HANDLING

  it("TC-ADM-USR-23: does not log temporary passwords", async () => {
    await POST(createRequest());

    const logSpy = vi.mocked(console.log);

    const loggedContent = logSpy.mock.calls
      .map((args) => args.map(String).join(" "))
      .join(" ");

    expect(loggedContent).not.toContain("TempPass12");
  });

  // DATA INTEGRITY


it("TC-ADM-USR-24: propagates address failure from the transaction", async () => {
  mocks.createAddress.mockRejectedValue(
    new Error("Address creation failed")
  );

  const response = await POST(
    createRequest({
      ...validUser,
      address: "10 Main Street",
    })
  );

  const result = await response.json();

  expect(response.status).toBe(500);
  expect(result.error).toBe("Server error");

  expect(mocks.createUser).toHaveBeenCalledTimes(1);
  expect(mocks.createAddress).toHaveBeenCalledTimes(1);
});

});

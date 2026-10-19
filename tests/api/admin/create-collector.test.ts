
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
  createCollectorProfile: vi.fn(),
  transaction: vi.fn(),
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
    },
    $transaction: mocks.transaction,
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

import { POST } from "@/app/api/admin/create-collectors/route";

const validCollector = {
  firstName: "John",
  lastName: "Doe",
  email: "john@example.com",
  phone: "07123456789",
  zone: "Central",
};

const createdUser = {
  id: "collector-001",
  ...validCollector,
  role: "COLLECTOR",
  mustChangePassword: true,
};

const createRequest = (
  body: Record<string, unknown> = validCollector,
) =>
  new Request(
    "http://localhost:3000/api/admin/create-collectors",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );

describe("POST /api/admin/create-collectors - Unit Tests", () => {
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

    mocks.createCollectorProfile.mockResolvedValue({
      id: "profile-001",
      userId: "collector-001",
      zone: "Central",
      isActive: true,
    });

    mocks.transaction.mockImplementation(
      async (
        callback: (tx: {
          user: { create: typeof mocks.createUser };
          collectorProfile: {
            create: typeof mocks.createCollectorProfile;
          };
        }) => Promise<unknown>,
      ) =>
        callback({
          user: {
            create: mocks.createUser,
          },
          collectorProfile: {
            create: mocks.createCollectorProfile,
          },
        }),
    );

    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // SUCCESSFUL CREATION

  it("TC-ADM-COL-01: creates a valid collector", async () => {
    const response = await POST(createRequest());
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.message).toBe(
      "Collector created successfully",
    );
    expect(mocks.createUser).toHaveBeenCalledTimes(1);
    expect(mocks.createCollectorProfile).toHaveBeenCalledTimes(1);
  });

  // AUTHENTICATION AND AUTHORISATION

  it("TC-ADM-COL-02: rejects unauthenticated requests", async () => {
    mocks.verifyAuth.mockResolvedValue(null);

    const response = await POST(createRequest());

    expect(response.status).toBe(401);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("TC-ADM-COL-03: rejects resident users", async () => {
    mocks.verifyAuth.mockResolvedValue({
      id: "resident-001",
      role: "USER",
    });

    const response = await POST(createRequest());

    expect(response.status).toBe(403);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("TC-ADM-COL-04: rejects collector users", async () => {
    mocks.verifyAuth.mockResolvedValue({
      id: "collector-001",
      role: "COLLECTOR",
    });

    const response = await POST(createRequest());

    expect(response.status).toBe(403);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  // REQUIRED FIELDS

  it("TC-ADM-COL-05: rejects missing first name", async () => {
    const response = await POST(
      createRequest({
        lastName: "Doe",
        email: "john@example.com",
        zone: "Central",
      }),
    );

    expect(response.status).toBe(400);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("TC-ADM-COL-06: rejects missing last name", async () => {
    const response = await POST(
      createRequest({
        firstName: "John",
        email: "john@example.com",
        zone: "Central",
      }),
    );

    expect(response.status).toBe(400);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("TC-ADM-COL-07: rejects missing email", async () => {
    const response = await POST(
      createRequest({
        firstName: "John",
        lastName: "Doe",
        zone: "Central",
      }),
    );

    expect(response.status).toBe(400);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("TC-ADM-COL-08: rejects missing zone", async () => {
    const response = await POST(
      createRequest({
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
      }),
    );

    expect(response.status).toBe(400);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  // INPUT VALIDATION

  it("TC-ADM-COL-09: rejects whitespace-only first name", async () => {
    const response = await POST(
      createRequest({
        ...validCollector,
        firstName: "   ",
      }),
    );

    expect(response.status).toBe(400);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("TC-ADM-COL-10: rejects whitespace-only zone", async () => {
    const response = await POST(
      createRequest({
        ...validCollector,
        zone: "   ",
      }),
    );

    expect(response.status).toBe(400);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("TC-ADM-COL-11: rejects invalid email format", async () => {
    const response = await POST(
      createRequest({
        ...validCollector,
        email: "invalid-email",
      }),
    );

    expect(response.status).toBe(400);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("TC-ADM-COL-12: rejects non-string first name", async () => {
    const response = await POST(
      createRequest({
        ...validCollector,
        firstName: 123,
      }),
    );

    expect(response.status).toBe(400);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  // DUPLICATE PREVENTION

  it("TC-ADM-COL-13: rejects duplicate email", async () => {
    mocks.findUnique.mockResolvedValue(createdUser);

    const response = await POST(createRequest());
    const result = await response.json();

    expect(response.status).toBe(400);
    expect(result.error).toBe("Email already exists");
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("TC-ADM-COL-14: normalises email before duplicate lookup", async () => {
    const response = await POST(
      createRequest({
        ...validCollector,
        email: "  JOHN@EXAMPLE.COM  ",
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.findUnique).toHaveBeenCalledWith({
      where: {
        email: "john@example.com",
      },
    });
  });

  // PASSWORD SECURITY

  it("TC-ADM-COL-15: generates a temporary password", async () => {
    const response = await POST(createRequest());
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(mocks.nanoid).toHaveBeenCalledWith(10);
    expect(result.tempPassword).toBe("TempPass12");
  });

  it("TC-ADM-COL-16: hashes the temporary password", async () => {
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

  it("TC-ADM-COL-17: requires password change", async () => {
    await POST(createRequest());

    expect(mocks.createUser).toHaveBeenCalledWith({
      data: expect.objectContaining({
        mustChangePassword: true,
      }),
    });
  });

  // ROLE ASSIGNMENT

  it("TC-ADM-COL-18: assigns the COLLECTOR role", async () => {
    await POST(createRequest());

    expect(mocks.createUser).toHaveBeenCalledWith({
      data: expect.objectContaining({
        role: "COLLECTOR",
      }),
    });
  });

  // COLLECTOR PROFILE

  it("TC-ADM-COL-19: creates collector profile with correct zone", async () => {
    await POST(createRequest());

    expect(mocks.createCollectorProfile).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "collector-001",
        zone: "Central",
      }),
    });
  });

  // TRANSACTION HANDLING

  it("TC-ADM-COL-20: uses a transaction for account and profile creation", async () => {
    await POST(createRequest());

    expect(mocks.transaction).toHaveBeenCalledTimes(1);
    expect(mocks.createUser).toHaveBeenCalledTimes(1);
    expect(mocks.createCollectorProfile).toHaveBeenCalledTimes(1);
  });

  // ERROR HANDLING

  it("TC-ADM-COL-21: handles password hashing failure", async () => {
    mocks.hash.mockRejectedValue(
      new Error("Hashing failed"),
    );

    const response = await POST(createRequest());

    expect(response.status).toBe(500);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("TC-ADM-COL-22: handles user insertion failure", async () => {
    mocks.createUser.mockRejectedValue(
      new Error("User insertion failed"),
    );

    const response = await POST(createRequest());

    expect(response.status).toBe(500);
  });

  it("TC-ADM-COL-23: handles collector profile insertion failure", async () => {
    mocks.createCollectorProfile.mockRejectedValue(
      new Error("Profile insertion failed"),
    );

    const response = await POST(createRequest());

    expect(response.status).toBe(500);
    expect(mocks.transaction).toHaveBeenCalledTimes(1);
  });

  it("TC-ADM-COL-24: rejects malformed JSON", async () => {
    const request = new Request(
      "http://localhost:3000/api/admin/create-collectors",
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
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  // RESPONSE STRUCTURE

  it("TC-ADM-COL-25: returns the expected success response", async () => {
    const response = await POST(createRequest());
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result).toEqual({
      message: "Collector created successfully",
      tempPassword: "TempPass12",
    });

    expect(result).not.toHaveProperty("password");
    expect(result).not.toHaveProperty("hashedPassword");
  });

  // SENSITIVE INFORMATION

  it("TC-ADM-COL-26: does not log temporary passwords", async () => {
    await POST(createRequest());

    const loggedContent = vi
      .mocked(console.log)
      .mock.calls
      .map((args) => args.map(String).join(" "))
      .join(" ");

    expect(loggedContent).not.toContain("TempPass12");
  });
});

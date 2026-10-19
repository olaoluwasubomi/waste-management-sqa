
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { randomUUID } from "node:crypto";
import bcrypt from "bcrypt";
import { Role } from "@prisma/client";
import { assertTestDatabase } from "./test-database";

const mocks = vi.hoisted(() => ({
  verifyAuth: vi.fn(),
}));

vi.mock("@/lib/verifyAuth", () => ({
  verifyAuth: mocks.verifyAuth,
}));

type CollectorInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  zone: string;
};

const emailPrefix = `sqa-create-collector-${randomUUID()}-`;

function makeCollector(
  overrides: Partial<CollectorInput> = {},
): CollectorInput {
  return {
    firstName: "Integration",
    lastName: "Collector",
    email: `${emailPrefix}${randomUUID()}@example.com`,
    phone: "08012345678",
    zone: "Central",
    ...overrides,
  };
}

function makeRequest(body: unknown): Request {
  return new Request(
    "http://localhost:3000/api/admin/create-collectors",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );
}

describe("POST /api/admin/create-collectors - Integration Tests", () => {
  let prisma: typeof import("@/lib/prisma").default;
  let POST: typeof import("@/app/api/admin/create-collectors/route").POST;

  beforeAll(async () => {
    // Safety guard: never execute against the development database.
    assertTestDatabase();

    prisma = (await import("@/lib/prisma")).default;
    POST = (
      await import("@/app/api/admin/create-collectors/route")
    ).POST;
  });

  beforeEach(() => {
    vi.clearAllMocks();

    mocks.verifyAuth.mockResolvedValue({
      id: "integration-admin",
      role: "ADMIN",
    });
  });

  afterAll(async () => {
    if (!prisma) return;

    // Clean only records created with this suite's unique prefix.
    // CollectorProfile records are removed through onDelete: Cascade.
    await prisma.user.deleteMany({
      where: {
        email: {
          startsWith: emailPrefix,
        },
      },
    });

    await prisma.$disconnect();
  });

  it("TC-INT-ADM-COL-01: persists a collector account with the correct role", async () => {
    const data = makeCollector();

    const response = await POST(makeRequest(data));
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.message).toBe(
      "Collector created successfully",
    );

    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    expect(user).not.toBeNull();
    expect(user?.firstName).toBe(data.firstName);
    expect(user?.lastName).toBe(data.lastName);
    expect(user?.role).toBe(Role.COLLECTOR);
  });

  it("TC-INT-ADM-COL-02: stores a hashed password instead of the temporary password", async () => {
    const data = makeCollector();

    const response = await POST(makeRequest(data));
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(typeof result.tempPassword).toBe("string");

    const user = await prisma.user.findUniqueOrThrow({
      where: { email: data.email },
    });

    expect(user.password).not.toBe(result.tempPassword);

    const passwordMatches = await bcrypt.compare(
      result.tempPassword,
      user.password,
    );

    expect(passwordMatches).toBe(true);
  });

  it("TC-INT-ADM-COL-03: requires a password change on first login", async () => {
    const data = makeCollector();

    const response = await POST(makeRequest(data));

    expect(response.status).toBe(200);

    const user = await prisma.user.findUniqueOrThrow({
      where: { email: data.email },
    });

    expect(user.mustChangePassword).toBe(true);
  });

  it("TC-INT-ADM-COL-04: creates a linked collector profile with the correct zone", async () => {
    const data = makeCollector({
      zone: "Lagos Mainland",
    });

    const response = await POST(makeRequest(data));

    expect(response.status).toBe(200);

    const user = await prisma.user.findUniqueOrThrow({
      where: { email: data.email },
      include: {
        collectorProfile: true,
      },
    });

    expect(user.collectorProfile).not.toBeNull();
    expect(user.collectorProfile?.userId).toBe(user.id);
    expect(user.collectorProfile?.zone).toBe(
      "Lagos Mainland",
    );
  });

  it("TC-INT-ADM-COL-05: uses the default active status for a new collector profile", async () => {
    const data = makeCollector();

    const response = await POST(makeRequest(data));

    expect(response.status).toBe(200);

    const user = await prisma.user.findUniqueOrThrow({
      where: { email: data.email },
      include: {
        collectorProfile: true,
      },
    });

    expect(user.collectorProfile?.isActive).toBe(true);
  });

  it("TC-INT-ADM-COL-06: rejects duplicate email addresses without creating another profile", async () => {
    const data = makeCollector();

    const firstResponse = await POST(makeRequest(data));
    expect(firstResponse.status).toBe(200);

    const secondResponse = await POST(makeRequest(data));
    const result = await secondResponse.json();

    expect(secondResponse.status).toBe(400);
    expect(result.error).toBe("Email already exists");

    const users = await prisma.user.findMany({
      where: { email: data.email },
      include: { collectorProfile: true },
    });

    expect(users).toHaveLength(1);
    expect(users[0].collectorProfile).not.toBeNull();
  });

  it("TC-INT-ADM-COL-07: normalises email before saving it", async () => {
    const data = makeCollector();

    const response = await POST(
      makeRequest({
        ...data,
        email: `  ${data.email.toUpperCase()}  `,
      }),
    );

    expect(response.status).toBe(200);

    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    expect(user).not.toBeNull();
    expect(user?.email).toBe(data.email);
  });

  it("TC-INT-ADM-COL-08: rejects an invalid email without saving an account", async () => {
    const data = makeCollector({
      email: `${emailPrefix}${randomUUID()}-invalid`,
    });

    const response = await POST(makeRequest(data));

    expect(response.status).toBe(400);

    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    expect(user).toBeNull();
  });

  it("TC-INT-ADM-COL-09: rejects whitespace-only zone without saving an account", async () => {
    const data = makeCollector({
      zone: "   ",
    });

    const response = await POST(makeRequest(data));

    expect(response.status).toBe(400);

    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    expect(user).toBeNull();
  });

  it("TC-INT-ADM-COL-10: rejects unauthenticated requests without saving an account", async () => {
    mocks.verifyAuth.mockResolvedValue(null);

    const data = makeCollector();
    const response = await POST(makeRequest(data));

    expect(response.status).toBe(401);

    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    expect(user).toBeNull();
  });

  it("TC-INT-ADM-COL-11: rejects resident users without saving an account", async () => {
    mocks.verifyAuth.mockResolvedValue({
      id: "integration-resident",
      role: "USER",
    });

    const data = makeCollector();
    const response = await POST(makeRequest(data));

    expect(response.status).toBe(403);

    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    expect(user).toBeNull();
  });

  it("TC-INT-ADM-COL-12: rejects malformed JSON", async () => {
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
  });

  it("TC-INT-ADM-COL-13: rolls back account creation when collector profile insertion fails", async () => {
    const data = makeCollector();

    const originalTransaction =
      prisma.$transaction.bind(prisma);

    const transactionSpy = vi
      .spyOn(prisma, "$transaction")
      .mockImplementation(
        (async (callback: unknown) => {
          if (typeof callback !== "function") {
            throw new Error(
              "Expected an interactive transaction",
            );
          }

          return originalTransaction(async (tx) => {
            // Replace only the profile insertion in this test.
            // A nonexistent userId triggers a PostgreSQL
            // foreign-key constraint failure.
            const wrappedTx = {
              user: tx.user,
              collectorProfile: {
                create: async () =>
                  tx.collectorProfile.create({
                    data: {
                      userId: randomUUID(),
                      zone: "Rollback Test Zone",
                    },
                  }),
              },
            };

            return callback(wrappedTx);
          });
        }) as typeof prisma.$transaction,
      );

    const consoleSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    try {
      const response = await POST(makeRequest(data));

      expect(response.status).toBe(500);

      const savedUser = await prisma.user.findUnique({
        where: { email: data.email },
      });

      // The user insert must also be rolled back.
      expect(savedUser).toBeNull();

      const matchingUsers = await prisma.user.count({
        where: {
          email: data.email,
        },
      });

      expect(matchingUsers).toBe(0);
    } finally {
      transactionSpy.mockRestore();
      consoleSpy.mockRestore();
    }
  });
});

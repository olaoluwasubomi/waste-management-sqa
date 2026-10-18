
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import type { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { assertTestDatabase } from "./test-database";

const mocks = vi.hoisted(() => ({
  verifyAuth: vi.fn(),
}));

vi.mock("@/lib/verifyAuth", () => ({
  verifyAuth: mocks.verifyAuth,
}));

describe("POST /api/admin/create-users - PostgreSQL Integration", () => {
  let prisma: PrismaClient;
  let POST: typeof import(
    "@/app/api/admin/create-users/route"
  ).POST;

  const unique = crypto.randomUUID().replace(/-/g, "");
  const emailPrefix = `sqa-create-user-${unique}`;
  const createdUserIds: string[] = [];

  const makeEmail = (suffix: string) =>
    `${emailPrefix}-${suffix}@example.com`;

  const makeRequest = (
    data: Record<string, unknown>,
  ) =>
    new Request(
      "http://localhost:3000/api/admin/create-users",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      },
    );

  const validData = (
    suffix: string,
    overrides: Record<string, unknown> = {},
  ) => ({
    firstName: "Jane",
    lastName: "Smith",
    email: makeEmail(suffix),
    phone: "07123456789",
    ...overrides,
  });

  const createResident = async (
    suffix: string,
    overrides: Record<string, unknown> = {},
  ) => {
    const data = validData(suffix, overrides);
    const response = await POST(makeRequest(data));
    const result = await response.json();

    if (response.status === 200) {
      const saved = await prisma.user.findUnique({
        where: { email: String(data.email).trim().toLowerCase() },
      });

      if (saved) createdUserIds.push(saved.id);
    }

    return { response, result, data };
  };

  beforeAll(async () => {
    assertTestDatabase();

    const prismaModule = await import("@/lib/prisma");
    prisma = prismaModule.default;

    const routeModule = await import(
      "@/app/api/admin/create-users/route"
    );
    POST = routeModule.POST;

    await prisma.$connect();
  });

  beforeEach(() => {
    mocks.verifyAuth.mockReset();
    mocks.verifyAuth.mockResolvedValue({
      id: crypto.randomUUID(),
      role: "ADMIN",
    });
  });

  afterAll(async () => {
    if (!prisma) return;

    try {
      if (createdUserIds.length > 0) {
        await prisma.user.deleteMany({
          where: {
            id: { in: createdUserIds },
            email: { startsWith: emailPrefix },
          },
        });
      }
    } finally {
      await prisma.$disconnect();
    }
  });

  it("TC-INT-ADM-USR-01: creates and persists a resident", async () => {
    const { response, result, data } =
      await createResident("create");

    expect(response.status).toBe(200);
    expect(result.message).toBe(
      "User created successfully",
    );

    const saved = await prisma.user.findUnique({
      where: { email: data.email },
    });

    expect(saved).not.toBeNull();
    expect(saved?.firstName).toBe("Jane");
    expect(saved?.lastName).toBe("Smith");
    expect(saved?.role).toBe("USER");
  });

  it("TC-INT-ADM-USR-02: stores a hashed password", async () => {
    const { response, result, data } =
      await createResident("password");

    expect(response.status).toBe(200);
    expect(typeof result.tempPassword).toBe("string");

    const saved = await prisma.user.findUnique({
      where: { email: data.email },
    });

    expect(saved).not.toBeNull();
    expect(saved?.password).not.toBe(result.tempPassword);

    const matches = await bcrypt.compare(
      result.tempPassword,
      saved!.password,
    );

    expect(matches).toBe(true);
  });

  it("TC-INT-ADM-USR-03: requires password change", async () => {
    const { response, data } =
      await createResident("password-change");

    expect(response.status).toBe(200);

    const saved = await prisma.user.findUnique({
      where: { email: data.email },
    });

    expect(saved?.mustChangePassword).toBe(true);
  });

  it("TC-INT-ADM-USR-04: persists the optional address", async () => {
    const { response, data } = await createResident(
      "address",
      { address: "10 Main Street" },
    );

    expect(response.status).toBe(200);

    const saved = await prisma.user.findUnique({
      where: { email: data.email },
      include: { addresses: true },
    });

    expect(saved?.addresses).toHaveLength(1);
    expect(saved?.addresses[0].street).toBe(
      "10 Main Street",
    );
    expect(saved?.addresses[0].city).toBe("Lagos");
    expect(saved?.addresses[0].state).toBe("Lagos");
  });

  it("TC-INT-ADM-USR-05: creates a resident without an address", async () => {
    const { response, data } =
      await createResident("no-address");

    expect(response.status).toBe(200);

    const saved = await prisma.user.findUnique({
      where: { email: data.email },
      include: { addresses: true },
    });

    expect(saved?.addresses).toHaveLength(0);
  });

  it("TC-INT-ADM-USR-06: rejects duplicate email", async () => {
    const { response, data } =
      await createResident("duplicate");

    expect(response.status).toBe(200);

    const secondResponse = await POST(
      makeRequest(data),
    );

    expect(secondResponse.status).toBe(400);

    const count = await prisma.user.count({
      where: { email: data.email },
    });

    expect(count).toBe(1);
  });

  it("TC-INT-ADM-USR-07: normalises email before persistence", async () => {
    const email = makeEmail("normalise");

    const { response } = await createResident(
      "normalise",
      {
        email: `  ${email.toUpperCase()}  `,
      },
    );

    expect(response.status).toBe(200);

    const saved = await prisma.user.findUnique({
      where: { email },
    });

    expect(saved).not.toBeNull();
    expect(saved?.email).toBe(email);
  });

  it("TC-INT-ADM-USR-08: rejects invalid email without insertion", async () => {
    const invalidEmail = "invalid-email";

    const response = await POST(
      makeRequest(
        validData("invalid", {
          email: invalidEmail,
        }),
      ),
    );

    expect(response.status).toBe(400);

    const count = await prisma.user.count({
      where: { email: invalidEmail },
    });

    expect(count).toBe(0);
  });

  it("TC-INT-ADM-USR-09: rejects whitespace-only names", async () => {
    const data = validData("blank-name", {
      firstName: "   ",
    });

    const response = await POST(makeRequest(data));

    expect(response.status).toBe(400);

    const saved = await prisma.user.findUnique({
      where: { email: data.email },
    });

    expect(saved).toBeNull();
  });

  it("TC-INT-ADM-USR-10: rejects unauthenticated creation", async () => {
    const data = validData("unauthenticated");

    mocks.verifyAuth.mockResolvedValueOnce(null);

    const response = await POST(makeRequest(data));

    expect(response.status).toBe(401);

    const saved = await prisma.user.findUnique({
      where: { email: data.email },
    });

    expect(saved).toBeNull();
  });

  it("TC-INT-ADM-USR-11: rejects non-admin creation", async () => {
    const data = validData("non-admin");

    mocks.verifyAuth.mockResolvedValueOnce({
      id: crypto.randomUUID(),
      role: "USER",
    });

    const response = await POST(makeRequest(data));

    expect(response.status).toBe(403);

    const saved = await prisma.user.findUnique({
      where: { email: data.email },
    });

    expect(saved).toBeNull();
  });

  it("TC-INT-ADM-USR-12: rolls back user creation when address insertion fails", async () => {
    const data = validData("rollback", {
      address: "Rollback Test Street",
    });

    // A real transaction rollback requires a genuine database
    // error inside the transaction. For this test, the production
    // transaction is used with an intentionally invalid value
    // supplied through a test-specific transaction wrapper.
    //
    // The actual rollback assertion is performed by checking
    // PostgreSQL after the transaction fails.

    const originalTransaction = prisma.$transaction.bind(prisma);

    const transactionSpy = vi
      .spyOn(prisma, "$transaction")
      .mockImplementation((async (callback: unknown) => {
        if (typeof callback !== "function") {
          throw new Error("Expected interactive transaction");
        }

        return originalTransaction(async (tx) => {
          const wrappedTx = {
            user: tx.user,
            address: {
              create: async () => {
                // Deliberately violate the required street field
                // using the real transaction connection.
              return tx.address.create({
                data: {
                    street: "Rollback Test Street",
                    city: "Lagos",
                    state: "Lagos",
                    userId: crypto.randomUUID(),
                },
                });
              },
            },
          };

          return callback(wrappedTx);
        });
      }) as typeof prisma.$transaction);

    try {
      const response = await POST(makeRequest(data));

      expect(response.status).toBe(500);

      const saved = await prisma.user.findUnique({
        where: { email: data.email },
      });

      expect(saved).toBeNull();
    } finally {
      transactionSpy.mockRestore();
    }
  });
});

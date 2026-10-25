
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

const mocks = vi.hoisted(() => ({
  verifyAuth: vi.fn(),
}));

vi.mock("@/lib/verifyAuth", () => ({
  verifyAuth: mocks.verifyAuth,
}));

type PrismaClientType =
  typeof import("@/lib/prisma")["default"];

type GetUsersHandler =
  typeof import("@/app/api/admin/get-users/route")["GET"];

let prisma: PrismaClientType;
let GET: GetUsersHandler;

const prefix = `sqa-get-users-${randomUUID()}-`;

const emails = {
  john: `${prefix}john@example.com`,
  jane: `${prefix}jane@example.com`,
  other: `${prefix}other@example.com`,
  admin: `${prefix}admin@example.com`,
  collector: `${prefix}collector@example.com`,
};

const password = "sqa-integration-test-hash";

function request(query: Record<string, string> = {}) {
  const url = new URL(
    "http://localhost:3000/api/admin/get-users"
  );

  for (const [key, value] of Object.entries(query)) {
    url.searchParams.set(key, value);
  }

  return new Request(url.toString(), {
    method: "GET",
  });
}

async function getUsers(query: Record<string, string> = {}) {
  const response = await GET(request(query));
  const body = await response.json();

  return { response, body };
}

describe("GET /api/admin/get-users - PostgreSQL Integration", () => {
  beforeAll(async () => {
    const { assertTestDatabase } = await import(
      "./test-database"
    );

    assertTestDatabase();

    const prismaModule = await import("@/lib/prisma");
    prisma = prismaModule.default;

    const routeModule = await import(
      "@/app/api/admin/get-users/route"
    );
    GET = routeModule.GET;

    await prisma.user.createMany({
      data: [
        {
          firstName: "John",
          lastName: "Doe",
          email: emails.john,
          password,
          role: "USER",
          mustChangePassword: false,
        },
        {
          firstName: "Jane",
          lastName: "Smith",
          email: emails.jane,
          password,
          role: "USER",
          mustChangePassword: true,
        },
        {
          firstName: "Other",
          lastName: "Person",
          email: emails.other,
          password,
          role: "USER",
          mustChangePassword: false,
        },
        {
          firstName: "Admin",
          lastName: "Example",
          email: emails.admin,
          password,
          role: "ADMIN",
          mustChangePassword: false,
        },
        {
          firstName: "Collector",
          lastName: "Example",
          email: emails.collector,
          password,
          role: "COLLECTOR",
          mustChangePassword: false,
        },
      ],
    });
  });

  beforeEach(() => {
    vi.clearAllMocks();

    mocks.verifyAuth.mockResolvedValue({
      id: "sqa-admin",
      role: "ADMIN",
    });
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.user.deleteMany({
        where: {
          email: {
            startsWith: prefix,
          },
        },
      });

      await prisma.$disconnect();
    }
  });

  it("TC-INT-ADM-GETUSR-01: retrieves resident accounts", async () => {
    const { response, body } = await getUsers({
      email: prefix,
    });

    expect(response.status).toBe(200);
    expect(Array.isArray(body)).toBe(true);

    const resultEmails = body.map(
      (user: { email: string }) => user.email
    );

    expect(resultEmails).toContain(emails.john);
    expect(resultEmails).toContain(emails.jane);
    expect(resultEmails).toContain(emails.other);
  });

  it("TC-INT-ADM-GETUSR-02: excludes admins and collectors", async () => {
    const { response, body } = await getUsers({
      email: prefix,
    });

    expect(response.status).toBe(200);

    const resultEmails = body.map(
      (user: { email: string }) => user.email
    );

    expect(resultEmails).not.toContain(emails.admin);
    expect(resultEmails).not.toContain(emails.collector);

    expect(
      body.every(
        (user: { role: string }) => user.role === "USER"
      )
    ).toBe(true);
  });

  it("TC-INT-ADM-GETUSR-03: searches by first name", async () => {
    const { response, body } = await getUsers({
      name: "John",
      email: prefix,
    });

    expect(response.status).toBe(200);
    expect(body).toHaveLength(1);
    expect(body[0].email).toBe(emails.john);
  });

  it("TC-INT-ADM-GETUSR-04: searches by last name", async () => {
    const { response, body } = await getUsers({
      name: "Smith",
      email: prefix,
    });

    expect(response.status).toBe(200);
    expect(body).toHaveLength(1);
    expect(body[0].email).toBe(emails.jane);
  });

  it("TC-INT-ADM-GETUSR-05: matches both full-name components", async () => {
    const { response, body } = await getUsers({
      name: "John Doe",
      email: prefix,
    });

    expect(response.status).toBe(200);
    expect(body).toHaveLength(1);
    expect(body[0].email).toBe(emails.john);

    const mismatch = await getUsers({
      name: "John Smith",
      email: prefix,
    });

    expect(mismatch.response.status).toBe(200);
    expect(mismatch.body).toEqual([]);
  });

  it("TC-INT-ADM-GETUSR-06: handles extra spaces in full names", async () => {
    const { response, body } = await getUsers({
      name: "  John   Doe  ",
      email: prefix,
    });

    expect(response.status).toBe(200);
    expect(body).toHaveLength(1);
    expect(body[0].email).toBe(emails.john);
  });

  it("TC-INT-ADM-GETUSR-07: searches email case-insensitively", async () => {
    const { response, body } = await getUsers({
      email: emails.john.toUpperCase(),
    });

    expect(response.status).toBe(200);
    expect(body).toHaveLength(1);
    expect(body[0].email).toBe(emails.john);
  });

  it("TC-INT-ADM-GETUSR-08: filters ACTIVE residents", async () => {
    const { response, body } = await getUsers({
      email: prefix,
      status: "ACTIVE",
    });

    expect(response.status).toBe(200);

    const resultEmails = body.map(
      (user: { email: string }) => user.email
    );

    expect(resultEmails).toContain(emails.john);
    expect(resultEmails).toContain(emails.other);
    expect(resultEmails).not.toContain(emails.jane);

    expect(
      body.every(
        (user: { status: string }) =>
          user.status === "ACTIVE"
      )
    ).toBe(true);
  });

  it("TC-INT-ADM-GETUSR-09: filters PENDING residents", async () => {
    const { response, body } = await getUsers({
      email: prefix,
      status: "PENDING",
    });

    expect(response.status).toBe(200);
    expect(body).toHaveLength(1);
    expect(body[0].email).toBe(emails.jane);
    expect(body[0].status).toBe("PENDING");
  });

  it("TC-INT-ADM-GETUSR-10: combines multiple filters", async () => {
    const { response, body } = await getUsers({
      name: "John",
      email: prefix,
      status: "active",
    });

    expect(response.status).toBe(200);
    expect(body).toHaveLength(1);
    expect(body[0].email).toBe(emails.john);
  });

  it("TC-INT-ADM-GETUSR-11: rejects invalid status filters", async () => {
    const { response, body } = await getUsers({
      status: "UNKNOWN",
    });

    expect(response.status).toBe(400);
    expect(body.error).toBe("Invalid status filter");
  });

  it("TC-INT-ADM-GETUSR-12: enforces access restrictions", async () => {
    mocks.verifyAuth.mockResolvedValue(null);

    const unauthenticated = await getUsers({
      email: prefix,
    });

    expect(unauthenticated.response.status).toBe(401);

    mocks.verifyAuth.mockResolvedValue({
      id: "sqa-resident",
      role: "USER",
    });

    const resident = await getUsers({
      email: prefix,
    });

    expect(resident.response.status).toBe(403);

    mocks.verifyAuth.mockResolvedValue({
      id: "sqa-collector",
      role: "COLLECTOR",
    });

    const collector = await getUsers({
      email: prefix,
    });

    expect(collector.response.status).toBe(403);
  });

  it("TC-INT-ADM-GETUSR-13: excludes sensitive response fields", async () => {
    const { response, body } = await getUsers({
      email: emails.john,
    });

    expect(response.status).toBe(200);
    expect(body).toHaveLength(1);

    expect(body[0]).toEqual({
      id: expect.any(String),
      name: "John Doe",
      email: emails.john,
      role: "USER",
      status: "ACTIVE",
    });

    expect(body[0]).not.toHaveProperty("password");
    expect(body[0]).not.toHaveProperty("phone");
    expect(body[0]).not.toHaveProperty(
      "mustChangePassword"
    );
  });

  it("TC-INT-ADM-GETUSR-14: returns empty results for unmatched searches", async () => {
    const { response, body } = await getUsers({
      email: `${prefix}does-not-exist@example.com`,
    });

    expect(response.status).toBe(200);
    expect(body).toEqual([]);
  });
});


import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import type { PrismaClient } from "@prisma/client";
import { assertTestDatabase } from "./test-database";

const mocks = vi.hoisted(() => ({
  verifyAuth: vi.fn(),
}));

vi.mock("@/lib/verifyAuth", () => ({
  verifyAuth: mocks.verifyAuth,
}));

describe("Admin create waste type PostgreSQL integration", () => {
  let prisma: PrismaClient;
  let POST: typeof import(
    "@/app/api/admin/create-wastetypes/route"
  ).POST;

  const unique = crypto.randomUUID();
  const createdIds: string[] = [];
  const testPrefix = `SQA-WASTE-${unique}`;

  const createRequest = (
    fields: Record<string, string>,
  ) => {
    const formData = new FormData();

    Object.entries(fields).forEach(([key, value]) => {
      formData.append(key, value);
    });

    return new Request(
      "http://localhost:3000/api/admin/create-wastetypes",
      {
        method: "POST",
        body: formData,
      },
    );
  };

  const createFields = (
    suffix: string,
    overrides: Record<string, string> = {},
  ) => ({
    name: `${testPrefix}-${suffix}`,
    description: "Integration test waste category",
    price: "1000",
    isActive: "true",
    ...overrides,
  });

  beforeAll(async () => {
    assertTestDatabase();

    const prismaModule = await import("@/lib/prisma");
    prisma = prismaModule.default;

    const routeModule = await import(
      "@/app/api/admin/create-wastetypes/route"
    );
    POST = routeModule.POST;

    await prisma.$connect();

    mocks.verifyAuth.mockResolvedValue({
      id: crypto.randomUUID(),
      role: "ADMIN",
    });
  });

  afterAll(async () => {
    if (!prisma) return;

    try {
      if (createdIds.length > 0) {
        await prisma.wasteType.deleteMany({
          where: {
            id: { in: createdIds },
            name: { startsWith: testPrefix },
          },
        });
      }
    } finally {
      await prisma.$disconnect();
    }
  });

  it("TC-INT-ADM-WASTE-01: persists a valid active waste type", async () => {
    const response = await POST(
      createRequest(createFields("ACTIVE")),
    );

    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.message).toBe(
      "Waste type created successfully",
    );

    createdIds.push(result.wasteType.id);

    const saved = await prisma.wasteType.findUnique({
      where: { id: result.wasteType.id },
    });

    expect(saved).not.toBeNull();
    expect(saved?.name).toBe(`${testPrefix}-ACTIVE`);
    expect(saved?.status).toBe("ACTIVE");
    expect(Number(saved?.price)).toBe(1000);
  });

  it("TC-INT-ADM-WASTE-02: persists an inactive waste type", async () => {
    const response = await POST(
      createRequest(
        createFields("INACTIVE", {
          isActive: "false",
        }),
      ),
    );

    const result = await response.json();

    expect(response.status).toBe(200);
    createdIds.push(result.wasteType.id);

    const saved = await prisma.wasteType.findUnique({
      where: { id: result.wasteType.id },
    });

    expect(saved?.status).toBe("INACTIVE");
  });

  it("TC-INT-ADM-WASTE-03: trims name and description before saving", async () => {
    const response = await POST(
      createRequest(
        createFields("TRIM", {
          name: `  ${testPrefix}-TRIM  `,
          description: "  Recyclable materials  ",
        }),
      ),
    );

    const result = await response.json();

    expect(response.status).toBe(200);
    createdIds.push(result.wasteType.id);

    const saved = await prisma.wasteType.findUnique({
      where: { id: result.wasteType.id },
    });

    expect(saved?.name).toBe(`${testPrefix}-TRIM`);
    expect(saved?.description).toBe(
      "Recyclable materials",
    );
  });

  it("TC-INT-ADM-WASTE-04: rejects a duplicate waste type", async () => {
    const fields = createFields("DUPLICATE");

    const firstResponse = await POST(
      createRequest(fields),
    );

    const firstResult = await firstResponse.json();

    expect(firstResponse.status).toBe(200);
    createdIds.push(firstResult.wasteType.id);

    const secondResponse = await POST(
      createRequest(fields),
    );

    const secondResult = await secondResponse.json();

    expect(secondResponse.status).toBe(400);
    expect(secondResult.error).toBe(
      "Waste type already exists",
    );

    const count = await prisma.wasteType.count({
      where: { name: fields.name },
    });

    expect(count).toBe(1);
  });

  it("TC-INT-ADM-WASTE-05: rejects negative prices without insertion", async () => {
    const fields = createFields("NEGATIVE", {
      price: "-100",
    });

    const response = await POST(
      createRequest(fields),
    );

    expect(response.status).toBe(400);

    const count = await prisma.wasteType.count({
      where: { name: fields.name },
    });

    expect(count).toBe(0);
  });

  it("TC-INT-ADM-WASTE-06: rejects whitespace-only names without insertion", async () => {
    const response = await POST(
      createRequest(
        createFields("BLANK", {
          name: "   ",
        }),
      ),
    );

    expect(response.status).toBe(400);

    const count = await prisma.wasteType.count({
      where: {
        name: { startsWith: testPrefix },
      },
    });

    // Only records from successful tests should exist.
    expect(count).toBe(createdIds.length);
  });

  it("TC-INT-ADM-WASTE-07: rejects unauthorised creation", async () => {
    const fields = createFields("UNAUTHORIZED");

    mocks.verifyAuth.mockResolvedValueOnce({
      id: crypto.randomUUID(),
      role: "USER",
    });

    const response = await POST(
      createRequest(fields),
    );

    expect(response.status).toBe(401);

    const count = await prisma.wasteType.count({
      where: { name: fields.name },
    });

    expect(count).toBe(0);
  });

  it("TC-INT-ADM-WASTE-08: retrieves a newly created waste type from PostgreSQL", async () => {
    const fields = createFields("RETRIEVE", {
      price: "750",
    });

    const response = await POST(
      createRequest(fields),
    );

    const result = await response.json();

    expect(response.status).toBe(200);
    createdIds.push(result.wasteType.id);

    const saved = await prisma.wasteType.findUnique({
      where: { name: fields.name },
    });

    expect(saved).not.toBeNull();
    expect(saved?.id).toBe(result.wasteType.id);
    expect(saved?.name).toBe(fields.name);
    expect(Number(saved?.price)).toBe(750);
  });
});

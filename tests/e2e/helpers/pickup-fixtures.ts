
import { randomUUID } from "node:crypto";
import bcrypt from "bcrypt";
import prisma from "../../../lib/prisma";
import { assertTestDatabase } from "../../integration/test-database";

const runId = randomUUID();

export const pickupFixture = {
  email: `e2e-pickup-${runId}@example.com`,
  password: "E2eResident123!",
  wasteTypeName: `E2E Household Waste ${runId}`,
  street: "12 E2E Testing Street",
  city: "Lagos",
  state: "Lagos",
  postalCode: "101241",
  country: "Nigeria",
};

export let pickupResidentId = "";

export async function createPickupFixtures() {
  assertTestDatabase();

  const password = await bcrypt.hash(
    pickupFixture.password,
    10,
  );

  const resident = await prisma.user.create({
    data: {
      firstName: "E2E",
      lastName: "PickupResident",
      email: pickupFixture.email,
      password,
      role: "USER",
      mustChangePassword: false,
    },
  });

  pickupResidentId = resident.id;

  await prisma.wasteType.create({
    data: {
      name: pickupFixture.wasteTypeName,
      description: "Waste type for automated E2E testing",
      status: "ACTIVE",
      price: 1000,
    },
  });
}

export async function cleanupPickupFixtures() {
  assertTestDatabase();

  const resident = await prisma.user.findUnique({
    where: { email: pickupFixture.email },
    select: { id: true },
  });

  if (resident) {
    // Related request activities and payments cascade
    // when their parent pickup request is deleted.
    await prisma.wasteRequest.deleteMany({
      where: { userId: resident.id },
    });

    await prisma.address.deleteMany({
      where: { userId: resident.id },
    });

    await prisma.user.delete({
      where: { id: resident.id },
    });
  }

  await prisma.wasteType.deleteMany({
    where: { name: pickupFixture.wasteTypeName },
  });
}

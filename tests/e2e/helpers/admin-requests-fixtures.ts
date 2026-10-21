
import { randomUUID } from "node:crypto";
import bcrypt from "bcrypt";
import prisma from "../../../lib/prisma";
import { assertTestDatabase } from "../../integration/test-database";

const runId = randomUUID();
const shortId = runId.slice(0, 8).toUpperCase();

export const adminRequestFixture = {
  adminEmail: `e2e-admin-${runId}@example.com`,
  adminPassword: "E2eAdmin123!",
  residentEmail: `e2e-admin-resident-${runId}@example.com`,
  collectorEmail: `e2e-admin-collector-${runId}@example.com`,
  collectorName: "E2E TestCollector",
  residentName: "E2E TestResident",
  wasteTypeName: `E2E Admin Waste ${shortId}`,
  reference: `WR-E2E-${shortId}`,
  street: "45 E2E Administration Street",
  description: "E2E admin approval and assignment workflow",
};

export const adminRequestIds = {
  adminId: "",
  residentId: "",
  collectorId: "",
  requestId: "",
};

export async function createAdminRequestFixtures() {
  assertTestDatabase();

  const password = await bcrypt.hash(
    adminRequestFixture.adminPassword,
    10,
  );

  const admin = await prisma.user.create({
    data: {
      firstName: "E2E",
      lastName: "Administrator",
      email: adminRequestFixture.adminEmail,
      password,
      role: "ADMIN",
      mustChangePassword: false,
    },
  });

  adminRequestIds.adminId = admin.id;

  const resident = await prisma.user.create({
    data: {
      firstName: "E2E",
      lastName: "TestResident",
      email: adminRequestFixture.residentEmail,
      password,
      role: "USER",
      mustChangePassword: false,
    },
  });

  adminRequestIds.residentId = resident.id;

  const collector = await prisma.user.create({
    data: {
      firstName: "E2E",
      lastName: "TestCollector",
      email: adminRequestFixture.collectorEmail,
      password,
      role: "COLLECTOR",
      mustChangePassword: false,
      collectorProfile: {
        create: {
          zone: "Lagos Mainland",
          isActive: true,
          vehicleRegistration: `E2E-${shortId}`,
        },
      },
    },
  });

  adminRequestIds.collectorId = collector.id;

  const address = await prisma.address.create({
    data: {
      userId: resident.id,
      label: "E2E Home",
      street: adminRequestFixture.street,
      city: "Lagos",
      state: "Lagos",
      postalCode: "101241",
      country: "Nigeria",
      isDefault: true,
    },
  });

  const wasteType = await prisma.wasteType.create({
    data: {
      name: adminRequestFixture.wasteTypeName,
      description: "Waste type for admin E2E testing",
      status: "ACTIVE",
      price: 1000,
    },
  });

  const pickupDate = new Date();
  pickupDate.setDate(pickupDate.getDate() + 7);

  const request = await prisma.wasteRequest.create({
    data: {
      reference: adminRequestFixture.reference,
      description: adminRequestFixture.description,
      quantity: 3,
      quantityUnit: "BAG",
      status: "PENDING",
      requestedPickupDate: pickupDate,
      userId: resident.id,
      wasteTypeId: wasteType.id,
      addressId: address.id,
      pickupStreet: address.street,
      pickupCity: address.city,
      pickupState: address.state,
      pickupPostalCode: address.postalCode,
      pickupCountry: address.country,
    },
  });

  adminRequestIds.requestId = request.id;

  console.log(
    "[E2E-04] Created pending request:",
    request.reference,
  );
}

export async function cleanupAdminRequestFixtures() {
  assertTestDatabase();

  // Delete only records belonging to this E2E run.
  const resident = await prisma.user.findUnique({
    where: { email: adminRequestFixture.residentEmail },
    select: { id: true },
  });

  if (resident) {
    await prisma.wasteRequest.deleteMany({
      where: { userId: resident.id },
    });

    await prisma.address.deleteMany({
      where: { userId: resident.id },
    });
  }

  await prisma.user.deleteMany({
    where: {
      email: {
        in: [
          adminRequestFixture.adminEmail,
          adminRequestFixture.residentEmail,
        ],
      },
    },
  });

  const collector = await prisma.user.findUnique({
    where: { email: adminRequestFixture.collectorEmail },
    select: { id: true },
  });

  if (collector) {
    await prisma.collectorProfile.deleteMany({
      where: { userId: collector.id },
    });

    await prisma.user.delete({
      where: { id: collector.id },
    });
  }

  await prisma.wasteType.deleteMany({
    where: { name: adminRequestFixture.wasteTypeName },
  });

  console.log("[E2E-04] Test fixtures removed");
}


import { randomUUID } from "node:crypto";
import bcrypt from "bcrypt";
import prisma from "../../../lib/prisma";
import { assertTestDatabase } from "../../integration/test-database";

const runId = randomUUID();

export const residentFixtures = {
  active: {
    email: `e2e-active-${runId}@example.com`,
    password: "E2eResident123!",
  },
  passwordChange: {
    email: `e2e-change-${runId}@example.com`,
    password: "E2eResident123!",
  },
};

export async function createResidentFixtures() {
  assertTestDatabase();

  const hashedPassword = await bcrypt.hash(
    residentFixtures.active.password,
    10,
  );

  await prisma.user.createMany({
    data: [
      {
        firstName: "E2E",
        lastName: "ActiveResident",
        email: residentFixtures.active.email,
        password: hashedPassword,
        role: "USER",
        mustChangePassword: false,
      },
      {
        firstName: "E2E",
        lastName: "PasswordChange",
        email: residentFixtures.passwordChange.email,
        password: hashedPassword,
        role: "USER",
        mustChangePassword: true,
      },
    ],
  });
}

export async function cleanupResidentFixtures() {
  assertTestDatabase();

  await prisma.user.deleteMany({
    where: {
      email: {
        in: [
          residentFixtures.active.email,
          residentFixtures.passwordChange.email,
        ],
      },
    },
  });
}

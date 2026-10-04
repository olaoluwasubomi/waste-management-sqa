// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

declare global {
  // allow global prisma on the dev server to avoid exhausting connections
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const prisma = global.prisma ?? new PrismaClient();

if (process.env.NODE_ENV === "development") global.prisma = prisma;

export default prisma;

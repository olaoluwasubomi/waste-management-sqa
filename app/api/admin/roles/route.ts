import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

export async function GET() {

  // Get all enum values from Prisma
  const allRoles = Object.values(Role);

  // Apply policy
  const allowedRoles = allRoles.filter(
    (role) => role !== "ADMIN"
  );

  return NextResponse.json(allowedRoles);
}

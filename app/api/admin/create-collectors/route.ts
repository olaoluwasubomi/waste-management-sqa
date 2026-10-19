
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAuth } from "@/lib/verifyAuth";
import bcrypt from "bcrypt";
import { nanoid } from "nanoid";
import { Role } from "@prisma/client";

export async function POST(req: Request) {
  try {
    // 1. Authentication
    const auth = await verifyAuth();

    if (!auth) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Administrator authorisation
    if (auth.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // 3. Safe JSON parsing
    let body: unknown;

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    // 4. Validate request structure
    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const data = body as Record<string, unknown>;

    // 5. Normalise input fields
    const firstName =
      typeof data.firstName === "string"
        ? data.firstName.trim()
        : "";

    const lastName =
      typeof data.lastName === "string"
        ? data.lastName.trim()
        : "";

    const email =
      typeof data.email === "string"
        ? data.email.trim().toLowerCase()
        : "";

    const zone =
      typeof data.zone === "string"
        ? data.zone.trim()
        : "";

    const phone =
      typeof data.phone === "string"
        ? data.phone.trim()
        : undefined;

    // 6. Required field validation
    if (!firstName || !lastName || !email || !zone) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 7. Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // 8. Prevent duplicate email addresses
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      );
    }

    // 9. Generate temporary password
    const tempPassword = nanoid(10);

    // 10. Hash temporary password
    const hashedPassword = await bcrypt.hash(
      tempPassword,
      10
    );

    // 11. Atomic user and collector profile creation
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          firstName,
          lastName,
          email,
          phone,
          password: hashedPassword,
          role: Role.COLLECTOR,
          mustChangePassword: true,
        },
      });

      await tx.collectorProfile.create({
        data: {
          userId: user.id,
          zone,
        },
      });
    });

    // 12. Successful response
    return NextResponse.json({
      message: "Collector created successfully",
      tempPassword,
    });
  } catch (error) {
    console.error("CREATE COLLECTOR ERROR:", error);

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
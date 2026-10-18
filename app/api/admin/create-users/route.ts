
import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import prisma from "@/lib/prisma";
import { verifyAuth } from "@/lib/verifyAuth";
import bcrypt from "bcrypt";
import { nanoid } from "nanoid";

export async function POST(req: Request) {
  try {
    // Authentication and authorisation
    const auth = await verifyAuth();

    if (!auth) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (auth.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Parse JSON safely
    let body: unknown;

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

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

    const phone =
      typeof data.phone === "string"
        ? data.phone.trim()
        : undefined;

    const address =
      typeof data.address === "string"
        ? data.address.trim()
        : "";

    // Required fields
    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Duplicate check
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      );
    }

    // Generate and hash temporary password
    const tempPassword = nanoid(10);
    const hashedPassword = await bcrypt.hash(
      tempPassword,
      10
    );

    // Atomic user and address creation
    const user = await prisma.$transaction(
      async (tx) => {
        const createdUser = await tx.user.create({
          data: {
            firstName,
            lastName,
            email,
            phone,
            password: hashedPassword,
            role: Role.USER,
            mustChangePassword: true,
          },
        });

        if (address) {
          await tx.address.create({
            data: {
              street: address,
              city: "Lagos",
              state: "Lagos",
              userId: createdUser.id,
            },
          });
        }

        return createdUser;
      }
    );

    return NextResponse.json({
      message: "User created successfully",
      tempPassword,
    });
  } catch (error) {
    console.error("ADMIN CREATE USER ERROR:", error);

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}

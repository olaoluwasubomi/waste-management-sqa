import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAuth } from "@/lib/verifyAuth";
import bcrypt from "bcrypt";
import { nanoid } from "nanoid";
import { Role } from "@prisma/client";

export async function POST(req: Request) {
  try {
    // 🔐 Only admin allowed
    const auth = await verifyAuth();
    if (!auth || auth.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { firstName, lastName, email, phone, zone } = body;

    if (!firstName || !lastName || !email || !zone) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 🚫 Prevent duplicate emails
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      );
    }

    // 🔑 Temporary password
    const tempPassword = nanoid(10);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // 🧠 Atomic creation
    await prisma.$transaction(async (tx) => {
      // Create login account
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

      // Create collector profile
      await tx.collectorProfile.create({
        data: {
          userId: user.id,
          zone,
        },
      });
    });

    return NextResponse.json({
      message: "Collector created successfully",
      tempPassword,
    });

  } catch (error) {
    console.error("CREATE COLLECTOR ERROR:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
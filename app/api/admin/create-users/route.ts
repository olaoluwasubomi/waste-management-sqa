import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import { nanoid } from "nanoid";
// import { Role } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { firstName, lastName, email, phone, address } = body;

    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // if (role === Role.ADMIN) {
    //   return NextResponse.json(
    //     { error: "You are not allowed to create admin users" },
    //     { status: 403 }
    //   );
    // }

    // if (!Object.values(Role).includes(role)) {
    //   return NextResponse.json(
    //     { error: "Invalid role" },
    //     { status: 400 }
    //   );
    // }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      );
    }

    const tempPassword = nanoid(10);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        password: hashedPassword,
        // role,
        mustChangePassword:true,
      },
    });

    if (address) {
      await prisma.address.create({
        data: {
          street: address,
          city: "Lagos", // temp default
          state: "Lagos",
          userId: user.id,
        },
      });
    }

    // TODO: send email later
    console.log("TEMP PASSWORD:", tempPassword);

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

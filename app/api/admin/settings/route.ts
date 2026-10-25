import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAuth } from "@/lib/verifyAuth";
import bcrypt from "bcrypt";

export async function GET() {
  try {
    const auth = await verifyAuth();

    if (!auth) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id: auth.id,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        image: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("GET PROFILE ERROR:", error);

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await verifyAuth();

    if (!auth) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await request.formData();

    const fullName = formData.get("fullName") as string | null;
    const email = formData.get("email") as string | null;
    const password = formData.get("password") as string | null;
    const profileImage = formData.get("profileImage") as File | null;

    const data: {
      firstName?: string;
      lastName?: string;
      email?: string;
      password?: string;
      image?: string;
    } = {};

    if (fullName?.trim()) {
      const parts = fullName.trim().split(/\s+/);

      data.firstName = parts[0];
      data.lastName = parts.slice(1).join(" ");
    }

    if (email?.trim()) {
      data.email = email.trim();
    }

    if (password?.trim()) {
      data.password = await bcrypt.hash(password, 10);
    }

    if (profileImage && profileImage.size > 0) {
      const bytes = await profileImage.arrayBuffer();
      const buffer = Buffer.from(bytes);

      data.image = `data:${profileImage.type};base64,${buffer.toString(
        "base64"
      )}`;
    }

    const updated = await prisma.user.update({
      where: {
        id: auth.id,
      },
      data,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        image: true,
        role: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: updated,
    });
  } catch (error) {
    console.error("UPDATE PROFILE ERROR:", error);

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
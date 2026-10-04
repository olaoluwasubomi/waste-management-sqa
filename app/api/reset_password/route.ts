import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    // Validate required fields
    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and new password are required" },
        { status: 400 }
      );
    }

    // Validate token exists
    const tokenRecord = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!tokenRecord) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 400 }
      );
    }

    // Validate token expiration
    if (tokenRecord.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Password reset link has expired" },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password
    await prisma.user.update({
      where: { id: tokenRecord.userId },
      data: { password: hashedPassword },
    });

    // Remove token so it cannot be reused
    await prisma.passwordResetToken.delete({
      where: { token },
    });

    return NextResponse.json(
      { message: "Password reset successful. You may now log in." },
      { status: 200 }
    );

  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error);
    return NextResponse.json(
      { error: "Server error, please try again later." },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import { verifyAuth } from "@/lib/verifyAuth";

export async function POST(req: Request) {
  try {
    const auth = await verifyAuth();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { newPassword } = await req.json();

    const hashed = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: auth.id },
      data: {
        password: hashed,
        mustChangePassword: false,
      },
    });

    return NextResponse.json({ message: "Password updated" });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

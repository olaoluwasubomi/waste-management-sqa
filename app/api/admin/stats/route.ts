import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAuth } from "@/lib/verifyAuth";
import { Role } from "@prisma/client";

export async function GET() {
  try {
    const auth = await verifyAuth();

    if (!auth || auth.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [totalUsers, totalCollectors, totalRequests, pendingUsers] = await Promise.all([
      prisma.user.count({
        where: { role: Role.USER },
      }),

      prisma.user.count({
        where: { role: Role.COLLECTOR },
      }),

      prisma.wasteRequest.count(),

      prisma.user.count({
        where: {
          mustChangePassword: true,
          // role: Role.USER && Role.COLLECTOR,
        },
      }),

    
    ]);

    return NextResponse.json({
      totalUsers,
      totalCollectors,
      totalRequests,
      pendingUsers,
    });

  } catch (error) {
    console.error("ADMIN STATS ERROR:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

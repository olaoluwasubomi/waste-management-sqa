import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAuth } from "@/lib/verifyAuth";

export async function GET() {
  try {
    const auth = await verifyAuth();

    if (!auth || auth.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const currentYear = new Date().getFullYear();

    const startOfYear = new Date(currentYear, 0, 1);
    const startOfNextYear = new Date(currentYear + 1, 0, 1);

    const requests = await prisma.wasteRequest.findMany({
      where: {
        createdAt: {
          gte: startOfYear,
          lt: startOfNextYear,
        },
      },
      select: {
        createdAt: true,
      },
    });

    const monthlyCounts = Array(12).fill(0);

    requests.forEach((request) => {
      const month = request.createdAt.getMonth();
      monthlyCounts[month]++;
    });

    return NextResponse.json({
      year: currentYear,
      data: monthlyCounts,
    });
  } catch (error) {
    console.error("REQUESTS OVER TIME ERROR:", error);

    return NextResponse.json(
      { error: "Failed to fetch requests over time" },
      { status: 500 }
    );
  }
}
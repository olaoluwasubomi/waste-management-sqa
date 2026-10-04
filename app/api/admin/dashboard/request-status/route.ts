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

    const statusCounts = await prisma.wasteRequest.groupBy({
      by: ["status"],

      _count: {
        id: true,
      },
    });

    const counts = {
      PENDING: 0,
      APPROVED: 0,
      ASSIGNED: 0,
      IN_PROGRESS: 0,
      COMPLETED: 0,
      CANCELED: 0,
      REJECTED: 0,
    };

    statusCounts.forEach((item) => {
      counts[item.status] = item._count.id;
    });

    return NextResponse.json({
      statuses: counts,
    });
  } catch (error) {
    console.error("REQUEST STATUS ERROR:", error);

    return NextResponse.json(
      { error: "Failed to fetch request status statistics" },
      { status: 500 }
    );
  }
}
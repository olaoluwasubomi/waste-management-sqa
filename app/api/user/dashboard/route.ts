import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAuth } from "@/lib/verifyAuth";
import { Role, WasteRequestStatus } from "@prisma/client";

export async function GET() {
  try {
    const auth = await verifyAuth();

    if (!auth || auth.role !== Role.USER) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = auth.id;

    const [activeRequests, completedRequests, addressCount, recentRequests] =
      await Promise.all([
        prisma.wasteRequest.count({
          where: {
            userId,
            status: {
              in: [
                WasteRequestStatus.PENDING,
                WasteRequestStatus.ASSIGNED,
                WasteRequestStatus.IN_PROGRESS,
              ],
            },
          },
        }),
        prisma.wasteRequest.count({
          where: {
            userId,
            status: WasteRequestStatus.COMPLETED,
          },
        }),
        prisma.address.count({
          where: { userId },
        }),
        prisma.wasteRequest.findMany({
          where: { userId },
          take: 5,
          orderBy: { createdAt: "desc" },
          include: {
            wasteType: { select: { name: true } },
            address: { select: { street: true, city: true } },
          },
        }),
      ]);

    return NextResponse.json({
      stats: {
        activeRequests,
        completedRequests,
        addressCount,
        hasAddress: addressCount > 0,
      },
      recentRequests: recentRequests.map((request) => ({
        id: request.id,
        wasteType: request.wasteType.name,
        status: request.status,
        address: `${request.address.street}, ${request.address.city}`,
        date: request.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("USER DASHBOARD ERROR:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

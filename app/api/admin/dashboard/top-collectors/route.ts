import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAuth } from "@/lib/verifyAuth";
import { WasteRequestStatus } from "@prisma/client";

export async function GET() {
  try {
    const auth = await verifyAuth();

    if (!auth || auth.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Count all requests assigned to each collector
    const collectorCounts = await prisma.wasteRequest.groupBy({
      by: ["collectorId"],

      where: {
        collectorId: {
          not: null,
        },
      },

      _count: {
        id: true,
      },

      orderBy: {
        _count: {
          id: "desc",
        },
      },

      take: 5,
    });

    // Get the collector IDs
    const collectorIds = collectorCounts
      .map((collector) => collector.collectorId)
      .filter((id): id is string => id !== null);

    // Fetch collector details
    const collectors = await prisma.user.findMany({
      where: {
        id: {
          in: collectorIds,
        },
      },

      select: {
        id: true,
        firstName: true,
        lastName:true,
      },
    });

    // Fetch completed request counts
    const completedCounts = await prisma.wasteRequest.groupBy({
      by: ["collectorId"],

      where: {
        collectorId: {
          in: collectorIds,
        },

        status: WasteRequestStatus.COMPLETED,
      },

      _count: {
        id: true,
      },
    });

    // Fetch in-progress request counts
    const inProgressCounts = await prisma.wasteRequest.groupBy({
      by: ["collectorId"],

      where: {
        collectorId: {
          in: collectorIds,
        },

        status: WasteRequestStatus.IN_PROGRESS,
      },

      _count: {
        id: true,
      },
    });

    const formattedCollectors = collectorCounts.map((collectorCount) => {
      const collector = collectors.find(
        (item) => item.id === collectorCount.collectorId
      );

      const completed = completedCounts.find(
        (item) => item.collectorId === collectorCount.collectorId
      );

      const inProgress = inProgressCounts.find(
        (item) => item.collectorId === collectorCount.collectorId
      );
        return {
            id: collectorCount.collectorId,
            name: collector
            ? `${collector.firstName} ${collector.lastName}`.trim()
            : "Unknown Collector",
            assigned: collectorCount._count.id,
            completed: completed?._count.id ?? 0,
            inProgress: inProgress?._count.id ?? 0,
        };
    });

    return NextResponse.json({
      collectors: formattedCollectors,
    });
  } catch (error) {
    console.error("TOP COLLECTORS ERROR:", error);

    return NextResponse.json(
      { error: "Failed to fetch top collectors" },
      { status: 500 }
    );
  }
}
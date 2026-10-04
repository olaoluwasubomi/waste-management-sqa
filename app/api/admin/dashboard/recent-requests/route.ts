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

    const requests = await prisma.wasteRequest.findMany({
      orderBy: {
        createdAt: "desc",
      },

      take: 10,

      select: {
        id: true,
        status: true,
        createdAt: true,

        user: {
          select: {
            firstName: true,
            lastName:true,
          },
        },

        wasteType: {
          select: {
            name: true,
          },
        },
      },
    });

    const formattedRequests = requests.map((request) => ({
      id: request.id,
      user: request.user.firstName + " " + request.user.lastName,
      wasteType: request.wasteType.name,
      status: request.status,
      date: request.createdAt,
    }));

    return NextResponse.json({
      requests: formattedRequests,
    });
  } catch (error) {
    console.error("RECENT REQUESTS ERROR:", error);

    return NextResponse.json(
      { error: "Failed to fetch recent requests" },
      { status: 500 }
    );
  }
}
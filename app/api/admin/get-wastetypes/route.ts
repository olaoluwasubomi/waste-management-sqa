import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAuth } from "@/lib/verifyAuth";
import { WasteStatus } from "@prisma/client";

export async function GET() {
  try {
    const auth = await verifyAuth();

    // if (!auth || auth.role !== "ADMIN") {
    //   return NextResponse.json(
    //     { error: "Unauthorized" },
    //     { status: 401 }
    //   );
    // }

    const wasteTypes = await prisma.wasteType.findMany({ 
      orderBy: { createdAt: "desc" }, 
    });

    const formatted = wasteTypes.map((w) => ({
      id: w.id,
      name: w.name,
      description: w.description,
      price: w.price,
      imageUrl: w.imageUrl,
      status: w.status
    }));

    return NextResponse.json(formatted);

  } catch (error) {
    console.error("GET WASTE TYPES ERROR:", error);

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
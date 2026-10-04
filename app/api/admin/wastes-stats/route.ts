import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAuth } from "@/lib/verifyAuth";
import { WasteStatus } from "@prisma/client";


export async function GET() {
    try {
        const auth = await verifyAuth();
        
        if (!auth || auth.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const [totalWastesCategory, 
            activeWastesCategory, 
            inactiveWastesCategory] = await Promise.all ([
            prisma.wasteType.count(),
            prisma.wasteType.count({
                where: {status: WasteStatus.ACTIVE},
            }),
            prisma.wasteType.count({
                where: {status: WasteStatus.INACTIVE},
            })
        ]);

        return NextResponse.json({
            totalWastesCategory,
            activeWastesCategory,
            inactiveWastesCategory,
        });
    } catch (error)  {
        console.error("WASTE STATS ERROR:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
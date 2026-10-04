import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAuth } from "@/lib/verifyAuth";
import { Role } from "@prisma/client";

export async function GET(req: Request) {
  try {

    const auth = await verifyAuth();

    if (!auth || auth.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);

    const name = searchParams.get("name")?.trim();
    const email = searchParams.get("email")?.trim();
    // const role = searchParams.get("role")?.trim();
    const status = searchParams.get("status")?.trim();

    // split name if full name is entered
    const nameParts = name?.trim().split(" ");

    const users = await prisma.user.findMany({
      where: {
        role: Role.USER,

        AND: [

          name
            ? {
                OR: [
                  {
                    firstName: {
                      contains: nameParts?.[0],
                      mode: "insensitive",
                    },
                  },
                  {
                    lastName: {
                      contains: nameParts?.[1] || nameParts?.[0],
                      mode: "insensitive",
                    },
                  },
                ],
              }
            : {},

          email
            ? {
                email: {
                  contains: email,
                  mode: "insensitive",
                },
              }
            : {},

          // role
          //   ? { role: role as Role }
          //   : {},

          status === "ACTIVE"
            ? { mustChangePassword: false }
            : status === "PENDING"
            ? { mustChangePassword: true }
            : {},
        ],
      },

      orderBy: { createdAt: "desc" },

      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        mustChangePassword: true,
        createdAt: true,
      },
    });

    const formatted = users.map((u) => ({
      id: u.id,
      name: `${u.firstName} ${u.lastName}`,
      email: u.email,
      role: u.role,
      status: u.mustChangePassword ? "PENDING" : "ACTIVE",
    }));

    return NextResponse.json(formatted);

  } catch (error) {
    console.error("GET USERS ERROR:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
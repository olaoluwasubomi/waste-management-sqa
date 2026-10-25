
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAuth } from "@/lib/verifyAuth";
import { Role, Prisma } from "@prisma/client";

export async function GET(req: Request) {
  try {
    // 1. Authenticate the requester
    const auth = await verifyAuth();

    if (!auth) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Restrict access to administrators
    if (auth.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // 3. Read and normalise query parameters
    const { searchParams } = new URL(req.url);

    const name = searchParams.get("name")?.trim() ?? "";
    const email = searchParams.get("email")?.trim() ?? "";

    const status =
      searchParams.get("status")?.trim().toUpperCase() ?? "";

    // 4. Validate status filter
    if (
      status &&
      status !== "ACTIVE" &&
      status !== "PENDING"
    ) {
      return NextResponse.json(
        { error: "Invalid status filter" },
        { status: 400 }
      );
    }

    // 5. Build database filters
    const filters: Prisma.UserWhereInput[] = [];

    if (name) {
      // Handles multiple spaces between names
      const nameParts = name.split(/\s+/);

      if (nameParts.length === 1) {
        // A single search term can match either name
        filters.push({
          OR: [
            {
              firstName: {
                contains: nameParts[0],
                mode: "insensitive",
              },
            },
            {
              lastName: {
                contains: nameParts[0],
                mode: "insensitive",
              },
            },
          ],
        });
      } else {
        filters.push({
          AND: [
            {
              firstName: {
                contains: nameParts[0],
                mode: "insensitive",
              },
            },
            {
              lastName: {
                contains: nameParts.slice(1).join(" "),
                mode: "insensitive",
              },
            },
          ],
        });
      }
    }

    if (email) {
      filters.push({
        email: {
          contains: email,
          mode: "insensitive",
        },
      });
    }

    if (status === "ACTIVE") {
      filters.push({
        mustChangePassword: false,
      });
    }

    if (status === "PENDING") {
      filters.push({
        mustChangePassword: true,
      });
    }

    // 6. Retrieve resident accounts
    const users = await prisma.user.findMany({
      where: {
        role: Role.USER,
        AND: filters,
      },

      orderBy: {
        createdAt: "desc",
      },

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

    // 7. Format the response for the admin interface
    const formatted = users.map((user) => ({
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      role: user.role,
      status: user.mustChangePassword
        ? "PENDING"
        : "ACTIVE",
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("GET USERS ERROR:", error);

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}

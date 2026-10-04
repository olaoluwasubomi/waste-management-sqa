import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAuth } from "@/lib/verifyAuth";
import {
  Role,
  WasteRequestStatus,
} from "@prisma/client";

export async function GET(req: Request) {
  try {
    const auth = await verifyAuth();

    if (!auth || auth.role !== "ADMIN") {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        },
      );
    }

    const { searchParams } = new URL(req.url);

    const name =
      searchParams.get("name")?.trim();

    const email =
      searchParams.get("email")?.trim();

    const status =
      searchParams
        .get("status")
        ?.trim()
        .toUpperCase();

    const availableOnly =
      searchParams.get("availableOnly") === "true";

    const nameParts =
      name?.split(/\s+/).filter(Boolean) ?? [];

    const collectors =
      await prisma.user.findMany({
        where: {
          role: Role.COLLECTOR,

          AND: [
            name
              ? {
                  OR: [
                    {
                      firstName: {
                        contains:
                          nameParts[0] ?? name,
                        mode: "insensitive",
                      },
                    },

                    {
                      lastName: {
                        contains:
                          nameParts[1] ??
                          nameParts[0] ??
                          name,
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

            status === "ACTIVE"
              ? {
                  mustChangePassword: false,
                }
              : status === "PENDING"
                ? {
                    mustChangePassword: true,
                  }
                : {},

            availableOnly
              ? {
                  mustChangePassword: false,

                  collectorProfile: {
                    is: {
                      isActive: true,
                    },
                  },
                }
              : {},
          ],
        },

        orderBy: {
          createdAt: "desc",
        },

        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          image: true,
          mustChangePassword: true,

          collectorProfile: {
            select: {
              id: true,
              zone: true,
              isActive: true,
              vehicleRegistration: true,
            },
          },

          _count: {
            select: {
              assignedPickups: {
                where: {
                  status: {
                    in: [
                      WasteRequestStatus.ASSIGNED,
                      WasteRequestStatus.IN_PROGRESS,
                    ],
                  },
                },
              },
            },
          },
        },
      });

    const formatted =
      collectors.map((collector) => ({
        id: collector.id,

        name: `${collector.firstName} ${collector.lastName}`.trim(),

        firstName: collector.firstName,
        lastName: collector.lastName,

        email: collector.email,
        phone: collector.phone,
        image: collector.image,

        zone:
          collector.collectorProfile?.zone ??
          "Unassigned",

        vehicleRegistration:
          collector.collectorProfile
            ?.vehicleRegistration ?? null,

        isActive:
          collector.collectorProfile?.isActive ??
          false,

        activeAssignments:
          collector._count.assignedPickups,

        status:
          collector.mustChangePassword
            ? "PENDING"
            : collector.collectorProfile?.isActive ===
                false
              ? "INACTIVE"
              : "ACTIVE",
      }));

    return NextResponse.json(
      formatted,
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error(
      "GET COLLECTORS ERROR:",
      error,
    );

    return NextResponse.json(
      {
        error: "Server error",
      },
      {
        status: 500,
      },
    );
  }
}
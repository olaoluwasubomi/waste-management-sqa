import { NextRequest, NextResponse } from "next/server";
import {
  Prisma,
  WasteRequestStatus,
} from "@prisma/client";

import prisma from "@/lib/prisma";
import { verifyAuth } from "@/lib/verifyAuth";

function parsePositiveInteger(
  value: string | null,
  fallback: number,
) {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth();

    // Authentication
    if (!auth?.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        {
          status: 401,
        },
      );
    }

    // Admin-only endpoint
    if (auth.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Only administrators can access request management",
        },
        {
          status: 403,
        },
      );
    }

    const searchParams =
      request.nextUrl.searchParams;

    /*
     * Pagination
     */
    const page = parsePositiveInteger(
      searchParams.get("page"),
      1,
    );

    const requestedLimit =
      parsePositiveInteger(
        searchParams.get("limit"),
        20,
      );

    const limit = Math.min(
      requestedLimit,
      100,
    );

    const skip =
      (page - 1) * limit;

    /*
     * Status filter
     */
    const statusParam =
      searchParams
        .get("status")
        ?.trim()
        .toUpperCase();

    const validStatuses =
      Object.values(
        WasteRequestStatus,
      );

    const status =
      statusParam &&
      validStatuses.includes(
        statusParam as WasteRequestStatus,
      )
        ? (statusParam as WasteRequestStatus)
        : undefined;

    /*
     * Search
     */
    const search =
      searchParams
        .get("search")
        ?.trim() || undefined;

    /*
     * Sort
     */
    const order =
      searchParams
        .get("order")
        ?.toLowerCase() === "asc"
        ? "asc"
        : "desc";

    /*
     * Build Prisma where condition.
     *
     * Notice that there is NO userId filter
     * here because an admin should see all
     * resident pickup requests.
     */
    const where: Prisma.WasteRequestWhereInput =
      {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        {
          reference: {
            contains: search,
            mode: "insensitive",
          },
        },

        {
          description: {
            contains: search,
            mode: "insensitive",
          },
        },

        {
          pickupStreet: {
            contains: search,
            mode: "insensitive",
          },
        },

        {
          pickupCity: {
            contains: search,
            mode: "insensitive",
          },
        },

        {
          pickupState: {
            contains: search,
            mode: "insensitive",
          },
        },

        {
          wasteType: {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
        },

        {
          user: {
            firstName: {
              contains: search,
              mode: "insensitive",
            },
          },
        },

        {
          user: {
            lastName: {
              contains: search,
              mode: "insensitive",
            },
          },
        },

        {
          user: {
            email: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
      ];
    }

    /*
     * Get requests + total count
     */
    const [requests, total] =
      await prisma.$transaction([
        prisma.wasteRequest.findMany({
          where,

          skip,
          take: limit,

          orderBy: {
            createdAt: order,
          },

          select: {
            id: true,
            reference: true,
            description: true,

            quantity: true,
            quantityUnit: true,

            status: true,

            requestedPickupDate: true,
            scheduledPickupStart: true,
            scheduledPickupEnd: true,

            createdAt: true,
            updatedAt: true,

            pickupStreet: true,
            pickupCity: true,
            pickupState: true,
            pickupPostalCode: true,
            pickupCountry: true,

            /*
             * Resident
             */
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                image: true,
              },
            },

            /*
             * Waste type
             */
            wasteType: {
              select: {
                id: true,
                name: true,
                description: true,
                price: true,
                imageUrl: true,
              },
            },

            /*
             * Assigned collector
             */
            collector: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                image: true,

                collectorProfile: {
                  select: {
                    zone: true,
                    isActive: true,
                    vehicleRegistration: true,
                  },
                },
              },
            },

            /*
             * Payment
             */
            payment: {
              select: {
                id: true,
                amount: true,
                status: true,
                transactionRef: true,
              },
            },
          },
        }),

        prisma.wasteRequest.count({
          where,
        }),
      ]);

    /*
     * Format requests for the admin UI.
     */
    const formattedRequests =
      requests.map((request) => ({
        id: request.id,

        reference:
          request.reference,

        description:
          request.description,

        quantity:
          request.quantity,

        quantityUnit:
          request.quantityUnit,

        status:
          request.status,

        requestedPickupDate:
          request.requestedPickupDate,

        scheduledPickupStart:
          request.scheduledPickupStart,

        scheduledPickupEnd:
          request.scheduledPickupEnd,

        createdAt:
          request.createdAt,

        updatedAt:
          request.updatedAt,

        /*
         * Resident
         */
        resident: {
          id: request.user.id,

          firstName:
            request.user.firstName,

          lastName:
            request.user.lastName,

          fullName: [
            request.user.firstName,
            request.user.lastName,
          ]
            .filter(Boolean)
            .join(" "),

          email:
            request.user.email,

          image:
            request.user.image,
        },

        /*
         * Waste information
         */
        wasteType:
          request.wasteType,

        /*
         * Address snapshot
         */
        pickupAddress: {
          street:
            request.pickupStreet,

          city:
            request.pickupCity,

          state:
            request.pickupState,

          postalCode:
            request.pickupPostalCode,

          country:
            request.pickupCountry,

          formatted: [
            request.pickupStreet,
            request.pickupCity,
            request.pickupState,
            request.pickupPostalCode,
            request.pickupCountry,
          ]
            .filter(Boolean)
            .join(", "),
        },

        /*
         * Collector
         */
        collector:
          request.collector
            ? {
                id:
                  request.collector.id,

                firstName:
                  request.collector
                    .firstName,

                lastName:
                  request.collector
                    .lastName,

                fullName: [
                  request.collector
                    .firstName,
                  request.collector
                    .lastName,
                ]
                  .filter(Boolean)
                  .join(" "),

                image:
                  request.collector.image,

                collectorProfile:
                  request.collector
                    .collectorProfile,
              }
            : null,

        /*
         * Payment
         */
        payment:
          request.payment,
      }));

    /*
     * Summary statistics.
     *
     * These are based on all requests,
     * not only the current page.
     */
    const [
      pendingCount,
      approvedCount,
      assignedCount,
      inProgressCount,
      completedCount,
      canceledCount,
      rejectedCount,
    ] = await prisma.$transaction([
      prisma.wasteRequest.count({
        where: {
          status:
            WasteRequestStatus.PENDING,
        },
      }),

      prisma.wasteRequest.count({
        where: {
          status:
            WasteRequestStatus.APPROVED,
        },
      }),

      prisma.wasteRequest.count({
        where: {
          status:
            WasteRequestStatus.ASSIGNED,
        },
      }),

      prisma.wasteRequest.count({
        where: {
          status:
            WasteRequestStatus.IN_PROGRESS,
        },
      }),

      prisma.wasteRequest.count({
        where: {
          status:
            WasteRequestStatus.COMPLETED,
        },
      }),

      prisma.wasteRequest.count({
        where: {
          status:
            WasteRequestStatus.CANCELED,
        },
      }),

      prisma.wasteRequest.count({
        where: {
          status:
            WasteRequestStatus.REJECTED,
        },
      }),
    ]);

    const totalPages =
      total === 0
        ? 0
        : Math.ceil(
            total / limit,
          );

    return NextResponse.json(
      {
        success: true,

        requests:
          formattedRequests,

        stats: {
          totalRequests:
            await prisma.wasteRequest.count(),

          pendingReview:
            pendingCount,

          awaitingAssignment:
            approvedCount,

          activeCollections:
            assignedCount +
            inProgressCount,

          pending:
            pendingCount,

          approved:
            approvedCount,

          assigned:
            assignedCount,

          inProgress:
            inProgressCount,

          completed:
            completedCount,

          canceled:
            canceledCount,

          rejected:
            rejectedCount,
        },

        pagination: {
          page,
          limit,
          total,
          totalPages,

          hasNextPage:
            page < totalPages,

          hasPreviousPage:
            page > 1,
        },

        filters: {
          status:
            status ?? null,

          search:
            search ?? null,

          order,
        },
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error(
      "GET ADMIN REQUESTS ERROR:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to retrieve pickup requests",
      },
      {
        status: 500,
      },
    );
  }
}
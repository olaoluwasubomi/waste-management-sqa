import { NextRequest, NextResponse } from "next/server";
import {
  Prisma,
  WasteRequestStatus,
} from "@prisma/client";

import prisma from "@/lib/prisma";
import { verifyAuth } from "@/lib/verifyAuth";

type RequestView =
  | "ALL"
  | "WAITING"
  | "UPCOMING"
  | "HISTORY";

function getStatusesForView(
  view: RequestView,
): WasteRequestStatus[] | undefined {
  switch (view) {
    case "WAITING":
      return [
        WasteRequestStatus.PENDING,
        WasteRequestStatus.APPROVED,
      ];

    case "UPCOMING":
      return [
        WasteRequestStatus.ASSIGNED,
        WasteRequestStatus.IN_PROGRESS,
      ];

    case "HISTORY":
      return [
        WasteRequestStatus.COMPLETED,
        WasteRequestStatus.CANCELED,
        WasteRequestStatus.REJECTED,
      ];

    case "ALL":
    default:
      return undefined;
  }
}

function parsePositiveInteger(
  value: string | null,
  fallback: number,
) {
  if (!value) {
    return fallback;
  }

  const parsedValue = Number.parseInt(value, 10);

  if (
    !Number.isInteger(parsedValue) ||
    parsedValue < 1
  ) {
    return fallback;
  }

  return parsedValue;
}

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth();

    if (!auth) {
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

    if (auth.role !== "USER") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Only residents can access this endpoint",
        },
        {
          status: 403,
        },
      );
    }

    const searchParams = req.nextUrl.searchParams;

    const page = parsePositiveInteger(
      searchParams.get("page"),
      1,
    );

    const requestedLimit = parsePositiveInteger(
      searchParams.get("limit"),
      10,
    );

    const limit = Math.min(requestedLimit, 50);
    const skip = (page - 1) * limit;

    const viewParam =
      searchParams.get("view")?.toUpperCase();

    const validViews: RequestView[] = [
      "ALL",
      "WAITING",
      "UPCOMING",
      "HISTORY",
    ];

    const view: RequestView =
      viewParam &&
      validViews.includes(viewParam as RequestView)
        ? (viewParam as RequestView)
        : "ALL";

    const statusParam =
      searchParams.get("status")?.toUpperCase();

    const validStatuses = Object.values(
      WasteRequestStatus,
    );

    const status =
      statusParam &&
      validStatuses.includes(
        statusParam as WasteRequestStatus,
      )
        ? (statusParam as WasteRequestStatus)
        : undefined;

    const search =
      searchParams.get("search")?.trim() || undefined;

    const order =
      searchParams.get("order")?.toLowerCase() ===
      "asc"
        ? "asc"
        : "desc";

    const viewStatuses = getStatusesForView(view);

    const where: Prisma.WasteRequestWhereInput = {
      userId: auth.id,
    };

    /*
     * An exact status filter takes priority over
     * the broader view filter.
     */
    if (status) {
      where.status = status;
    } else if (viewStatuses) {
      where.status = {
        in: viewStatuses,
      };
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
          wasteType: {
            name: {
              contains: search,
              mode: "insensitive",
            },
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
      ];
    }

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

            approvedAt: true,
            assignedAt: true,
            startedAt: true,
            completedAt: true,
            canceledAt: true,
            rejectedAt: true,

            cancellationReason: true,
            rejectionReason: true,

            pickupStreet: true,
            pickupCity: true,
            pickupState: true,
            pickupPostalCode: true,
            pickupCountry: true,

            createdAt: true,
            updatedAt: true,

            wasteType: {
              select: {
                id: true,
                name: true,
                description: true,
                price: true,
                imageUrl: true,
              },
            },

            address: {
              select: {
                id: true,
                label: true,
              },
            },

            collector: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
                image: true,

                collectorProfile: {
                  select: {
                    zone: true,
                    vehicleRegistration: true,
                  },
                },
              },
            },

            payment: {
              select: {
                id: true,
                amount: true,
                status: true,
                transactionRef: true,
                paidAt: true,
                failedAt: true,
                refundedAt: true,
              },
            },

            activities: {
              orderBy: {
                createdAt: "desc",
              },
              take: 5,
              select: {
                id: true,
                type: true,
                status: true,
                title: true,
                description: true,
                createdAt: true,
              },
            },
          },
        }),

        prisma.wasteRequest.count({
          where,
        }),
      ]);

    const formattedRequests = requests.map(
      (request) => ({
        ...request,

        pickupAddress: {
          street: request.pickupStreet,
          city: request.pickupCity,
          state: request.pickupState,
          postalCode: request.pickupPostalCode,
          country: request.pickupCountry,

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

        collector: request.collector
          ? {
              ...request.collector,
              fullName: `${request.collector.firstName} ${request.collector.lastName}`,
            }
          : null,
      }),
    );

    const totalPages =
      total === 0 ? 0 : Math.ceil(total / limit);

    return NextResponse.json(
      {
        success: true,

        requests: formattedRequests,

        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },

        filters: {
          view,
          status: status ?? null,
          search: search ?? null,
          order,
        },
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error(
      "GET USER WASTE REQUESTS ERROR:",
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
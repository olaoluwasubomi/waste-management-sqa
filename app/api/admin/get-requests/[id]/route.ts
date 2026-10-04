import {
  NextRequest,
  NextResponse,
} from "next/server";

import prisma from "@/lib/prisma";
import { verifyAuth } from "@/lib/verifyAuth";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const auth = await verifyAuth();

    // -----------------------------------------
    // Authentication
    // -----------------------------------------

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

    // -----------------------------------------
    // Authorization
    // -----------------------------------------

    if (auth.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Only administrators can access this endpoint",
        },
        {
          status: 403,
        },
      );
    }

    const { id } = await context.params;

    if (!id?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Request ID is required",
        },
        {
          status: 400,
        },
      );
    }

    // -----------------------------------------
    // Retrieve request
    // -----------------------------------------

    const wasteRequest =
      await prisma.wasteRequest.findUnique({
        where: {
          id,
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

          // -----------------------------------
          // Resident
          // -----------------------------------

          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              image: true,
              role: true,
            },
          },

          // -----------------------------------
          // Waste type
          // -----------------------------------

          wasteType: {
            select: {
              id: true,
              name: true,
              description: true,
              price: true,
              imageUrl: true,
              status: true,
            },
          },

          // -----------------------------------
          // Original saved address
          // -----------------------------------

          address: {
            select: {
              id: true,
              label: true,
              street: true,
              city: true,
              state: true,
              postalCode: true,
              country: true,
              latitude: true,
              longitude: true,
              isDefault: true,
            },
          },

          // -----------------------------------
          // Assigned collector
          // -----------------------------------

          collector: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
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

          // -----------------------------------
          // Payment
          // -----------------------------------

          payment: {
            select: {
              id: true,
              amount: true,
              status: true,
              transactionRef: true,

              paidAt: true,
              failedAt: true,
              refundedAt: true,

              createdAt: true,
              updatedAt: true,
            },
          },

          // -----------------------------------
          // Activity history
          // -----------------------------------

          activities: {
            orderBy: {
              createdAt: "desc",
            },

            select: {
              id: true,
              type: true,
              status: true,
              title: true,
              description: true,
              createdAt: true,

              createdBy: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  role: true,
                },
              },
            },
          },
        },
      });

    // -----------------------------------------
    // Request not found
    // -----------------------------------------

    if (!wasteRequest) {
      return NextResponse.json(
        {
          success: false,
          error: "Pickup request not found",
        },
        {
          status: 404,
        },
      );
    }

    // -----------------------------------------
    // Format response
    // -----------------------------------------

    const formattedRequest = {
      id: wasteRequest.id,
      reference: wasteRequest.reference,
      description: wasteRequest.description,

      quantity: wasteRequest.quantity,
      quantityUnit: wasteRequest.quantityUnit,

      status: wasteRequest.status,

      requestedPickupDate:
        wasteRequest.requestedPickupDate,

      scheduledPickupStart:
        wasteRequest.scheduledPickupStart,

      scheduledPickupEnd:
        wasteRequest.scheduledPickupEnd,

      approvedAt:
        wasteRequest.approvedAt,

      assignedAt:
        wasteRequest.assignedAt,

      startedAt:
        wasteRequest.startedAt,

      completedAt:
        wasteRequest.completedAt,

      canceledAt:
        wasteRequest.canceledAt,

      rejectedAt:
        wasteRequest.rejectedAt,

      cancellationReason:
        wasteRequest.cancellationReason,

      rejectionReason:
        wasteRequest.rejectionReason,

      createdAt:
        wasteRequest.createdAt,

      updatedAt:
        wasteRequest.updatedAt,

      // ---------------------------------------
      // Pickup snapshot
      // ---------------------------------------

      pickupAddress: {
        street:
          wasteRequest.pickupStreet,

        city:
          wasteRequest.pickupCity,

        state:
          wasteRequest.pickupState,

        postalCode:
          wasteRequest.pickupPostalCode,

        country:
          wasteRequest.pickupCountry,

        formatted: [
          wasteRequest.pickupStreet,
          wasteRequest.pickupCity,
          wasteRequest.pickupState,
          wasteRequest.pickupPostalCode,
          wasteRequest.pickupCountry,
        ]
          .filter(Boolean)
          .join(", "),
      },

      // ---------------------------------------
      // Saved address
      // ---------------------------------------

      savedAddress:
        wasteRequest.address,

      // ---------------------------------------
      // Resident
      // ---------------------------------------

      resident: {
        ...wasteRequest.user,

        fullName: `${wasteRequest.user.firstName} ${wasteRequest.user.lastName}`.trim(),
      },

      // ---------------------------------------
      // Waste type
      // ---------------------------------------

      wasteType:
        wasteRequest.wasteType,

      // ---------------------------------------
      // Collector
      // ---------------------------------------

      collector:
        wasteRequest.collector
          ? {
              ...wasteRequest.collector,

              fullName:
                `${wasteRequest.collector.firstName} ${wasteRequest.collector.lastName}`.trim(),
            }
          : null,

      // ---------------------------------------
      // Payment
      // ---------------------------------------

      payment:
        wasteRequest.payment,

      // ---------------------------------------
      // Activity history
      // ---------------------------------------

      activities:
        wasteRequest.activities.map(
          (activity) => ({
            ...activity,

            createdBy:
              activity.createdBy
                ? {
                    ...activity.createdBy,

                    fullName:
                      `${activity.createdBy.firstName} ${activity.createdBy.lastName}`.trim(),
                  }
                : null,
          }),
        ),
    };

    return NextResponse.json(
      {
        success: true,
        request: formattedRequest,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error(
      "GET ADMIN REQUEST DETAILS ERROR:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to retrieve pickup request details",
      },
      {
        status: 500,
      },
    );
  }
}
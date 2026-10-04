import { NextRequest, NextResponse } from "next/server";
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

    if (auth.role !== "USER") {
      return NextResponse.json(
        {
          success: false,
          error: "Only residents can access this endpoint",
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

    const wasteRequest =
      await prisma.wasteRequest.findFirst({
        where: {
          id,
          userId: auth.id,
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
              status: true,
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
                  isActive: true,
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
              createdAt: true,
              updatedAt: true,
            },
          },

          activities: {
            orderBy: {
              createdAt: "asc",
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

    const pickupAddress = {
      street: wasteRequest.pickupStreet,
      city: wasteRequest.pickupCity,
      state: wasteRequest.pickupState,
      postalCode: wasteRequest.pickupPostalCode,
      country: wasteRequest.pickupCountry,

      formatted: [
        wasteRequest.pickupStreet,
        wasteRequest.pickupCity,
        wasteRequest.pickupState,
        wasteRequest.pickupPostalCode,
        wasteRequest.pickupCountry,
      ]
        .filter(Boolean)
        .join(", "),
    };

    const collector = wasteRequest.collector
      ? {
          ...wasteRequest.collector,

          fullName: [
            wasteRequest.collector.firstName,
            wasteRequest.collector.lastName,
          ]
            .filter(Boolean)
            .join(" "),
        }
      : null;

    const activities = wasteRequest.activities.map(
      (activity) => ({
        ...activity,

        createdBy: activity.createdBy
          ? {
              ...activity.createdBy,

              fullName: [
                activity.createdBy.firstName,
                activity.createdBy.lastName,
              ]
                .filter(Boolean)
                .join(" "),
            }
          : null,
      }),
    );

    return NextResponse.json(
      {
        success: true,

        request: {
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

          approvedAt: wasteRequest.approvedAt,
          assignedAt: wasteRequest.assignedAt,
          startedAt: wasteRequest.startedAt,
          completedAt: wasteRequest.completedAt,
          canceledAt: wasteRequest.canceledAt,
          rejectedAt: wasteRequest.rejectedAt,

          cancellationReason:
            wasteRequest.cancellationReason,

          rejectionReason:
            wasteRequest.rejectionReason,

          createdAt: wasteRequest.createdAt,
          updatedAt: wasteRequest.updatedAt,

          pickupAddress,

          savedAddress: wasteRequest.address,

          wasteType: wasteRequest.wasteType,

          collector,

          payment: wasteRequest.payment,

          activities,
        },
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error(
      "GET USER REQUEST DETAILS ERROR:",
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


// import { NextRequest, NextResponse } from "next/server";
import {
  Prisma,
  RequestActivityType,
  WasteQuantityUnit,
  WasteRequestStatus,
} from "@prisma/client";

// import prisma from "@/lib/prisma";
// import { verifyAuth } from "@/lib/verifyAuth";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

interface UpdateWasteRequestBody {
  wasteTypeId?: string;
  addressId?: string;
  description?: string | null;
  quantity?: number;
  quantityUnit?: WasteQuantityUnit;
  requestedPickupDate?: string;
}

const allowedQuantityUnits: WasteQuantityUnit[] = [
  WasteQuantityUnit.BAG,
  WasteQuantityUnit.BIN,
  WasteQuantityUnit.ITEM,
  WasteQuantityUnit.KILOGRAM,
  WasteQuantityUnit.TONNE,
  WasteQuantityUnit.OTHER,
];

export async function PATCH(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const auth = await verifyAuth();

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

    if (auth.role !== "USER") {
      return NextResponse.json(
        {
          success: false,
          error: "Only residents can edit pickup requests",
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

    let body: UpdateWasteRequestBody;

    try {
      body =
        (await request.json()) as UpdateWasteRequestBody;
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request body",
        },
        {
          status: 400,
        },
      );
    }

    const existingRequest =
      await prisma.wasteRequest.findFirst({
        where: {
          id,
          userId: auth.id,
        },
        select: {
          id: true,
          reference: true,
          status: true,

          wasteTypeId: true,
          addressId: true,

          description: true,
          quantity: true,
          quantityUnit: true,
          requestedPickupDate: true,

          pickupStreet: true,
          pickupCity: true,
          pickupState: true,
          pickupPostalCode: true,
          pickupCountry: true,
        },
      });

    if (!existingRequest) {
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

    if (
      existingRequest.status !==
      WasteRequestStatus.PENDING
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Only pending pickup requests can be edited",
        },
        {
          status: 409,
        },
      );
    }

    const wasteTypeId =
      body.wasteTypeId?.trim() ??
      existingRequest.wasteTypeId;

    const addressId =
      body.addressId?.trim() ??
      existingRequest.addressId;

    const description =
      body.description === undefined
        ? existingRequest.description
        : body.description?.trim() || null;

    const quantity =
      body.quantity === undefined
        ? existingRequest.quantity
        : Number(body.quantity);

    const quantityUnit =
      body.quantityUnit ??
      existingRequest.quantityUnit;

    const requestedPickupDate =
      body.requestedPickupDate === undefined
        ? existingRequest.requestedPickupDate
        : new Date(body.requestedPickupDate);

    if (
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Quantity must be a positive whole number",
          field: "quantity",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !allowedQuantityUnits.includes(
        quantityUnit,
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Select a valid quantity unit",
          field: "quantityUnit",
        },
        {
          status: 400,
        },
      );
    }

    if (
      Number.isNaN(
        requestedPickupDate.getTime(),
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid pickup date",
          field: "requestedPickupDate",
        },
        {
          status: 400,
        },
      );
    }

    if (
      requestedPickupDate.getTime() <=
      Date.now()
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Requested pickup date must be in the future",
          field: "requestedPickupDate",
        },
        {
          status: 400,
        },
      );
    }

    if (
      description &&
      description.length > 500
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Description cannot exceed 500 characters",
          field: "description",
        },
        {
          status: 400,
        },
      );
    }

    const [wasteType, address] =
      await Promise.all([
        prisma.wasteType.findUnique({
          where: {
            id: wasteTypeId,
          },
          select: {
            id: true,
            name: true,
            status: true,
            price: true,
          },
        }),

        prisma.address.findFirst({
          where: {
            id: addressId,
            userId: auth.id,
          },
          select: {
            id: true,
            label: true,
            street: true,
            city: true,
            state: true,
            postalCode: true,
            country: true,
          },
        }),
      ]);

    if (!wasteType) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The selected waste type does not exist",
          field: "wasteTypeId",
        },
        {
          status: 404,
        },
      );
    }

    if (wasteType.status !== "ACTIVE") {
      return NextResponse.json(
        {
          success: false,
          error:
            "The selected waste type is currently unavailable",
          field: "wasteTypeId",
        },
        {
          status: 400,
        },
      );
    }

    if (!address) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The selected address was not found or does not belong to you",
          field: "addressId",
        },
        {
          status: 404,
        },
      );
    }

    const pickupDateChanged =
      requestedPickupDate.getTime() !==
      existingRequest.requestedPickupDate.getTime();

    const generalDetailsChanged =
      wasteTypeId !==
        existingRequest.wasteTypeId ||
      addressId !== existingRequest.addressId ||
      description !==
        existingRequest.description ||
      quantity !== existingRequest.quantity ||
      quantityUnit !==
        existingRequest.quantityUnit;

    if (
      !pickupDateChanged &&
      !generalDetailsChanged
    ) {
      return NextResponse.json(
        {
          success: true,
          message: "No changes were made",
          request: existingRequest,
        },
        {
          status: 200,
        },
      );
    }

    const updatedRequest =
      await prisma.$transaction(
        async (transaction) => {
          const updated =
            await transaction.wasteRequest.update({
              where: {
                id: existingRequest.id,
              },

              data: {
                wasteTypeId,
                addressId,
                description,
                quantity,
                quantityUnit,
                requestedPickupDate,

                /*
                 * Keep the pickup snapshot in sync
                 * if the address was changed.
                 */
                pickupStreet: address.street,
                pickupCity: address.city,
                pickupState: address.state,
                pickupPostalCode:
                  address.postalCode,
                pickupCountry:
                  address.country,
              },

              select: {
                id: true,
                reference: true,
                description: true,
                quantity: true,
                quantityUnit: true,
                status: true,
                requestedPickupDate: true,

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
              },
            });

          if (generalDetailsChanged) {
            await transaction.wasteRequestActivity.create(
              {
                data: {
                  wasteRequestId:
                    existingRequest.id,
                  createdById: auth.id,

                  type:
                    RequestActivityType.REQUEST_UPDATED,

                  status:
                    WasteRequestStatus.PENDING,

                  title:
                    "Pickup request updated",

                  description:
                    "The resident updated the pickup request details.",
                },
              },
            );
          }

          if (pickupDateChanged) {
            await transaction.wasteRequestActivity.create(
              {
                data: {
                  wasteRequestId:
                    existingRequest.id,
                  createdById: auth.id,

                  type:
                    RequestActivityType.REQUEST_RESCHEDULED,

                  status:
                    WasteRequestStatus.PENDING,

                  title:
                    "Pickup date changed",

                  description:
                    "The resident changed the requested pickup date.",
                },
              },
            );
          }

          return updated;
        },
      );

    const pickupAddress = {
      street:
        updatedRequest.pickupStreet,
      city: updatedRequest.pickupCity,
      state: updatedRequest.pickupState,
      postalCode:
        updatedRequest.pickupPostalCode,
      country:
        updatedRequest.pickupCountry,

      formatted: [
        updatedRequest.pickupStreet,
        updatedRequest.pickupCity,
        updatedRequest.pickupState,
        updatedRequest.pickupPostalCode,
        updatedRequest.pickupCountry,
      ]
        .filter(Boolean)
        .join(", "),
    };

    return NextResponse.json(
      {
        success: true,
        message:
          "Pickup request updated successfully",

        request: {
          ...updatedRequest,
          pickupAddress,
        },
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error(
      "UPDATE USER PICKUP REQUEST ERROR:",
      error,
    );

    if (
      error instanceof
      Prisma.PrismaClientKnownRequestError
    ) {
      if (error.code === "P2003") {
        return NextResponse.json(
          {
            success: false,
            error:
              "The selected waste type or address is invalid",
          },
          {
            status: 400,
          },
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to update the pickup request",
      },
      {
        status: 500,
      },
    );
  }
}
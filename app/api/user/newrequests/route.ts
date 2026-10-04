import { NextRequest, NextResponse } from "next/server";
import {
  Prisma,
  RequestActivityType,
  WasteQuantityUnit,
  WasteRequestStatus,
} from "@prisma/client";

import prisma from "@/lib/prisma";
import { verifyAuth } from "@/lib/verifyAuth";

interface CreateWasteRequestBody {
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

function generateRequestReference() {
  const datePart = new Date()
    .toISOString()
    .slice(0, 10)
    .replaceAll("-", "");

  const randomPart = crypto
    .randomUUID()
    .replaceAll("-", "")
    .slice(0, 8)
    .toUpperCase();

  return `WR-${datePart}-${randomPart}`;
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth();

    if (!auth?.id) {
      return NextResponse.json(
        {
          success: false,
          error: "You must be logged in to request a pickup",
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
            "Only resident accounts can submit pickup requests",
        },
        {
          status: 403,
        },
      );
    }

    const body =
      (await request.json()) as CreateWasteRequestBody;

    const wasteTypeId = body.wasteTypeId?.trim();
    const addressId = body.addressId?.trim();
    const description =
      body.description?.trim() || null;
    const quantity = Number(body.quantity);
    const quantityUnit = body.quantityUnit;
    const requestedPickupDateValue =
      body.requestedPickupDate;

    if (!wasteTypeId) {
      return NextResponse.json(
        {
          success: false,
          error: "Waste type is required",
          field: "wasteTypeId",
        },
        {
          status: 400,
        },
      );
    }

    if (!addressId) {
      return NextResponse.json(
        {
          success: false,
          error: "Pickup address is required",
          field: "addressId",
        },
        {
          status: 400,
        },
      );
    }

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
      !quantityUnit ||
      !allowedQuantityUnits.includes(quantityUnit)
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

    if (!requestedPickupDateValue) {
      return NextResponse.json(
        {
          success: false,
          error: "Requested pickup date is required",
          field: "requestedPickupDate",
        },
        {
          status: 400,
        },
      );
    }

    const requestedPickupDate = new Date(
      requestedPickupDateValue,
    );

    if (
      Number.isNaN(requestedPickupDate.getTime())
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

    if (requestedPickupDate.getTime() <= Date.now()) {
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

    if (description && description.length > 500) {
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

    const [wasteType, address] = await Promise.all([
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

    let reference = generateRequestReference();

    const existingReference =
      await prisma.wasteRequest.findUnique({
        where: {
          reference,
        },
        select: {
          id: true,
        },
      });

    if (existingReference) {
      reference = generateRequestReference();
    }

    const createdRequest = await prisma.$transaction(
      async (transaction) => {
        const wasteRequest =
          await transaction.wasteRequest.create({
            data: {
              reference,
              userId: auth.id,
              wasteTypeId,
              addressId,
              description,
              quantity,
              quantityUnit,
              requestedPickupDate,
              status: WasteRequestStatus.PENDING,

              pickupStreet: address.street,
              pickupCity: address.city,
              pickupState: address.state,
              pickupPostalCode: address.postalCode,
              pickupCountry: address.country,
            },
            select: {
              id: true,
              reference: true,
              description: true,
              quantity: true,
              quantityUnit: true,
              requestedPickupDate: true,
              status: true,
              createdAt: true,

              wasteType: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  imageUrl: true,
                },
              },

              address: {
                select: {
                  id: true,
                  label: true,
                  street: true,
                  city: true,
                  state: true,
                  postalCode: true,
                  country: true,
                },
              },
            },
          });

        await transaction.wasteRequestActivity.create({
          data: {
            wasteRequestId: wasteRequest.id,
            createdById: auth.id,
            type: RequestActivityType.REQUEST_CREATED,
            status: WasteRequestStatus.PENDING,
            title: "Pickup request submitted",
            description:
              "Your pickup request has been received and is awaiting approval.",
          },
        });

        return wasteRequest;
      },
    );

    return NextResponse.json(
      {
        success: true,
        message:
          "Waste pickup request submitted successfully",
        request: createdRequest,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "CREATE WASTE PICKUP REQUEST ERROR:",
      error,
    );

    if (error instanceof SyntaxError) {
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

    if (
      error instanceof
      Prisma.PrismaClientKnownRequestError
    ) {
      if (error.code === "P2002") {
        return NextResponse.json(
          {
            success: false,
            error:
              "A pickup request with this reference already exists",
          },
          {
            status: 409,
          },
        );
      }

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
          "Something went wrong while submitting the pickup request",
      },
      {
        status: 500,
      },
    );
  }
}
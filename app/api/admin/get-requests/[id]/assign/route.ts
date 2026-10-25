import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  RequestActivityType,
  Role,
  WasteRequestStatus,
} from "@prisma/client";

import prisma from "@/lib/prisma";
import { verifyAuth } from "@/lib/verifyAuth";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

interface AssignCollectorBody {
  collectorId?: unknown;
}

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

    if (auth.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Only administrators can assign collectors",
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

    let body: AssignCollectorBody;

    try {
      body =
        (await request.json()) as AssignCollectorBody;
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

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body) ||
      typeof body.collectorId !== "string" ||
      !body.collectorId.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "A valid collector ID is required",
          field: "collectorId",
        },
        {
          status: 400,
        },
      );
    }

    const collectorId = body.collectorId.trim();

    const existingRequest =
      await prisma.wasteRequest.findUnique({
        where: {
          id,
        },

        select: {
          id: true,
          reference: true,
          status: true,
          collectorId: true,
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
      WasteRequestStatus.APPROVED
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Only approved pickup requests can be assigned to a collector",
        },
        {
          status: 409,
        },
      );
    }

    const collector =
      await prisma.user.findFirst({
        where: {
          id: collectorId,
          role: Role.COLLECTOR,

          collectorProfile: {
            is: {
              isActive: true,
            },
          },
        },

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
      });

    if (!collector) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The selected collector does not exist or is not active",
          field: "collectorId",
        },
        {
          status: 404,
        },
      );
    }


    const assignedAt = new Date();

    const updatedRequest = await prisma.$transaction(
      async (transaction) => {
        const updateResult =
          await transaction.wasteRequest.updateMany({
            where: {
              id: existingRequest.id,
              status: WasteRequestStatus.APPROVED,
            },
            data: {
              collectorId: collector.id,
              status: WasteRequestStatus.ASSIGNED,
              assignedAt,
            },
          });

        // Another assignment may have changed the status.
        if (updateResult.count === 0) {
          return null;
        }

        await transaction.wasteRequestActivity.create({
          data: {
            wasteRequestId: existingRequest.id,
            createdById: auth.id,
            type: RequestActivityType.COLLECTOR_ASSIGNED,
            status: WasteRequestStatus.ASSIGNED,
            title: "Collector assigned",
            description:
              `${collector.firstName} ${collector.lastName} was assigned to this pickup request.`,
          },
        });

        return transaction.wasteRequest.findUniqueOrThrow({
          where: {
            id: existingRequest.id,
          },
          select: {
            id: true,
            reference: true,
            status: true,
            assignedAt: true,
            updatedAt: true,
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
          },
        });
      },
    );

    if (!updatedRequest) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This pickup request has already been assigned",
        },
        {
          status: 409,
        },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Collector assigned successfully",
        request: {
          ...updatedRequest,
          collector: updatedRequest.collector
            ? {
                ...updatedRequest.collector,
                fullName:
                  `${updatedRequest.collector.firstName} ${updatedRequest.collector.lastName}`.trim(),
              }
            : null,
        },
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error(
      "ASSIGN COLLECTOR ERROR:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to assign collector",
      },
      {
        status: 500,
      },
    );
  }
} 
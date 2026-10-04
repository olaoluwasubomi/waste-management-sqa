import { NextRequest, NextResponse } from "next/server";
import {
  RequestActivityType,
  WasteRequestStatus,
} from "@prisma/client";

import prisma from "@/lib/prisma";
import { verifyAuth } from "@/lib/verifyAuth";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

interface CancelRequestBody {
  reason?: string;
}

const cancellableStatuses: WasteRequestStatus[] = [
  WasteRequestStatus.PENDING,
  WasteRequestStatus.APPROVED,
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
          error: "Only residents can cancel pickup requests",
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

    let body: CancelRequestBody = {};

    try {
      body = (await request.json()) as CancelRequestBody;
    } catch {
      /*
       * Reason is optional, so an empty request body is valid.
       */
    }

    const cancellationReason = body.reason?.trim() || null;

    if (
      cancellationReason &&
      cancellationReason.length > 500
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Cancellation reason cannot exceed 500 characters",
          field: "reason",
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
          canceledAt: true,
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
      existingRequest.status ===
      WasteRequestStatus.CANCELED
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "This pickup request has already been cancelled",
        },
        {
          status: 409,
        },
      );
    }

    if (
      existingRequest.status ===
      WasteRequestStatus.COMPLETED
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "A completed pickup request cannot be cancelled",
        },
        {
          status: 400,
        },
      );
    }

    if (
      existingRequest.status ===
      WasteRequestStatus.REJECTED
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "A rejected pickup request cannot be cancelled",
        },
        {
          status: 400,
        },
      );
    }

    if (
      existingRequest.status ===
      WasteRequestStatus.ASSIGNED ||
      existingRequest.status ===
        WasteRequestStatus.IN_PROGRESS
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This pickup request can no longer be cancelled because collection processing has started",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !cancellableStatuses.includes(
        existingRequest.status,
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This pickup request cannot be cancelled in its current state",
        },
        {
          status: 400,
        },
      );
    }

    const canceledAt = new Date();

    const updatedRequest =
      await prisma.$transaction(
        async (transaction) => {
          const canceledRequest =
            await transaction.wasteRequest.update({
              where: {
                id: existingRequest.id,
              },
              data: {
                status: WasteRequestStatus.CANCELED,
                canceledAt,
                cancellationReason,
              },
              select: {
                id: true,
                reference: true,
                status: true,
                cancellationReason: true,
                canceledAt: true,
                updatedAt: true,
              },
            });

          await transaction.wasteRequestActivity.create({
            data: {
              wasteRequestId:
                existingRequest.id,
              createdById: auth.id,
              type:
                RequestActivityType.REQUEST_CANCELED,
              status:
                WasteRequestStatus.CANCELED,
              title: "Pickup request cancelled",
              description: cancellationReason
                ? `Cancellation reason: ${cancellationReason}`
                : "The pickup request was cancelled by the resident.",
            },
          });

          return canceledRequest;
        },
      );

    return NextResponse.json(
      {
        success: true,
        message:
          "Pickup request cancelled successfully",
        request: updatedRequest,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error(
      "CANCEL USER PICKUP REQUEST ERROR:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to cancel the pickup request",
      },
      {
        status: 500,
      },
    );
  }
}
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
            "Only administrators can approve pickup requests",
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

    const existingRequest =
      await prisma.wasteRequest.findUnique({
        where: {
          id,
        },
        select: {
          id: true,
          reference: true,
          status: true,
          approvedAt: true,
          canceledAt: true,
          rejectedAt: true,
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
      WasteRequestStatus.APPROVED
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This pickup request has already been approved",
        },
        {
          status: 409,
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
          error:
            "A cancelled pickup request cannot be approved",
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
            "A rejected pickup request cannot be approved",
        },
        {
          status: 400,
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
            "Only pending pickup requests can be approved",
        },
        {
          status: 400,
        },
      );
    }

    const approvedAt = new Date();

    const updatedRequest = await prisma.$transaction(async (transaction) => {
      // Atomic conditional update: only a PENDING request can be approved.
      const updateResult = await transaction.wasteRequest.updateMany({
        where: {
          id: existingRequest.id,
          status: WasteRequestStatus.PENDING,
        },
        data: {
          status: WasteRequestStatus.APPROVED,
          approvedAt,
        },
      });

      // Another request has already changed the status.
      if (updateResult.count === 0) {
        return null;
      }

      await transaction.wasteRequestActivity.create({
        data: {
          wasteRequestId: existingRequest.id,
          createdById: auth.id,
          type: RequestActivityType.REQUEST_APPROVED,
          status: WasteRequestStatus.APPROVED,
          title: "Pickup request approved",
          description:
            "The pickup request was reviewed and approved by an administrator.",
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
          approvedAt: true,
          updatedAt: true,
        },
      });
    });

    if (!updatedRequest) {
      return NextResponse.json(
        {
          success: false,
          error: "This pickup request has already been approved",
        },
        { status: 409 },
      );
    }


    return NextResponse.json(
      {
        success: true,
        message:
          "Pickup request approved successfully",
        request: updatedRequest,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error(
      "APPROVE PICKUP REQUEST ERROR:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to approve the pickup request",
      },
      {
        status: 500,
      },
    );
  }
}
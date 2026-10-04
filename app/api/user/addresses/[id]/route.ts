import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAuth } from "@/lib/verifyAuth";
import { Role } from "@prisma/client";

function validateAddressBody(body: Record<string, unknown>) {
  const { street, city, state, postalCode, country } = body;

  if (!street || !city || !state) {
    return { error: "Street, city, and state are required" };
  }

  if (
    typeof street !== "string" ||
    typeof city !== "string" ||
    typeof state !== "string"
  ) {
    return { error: "Invalid address fields" };
  }

  if (street.trim().length < 5) {
    return { error: "Street address must be at least 5 characters" };
  }

  if (city.trim().length < 2 || state.trim().length < 2) {
    return { error: "City and state must be at least 2 characters" };
  }

  return {
    data: {
      street: street.trim(),
      city: city.trim(),
      state: state.trim(),
      postalCode:
        typeof postalCode === "string" && postalCode.trim()
          ? postalCode.trim()
          : null,
      country:
        typeof country === "string" && country.trim()
          ? country.trim()
          : "Nigeria",
    },
  };
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth();

    if (!auth || auth.role !== Role.USER) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.address.findFirst({
      where: { id, userId: auth.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    const body = await req.json();
    const validation = validateAddressBody(body);

    if ("error" in validation) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const address = await prisma.address.update({
      where: { id },
      data: validation.data,
      select: {
        id: true,
        street: true,
        city: true,
        state: true,
        postalCode: true,
        country: true,
      },
    });

    return NextResponse.json(address);
  } catch (error) {
    console.error("UPDATE USER ADDRESS ERROR:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth();

    if (!auth || auth.role !== Role.USER) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.address.findFirst({
      where: { id, userId: auth.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    const linkedRequests = await prisma.wasteRequest.count({
      where: { addressId: id },
    });

    if (linkedRequests > 0) {
      return NextResponse.json(
        {
          error:
            "This address is linked to pickup requests and cannot be deleted",
        },
        { status: 400 }
      );
    }

    await prisma.address.delete({ where: { id } });

    return NextResponse.json({ message: "Address deleted successfully" });
  } catch (error) {
    console.error("DELETE USER ADDRESS ERROR:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

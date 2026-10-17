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

export async function GET() {
  try {
    const auth = await verifyAuth();

    if (!auth || auth.role !== Role.USER) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const addresses = await prisma.address.findMany({
      where: { userId: auth.id },
      orderBy: { id: "desc" },
      select: {
        id: true,
        street: true,
        city: true,
        state: true,
        postalCode: true,
        country: true,
      },
    });

    return NextResponse.json(addresses);
  } catch (error) {
    console.error("GET USER ADDRESSES ERROR:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await verifyAuth();

    if (!auth || auth.role !== Role.USER) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

  const body: unknown = await req.json();

if (
  body === null ||
  typeof body !== "object" ||
  Array.isArray(body)
) {
  return NextResponse.json(
    { error: "Invalid address data" },
    { status: 400 }
  );
}

const validation = validateAddressBody(
  body as Record<string, unknown>
);

    if ("error" in validation) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const address = await prisma.address.create({
      data: {
        ...validation.data,
        userId: auth.id,
      },
      select: {
        id: true,
        street: true,
        city: true,
        state: true,
        postalCode: true,
        country: true,
      },
    });

    return NextResponse.json(address, { status: 201 });
  } catch (error) {
    console.error("CREATE USER ADDRESS ERROR:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

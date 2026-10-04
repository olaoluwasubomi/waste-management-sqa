import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAuth } from "@/lib/verifyAuth";
import cloudinary from "@/lib/cloudinary";
import { WasteStatus } from "@prisma/client";

export async function POST(req: Request) {
  try {

    const auth = await verifyAuth();

    if (!auth || auth.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await req.formData();

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const price = Number(formData.get("price"));
    const isActive = formData.get("isActive") === "true";
    const image = formData.get("image") as File | null;

    if (!name || !price) {
      return NextResponse.json(
        { error: "Name and price are required" },
        { status: 400 }
      );
    }

    // check duplicate waste type
    const existing = await prisma.wasteType.findUnique({
      where: { name }
    });

    if (existing) {
      return NextResponse.json(
        { error: "Waste type already exists" },
        { status: 400 }
      );
    }

    let imageUrl = null;

    // upload image if provided
    if (image) {

      const bytes = await image.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const upload = await new Promise<any>((resolve, reject) => {

        const stream = cloudinary.uploader.upload_stream(
          { folder: "waste-types" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );

        stream.end(buffer);
      });

      imageUrl = upload.secure_url;
    }

    // create waste type
    const wasteType = await prisma.wasteType.create({
      data: {
        name,
        description,
        price,
        imageUrl,
        status: isActive
          ? WasteStatus.ACTIVE
          : WasteStatus.INACTIVE,
      }
    });

    return NextResponse.json({
      message: "Waste type created successfully",
      wasteType
    });

  } catch (error) {
    console.error("CREATE WASTE TYPE ERROR:", error);

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
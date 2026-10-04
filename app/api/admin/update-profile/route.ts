import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAuth } from "@/lib/verifyAuth";
import bcrypt from "bcrypt";
import cloudinary from "@/lib/cloudinary";

async function uploadToCloudinary(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "waste-management/profile-images",
        resource_type: "image",
      },
      (error, result) => {
        if (error || !result) {
          reject(error);
          return;
        }

        resolve(result.secure_url);
      }
    );

    uploadStream.end(buffer);
  });
}

export async function POST(request: Request) {
  try {
    const auth = await verifyAuth();

    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();

    const fullName = formData.get("fullName") as string | null;
    const email = formData.get("email") as string | null;
    const password = formData.get("password") as string | null;
    const profileImage = formData.get("profileImage") as File | null;

    const data: {
      firstName?: string;
      lastName?: string;
      email?: string;
      password?: string;
      image?: string;
    } = {};

    if (fullName && fullName.trim() !== "") {
      const parts = fullName.trim().split(" ");

      data.firstName = parts.slice(0, -1).join(" ") || parts[0];
      data.lastName = parts.length > 1 ? parts[parts.length - 1] : "";
    }

    if (email && email.trim() !== "") {
      data.email = email.trim();
    }

    if (password && password.trim() !== "") {
      data.password = await bcrypt.hash(password, 10);
    }

    if (profileImage && profileImage.size > 0) {
      const imageUrl = await uploadToCloudinary(profileImage);
      data.image = imageUrl;
    }

    const updated = await prisma.user.update({
      where: {
        id: auth.id,
      },
      data,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        image: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      user: updated,
    });
  } catch (error) {
    console.error("UPDATE PROFILE ERROR:", error);

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}


export async function GET() {
	try {
		const auth = await verifyAuth();

		if (!auth) {
			return NextResponse.json(
				{ error: "Unauthorized" },
				{ status: 401 }
			);
		}

		const user = await prisma.user.findUnique({
			where: {
				id: auth.id,
			},
			select: {
				id: true,
				firstName: true,
				lastName: true,
				email: true,
				image: true,
			},
		});

		if (!user) {
			return NextResponse.json(
				{ error: "User not found" },
				{ status: 404 }
			);
		}

		return NextResponse.json({
			success: true,
			user,
		});
	} catch (error) {
		console.error("GET PROFILE ERROR:", error);

		return NextResponse.json(
			{ error: "Unable to retrieve profile" },
			{ status: 500 }
		);
	}
}
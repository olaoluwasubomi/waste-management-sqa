import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { firstName, lastName, email, password, confirmPassword} = body;

        if (!firstName || !lastName || !email || !password || !confirmPassword) {
            return NextResponse.json(
                {error: "All fields are required"},
                { status : 400 }
            );
        }

        if (password !== confirmPassword) {
            return NextResponse.json(
                {error:"Passwords do not match"},
                {status: 400 }
            );
        }

        const existingUser = await prisma.user.findUnique({
            where: {email},
        });

        if (existingUser) {
            return NextResponse.json(
                {error:"Email already in use"},
                {status: 400}
            );
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                firstName,
                lastName,
                email,
                password: hashedPassword,
            },
        });

         return NextResponse.json(
            { message: "User registered successfully", user },
            { status: 201 }
        );
    } catch (error) {
        console.error("REGISTER ERROR:", error);
        return NextResponse.json(
            { error: "Server error. Please try again." },
            { status: 500 }
        );
    }
}
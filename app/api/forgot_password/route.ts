import { NextResponse } from "next/server";;
import prisma from "@/lib/prisma";
import { Resend } from "resend";
import crypto from "crypto";



export async function POST(req: Request) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json(
                {error: "Email is required"},
                {status: 400 }
            );
        }

        const user = await prisma.user.findUnique({where: {email} });

        if (!user) {
            return NextResponse.json(
                {message: "If this email exists, a password reset link has been sent"},
                {status: 200}
            );
        }

        const resetToken = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 1000 * 60 * 15);

        await prisma.passwordResetToken.create({
            data: {
                token:resetToken,
                userId: user.id, 
                expiresAt,
            },
        });

        const resetLink = `${process.env.RESET_PASSWORD_URL}?token=${resetToken}`;

        await resend.emails.send({
            from: "EcoWaste <onboarding@resend.dev>",
            to: email,
            subject: "Reset your password",
            html: 
                `<p>Hello ${user.firstName},</p>
                <p>You requested to reset your password.</p>
                <p>Click the link below to set a new password:</p>
                <a href="${resetLink}" target="_blank">${resetLink}</a>
                <p>This link expires in 15 minutes.</p>
                <p>If you didn’t request this, ignore this email.</p>`,
        });

        return NextResponse.json(
            { message: "Password reset link sent to your email." },
            { status: 200 }
        );

    } catch (error) {
        console.error("Error in forgot password", error);
        return NextResponse.json(
            {error:"Something went wrong"},
            {status: 500}
        );
    }
}
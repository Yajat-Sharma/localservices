export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Don't reveal if email exists
      return NextResponse.json({ message: "If this email exists, a reset link has been sent" });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save token to database
    await prisma.user.update({
      where: { email },
      data: {
        resetToken,
        resetTokenExpiry: resetExpiry,
      },
    });

    // Send email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;

    await transporter.sendMail({
      from: `"LocalServices" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Reset your LocalServices password",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0c8ee8;">Reset Your Password</h2>
          <p>You requested to reset your password for LocalServices.</p>
          <p>Click the button below to reset it. This link expires in 1 hour.</p>
          <a href="${resetUrl}" style="display: inline-block; background: #0c8ee8; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 16px 0;">
            Reset Password
          </a>
          <p style="color: #666; font-size: 14px;">If you didn't request this, ignore this email.</p>
          <p style="color: #666; font-size: 12px;">Link: ${resetUrl}</p>
        </div>
      `,
    });

    return NextResponse.json({ message: "Reset link sent to your email!" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to send reset email" }, { status: 500 });
  }
}
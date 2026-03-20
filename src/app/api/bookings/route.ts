export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendEmail(to: string, subject: string, html: string) {
  try {
    await transporter.sendMail({
      from: `"LocalServices" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error("Email error:", err);
  }
}

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const where: any = user.role === "PROVIDER" && user.provider
    ? { providerId: user.provider.id }
    : { customerId: user.id };
  const bookings = await prisma.booking.findMany({
    where,
    include: {
      provider: { include: { category: true, user: { select: { name: true, phone: true, email: true } } } },
      customer: { select: { name: true, phone: true, email: true, avatar: true } },
      review: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ bookings });
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { providerId, problem, address, latitude, longitude } = await req.json();
  if (!providerId || !problem) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

  const provider = await prisma.provider.findUnique({
    where: { id: providerId },
    include: { user: true, category: true },
  });
  if (!provider) return NextResponse.json({ error: "Provider not found" }, { status: 404 });
  if (!provider.isApproved) return NextResponse.json({ error: "Provider not approved" }, { status: 400 });

  const now = new Date();
  const isAvailable = provider.isAvailable && (!provider.unavailableUntil || provider.unavailableUntil < now);
  if (!isAvailable && !provider.allowMultiple) {
    return NextResponse.json({ error: "Provider is unavailable", message: "This provider is currently unavailable." }, { status: 400 });
  }

  const booking = await prisma.booking.create({
    data: { customerId: user.id, providerId, problem, address, latitude, longitude },
    include: {
      provider: { include: { category: true, user: true } },
      customer: { select: { name: true, phone: true, email: true } },
    },
  });

  if (!provider.allowMultiple) {
    await prisma.provider.update({
      where: { id: providerId },
      data: { unavailableUntil: new Date(Date.now() + 4 * 3600000), isAvailable: false, totalBookings: { increment: 1 } },
    });
  } else {
    await prisma.provider.update({ where: { id: providerId }, data: { totalBookings: { increment: 1 } } });
  }

  // Send email to provider
  if (provider.user.email) {
    await sendEmail(
      provider.user.email,
      `🔔 New Booking Request - ${provider.category.name}`,
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #0c8ee8, #0059a0); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
            <h1 style="color: white; margin: 0; font-size: 24px;">New Booking Request! 🎉</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0;">Someone needs your ${provider.category.name} service</p>
          </div>
          <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 16px;">
            <h3 style="color: #1e293b; margin: 0 0 16px;">Booking Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; color: #64748b; font-size: 14px;">Customer</td><td style="padding: 8px 0; font-weight: bold; color: #1e293b;">${booking.customer.name || "Customer"}</td></tr>
              <tr><td style="padding: 8px 0; color: #64748b; font-size: 14px;">Phone</td><td style="padding: 8px 0; font-weight: bold; color: #1e293b;">${booking.customer.phone || "N/A"}</td></tr>
              <tr><td style="padding: 8px 0; color: #64748b; font-size: 14px;">Problem</td><td style="padding: 8px 0; font-weight: bold; color: #1e293b;">${problem}</td></tr>
              ${address ? `<tr><td style="padding: 8px 0; color: #64748b; font-size: 14px;">Address</td><td style="padding: 8px 0; font-weight: bold; color: #1e293b;">${address}</td></tr>` : ""}
              <tr><td style="padding: 8px 0; color: #64748b; font-size: 14px;">Time</td><td style="padding: 8px 0; font-weight: bold; color: #1e293b;">${new Date().toLocaleString("en-IN")}</td></tr>
            </table>
          </div>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/bookings" style="display: block; background: #0c8ee8; color: white; padding: 14px 24px; border-radius: 10px; text-decoration: none; font-weight: bold; text-align: center; margin-bottom: 16px;">
            View & Accept Booking →
          </a>
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">LocalServices • Connecting local communities</p>
        </div>
      `
    );
  }

  // Send confirmation to customer
  if (user.email) {
    await sendEmail(
      user.email,
      `✅ Booking Confirmed - ${provider.category.name}`,
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Booking Sent! ✅</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0;">Your request has been sent to ${provider.businessName}</p>
          </div>
          <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 16px;">
            <h3 style="color: #1e293b; margin: 0 0 16px;">Your Booking</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; color: #64748b; font-size: 14px;">Service</td><td style="padding: 8px 0; font-weight: bold; color: #1e293b;">${provider.category.name}</td></tr>
              <tr><td style="padding: 8px 0; color: #64748b; font-size: 14px;">Provider</td><td style="padding: 8px 0; font-weight: bold; color: #1e293b;">${provider.businessName}</td></tr>
              <tr><td style="padding: 8px 0; color: #64748b; font-size: 14px;">Problem</td><td style="padding: 8px 0; font-weight: bold; color: #1e293b;">${problem}</td></tr>
              <tr><td style="padding: 8px 0; color: #64748b; font-size: 14px;">Status</td><td style="padding: 8px 0;"><span style="background: #fef3c7; color: #d97706; padding: 2px 8px; border-radius: 20px; font-size: 12px; font-weight: bold;">Pending</span></td></tr>
            </table>
          </div>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/bookings" style="display: block; background: #10b981; color: white; padding: 14px 24px; border-radius: 10px; text-decoration: none; font-weight: bold; text-align: center;">
            Track Your Booking →
          </a>
          <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 16px;">LocalServices • Connecting local communities</p>
        </div>
      `
    );
  }

  return NextResponse.json({ booking }, { status: 201 });
}
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import nodemailer from "nodemailer";
import { createNotification } from "@/lib/notifications";
import { sendSMS, SMS_TEMPLATES } from "@/lib/sms";

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
      to, subject, html,
    });
  } catch (err) { console.error("Email error:", err); }
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

  const { providerId, problem, address, latitude, longitude, scheduledDate, scheduledTime } = await req.json();
  if (!providerId || !problem) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  if (!scheduledDate || !scheduledTime) return NextResponse.json({ error: "Please select a date and time for your appointment" }, { status: 400 });

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

  // Combine date + time into a proper DateTime
  const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}:00`);

  const booking = await prisma.booking.create({
    data: {
      customerId: user.id,
      providerId,
      problem,
      address,
      latitude,
      longitude,
      scheduledDate: scheduledAt,
      scheduledTime,
    },
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

  // Format scheduled date/time nicely for the email
  const formattedDate = scheduledAt.toLocaleDateString("en-IN", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
  const formattedTime = scheduledAt.toLocaleTimeString("en-IN", {
    hour: "2-digit", minute: "2-digit", hour12: true,
  });

  // Send rich email to provider
  if (provider.user.email) {
    await sendEmail(
      provider.user.email,
      `🔔 New Booking Request — ${provider.category.name} | ${formattedDate}`,
      `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; border-radius: 16px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #2563eb, #4f46e5); padding: 28px 24px;">
          <h1 style="color: white; margin: 0; font-size: 22px;">🔔 New Booking Request!</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 6px 0 0; font-size: 14px;">${provider.category.name} service</p>
        </div>
        <div style="padding: 24px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 13px; width: 140px;">👤 Customer</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #0f172a;">${booking.customer.name || "Customer"}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 13px;">📱 Phone</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #0f172a;">${booking.customer.phone || "Not provided"}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 13px;">📋 Problem</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #0f172a;">${problem}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 13px;">📍 Address</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #0f172a;">${address || "Not provided"}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 13px;">📅 Date</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #2563eb;">${formattedDate}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #64748b; font-size: 13px;">⏰ Time</td>
              <td style="padding: 10px 0; font-weight: 600; color: #2563eb;">${formattedTime}</td>
            </tr>
          </table>
          <div style="margin-top: 24px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/bookings" style="display: inline-block; background: linear-gradient(135deg, #2563eb, #4f46e5); color: white; padding: 12px 28px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 14px;">View & Accept Booking →</a>
          </div>
        </div>
      </div>`
    );
  }

  // Send confirmation to customer
  if (user.email) {
    await sendEmail(
      user.email,
      `✅ Booking Confirmed — ${provider.category.name} on ${formattedDate}`,
      `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; border-radius: 16px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #059669, #10b981); padding: 28px 24px;">
          <h1 style="color: white; margin: 0; font-size: 22px;">✅ Booking Request Sent!</h1>
          <p style="color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 14px;">Your request is being reviewed by the provider</p>
        </div>
        <div style="padding: 24px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 13px; width: 140px;">🏪 Provider</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #0f172a;">${provider.businessName}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 13px;">📋 Service</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #0f172a;">${provider.category.name}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 13px;">📅 Date</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #059669;">${formattedDate}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #64748b; font-size: 13px;">⏰ Time</td>
              <td style="padding: 10px 0; font-weight: 600; color: #059669;">${formattedTime}</td>
            </tr>
          </table>
          <div style="margin-top: 24px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/bookings" style="display: inline-block; background: linear-gradient(135deg, #059669, #10b981); color: white; padding: 12px 28px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 14px;">Track Your Booking →</a>
          </div>
        </div>
      </div>`
    );
  }

  // Notify provider
  await createNotification({
    userId: provider.userId,
    title: "New Booking Request! 🔔",
    message: `${booking.customer.name || "A customer"} booked your ${provider.category.name} for ${formattedDate} at ${formattedTime}`,
    type: "booking",
    link: "/bookings",
  });

  // Notify customer
  await createNotification({
    userId: user.id,
    title: "Booking Sent! ✅",
    message: `Your request to ${provider.businessName} for ${formattedDate} has been sent`,
    type: "success",
    link: "/bookings",
  });

  return NextResponse.json({ booking }, { status: 201 });
}
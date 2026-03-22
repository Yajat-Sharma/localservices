export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import nodemailer from "nodemailer";
import { createNotification } from "@/lib/notifications";

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
      `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #0c8ee8;">New Booking Request! 🎉</h1>
        <p>Customer: ${booking.customer.name || "Customer"}</p>
        <p>Problem: ${problem}</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/bookings" style="background: #0c8ee8; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">View Booking →</a>
      </div>`
    );
  }

  // Send confirmation to customer
  if (user.email) {
    await sendEmail(
      user.email,
      `✅ Booking Sent - ${provider.category.name}`,
      `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #10b981;">Booking Sent! ✅</h1>
        <p>Provider: ${provider.businessName}</p>
        <p>Problem: ${problem}</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/bookings" style="background: #10b981; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">Track Booking →</a>
      </div>`
    );
  }

  // Notify provider
  await createNotification({
    userId: provider.userId,
    title: "New Booking Request! 🔔",
    message: `${booking.customer.name || "A customer"} needs your ${provider.category.name} service`,
    type: "booking",
    link: "/bookings",
  });

  // Notify customer
  await createNotification({
    userId: user.id,
    title: "Booking Sent! ✅",
    message: `Your request has been sent to ${provider.businessName}`,
    type: "success",
    link: "/bookings",
  });

  return NextResponse.json({ booking }, { status: 201 });
}
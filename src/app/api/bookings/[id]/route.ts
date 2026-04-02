export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import nodemailer from "nodemailer";
import { createNotification } from "@/lib/notifications";
import { sendSMS, SMS_TEMPLATES } from "@/lib/sms";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

async function sendEmail(to: string, subject: string, html: string) {
  try {
    await transporter.sendMail({ from: `"LocalServices" <${process.env.EMAIL_USER}>`, to, subject, html });
  } catch (err) { console.error("Email error:", err); }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { status, price } = await req.json();
  const booking = await prisma.booking.findUnique({
    where: { id: params.id },
    include: {
      provider: { include: { category: true, user: true } },
      customer: true,
    },
  });

  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isProvider = user.provider?.id === booking.providerId;
  const isCustomer = user.id === booking.customerId;
  if (!isProvider && !isCustomer) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const updateData: any = {};
  if (status) updateData.status = status;
  if (price && isProvider) updateData.price = price;
  if (status === "COMPLETED") updateData.completedAt = new Date();

  const updated = await prisma.booking.update({
    where: { id: params.id },
    data: updateData,
    include: {
      provider: { include: { category: true } },
      customer: true,
    },
  });
  // Send notifications based on status
if (status === "ACCEPTED") {
  await createNotification({
    userId: booking.customerId,
    title: "Booking Accepted! 🎉",
    message: `${booking.provider.businessName} accepted your booking`,
    type: "success",
    link: "/bookings",
  });
}

const customerPhone = booking.customer.phone;
const providerPhone = booking.provider.user.phone;
const categoryName = booking.provider.category.name;
const providerName = booking.provider.businessName;

if (status === "ACCEPTED" && customerPhone) {
  await sendSMS(
    customerPhone,
    SMS_TEMPLATES.bookingAccepted(providerName, categoryName)
  );
}

if (status === "IN_PROGRESS" && customerPhone) {
  await sendSMS(
    customerPhone,
    SMS_TEMPLATES.bookingStarted(providerName)
  );
}

if (status === "COMPLETED") {
  if (customerPhone) {
    await sendSMS(
      customerPhone,
      SMS_TEMPLATES.bookingCompleted(providerName, categoryName)
    );
  }
  if (providerPhone) {
    await sendSMS(
      providerPhone,
      `✅ LocalServices: Job completed! Great work. Check your earnings in the app.`
    );
  }
}

if (status === "CANCELLED" && customerPhone) {
  await sendSMS(
    customerPhone,
    SMS_TEMPLATES.bookingCancelled(categoryName)
  );
}

if (status === "COMPLETED") {
  await createNotification({
    userId: booking.customerId,
    title: "Service Completed! ⭐",
    message: `Please rate your experience with ${booking.provider.businessName}`,
    type: "success",
    link: `/provider/${booking.providerId}`,
  });
  await createNotification({
    userId: booking.provider.userId,
    title: "Job Completed! 💰",
    message: `You completed a job for ${booking.customer.name || "a customer"}`,
    type: "success",
    link: "/provide/earnings",
  });
}

if (status === "CANCELLED") {
  await createNotification({
    userId: booking.customerId,
    title: "Booking Cancelled",
    message: `Your booking with ${booking.provider.businessName} was cancelled`,
    type: "error",
    link: "/hire",
  });
}

  if (status === "COMPLETED" || status === "CANCELLED") {
    if (booking.provider && !booking.provider.allowMultiple) {
      await prisma.provider.update({
        where: { id: booking.providerId },
        data: { isAvailable: true, unavailableUntil: null },
      });
    }
  }

  // Send email notifications based on status
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const categoryName = booking.provider.category.name;
  const providerName = booking.provider.businessName;
  const customerName = booking.customer.name || "Customer";
  const customerEmail = booking.customer.email;
  const providerEmail = booking.provider.user.email;

  if (status === "ACCEPTED" && customerEmail) {
    await sendEmail(
      customerEmail,
      `✅ Booking Accepted - ${categoryName}`,
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
            <h1 style="color: white; margin: 0;">Booking Accepted! 🎉</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0;">${providerName} accepted your request</p>
          </div>
          <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 16px;">
            <p style="color: #1e293b;">Your <strong>${categoryName}</strong> service request has been accepted by <strong>${providerName}</strong>. They will contact you shortly.</p>
            <p style="color: #64748b; font-size: 14px;">Problem: ${booking.problem}</p>
          </div>
          <a href="${appUrl}/bookings" style="display: block; background: #10b981; color: white; padding: 14px; border-radius: 10px; text-decoration: none; font-weight: bold; text-align: center;">
            View Booking →
          </a>
        </div>
      `
    );
  }

  if (status === "COMPLETED") {
    if (customerEmail) {
      await sendEmail(
        customerEmail,
        `⭐ Service Completed - Please Rate ${providerName}`,
        `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
              <h1 style="color: white; margin: 0;">Service Completed! ⭐</h1>
              <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0;">How was your experience?</p>
            </div>
            <p style="color: #1e293b;">Your <strong>${categoryName}</strong> service by <strong>${providerName}</strong> has been marked as completed.</p>
            <p style="color: #64748b;">Please take a moment to rate your experience — it helps other customers!</p>
            <a href="${appUrl}/provider/${booking.providerId}" style="display: block; background: #f59e0b; color: white; padding: 14px; border-radius: 10px; text-decoration: none; font-weight: bold; text-align: center; margin-top: 16px;">
              Rate Your Experience ⭐ →
            </a>
          </div>
        `
      );
    }
    if (providerEmail) {
      await sendEmail(
        providerEmail,
        `💰 Job Completed - ${categoryName}`,
        `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #8b5cf6, #6d28d9); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
              <h1 style="color: white; margin: 0;">Job Completed! 💪</h1>
              <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0;">Great work!</p>
            </div>
            <p style="color: #1e293b;">You have successfully completed a <strong>${categoryName}</strong> job for <strong>${customerName}</strong>.</p>
            ${price ? `<p style="color: #10b981; font-size: 18px; font-weight: bold;">Earned: ₹${price}</p>` : ""}
            <a href="${appUrl}/provide/dashboard" style="display: block; background: #8b5cf6; color: white; padding: 14px; border-radius: 10px; text-decoration: none; font-weight: bold; text-align: center; margin-top: 16px;">
              View Dashboard →
            </a>
          </div>
        `
      );
    }
  }

  if (status === "CANCELLED" && customerEmail) {
    await sendEmail(
      customerEmail,
      `❌ Booking Cancelled - ${categoryName}`,
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #ef4444, #dc2626); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
            <h1 style="color: white; margin: 0;">Booking Cancelled</h1>
          </div>
          <p style="color: #1e293b;">Your <strong>${categoryName}</strong> booking with <strong>${providerName}</strong> has been cancelled.</p>
          <a href="${appUrl}/hire" style="display: block; background: #0c8ee8; color: white; padding: 14px; border-radius: 10px; text-decoration: none; font-weight: bold; text-align: center; margin-top: 16px;">
            Find Another Provider →
          </a>
        </div>
      `
    );
  }

  return NextResponse.json({ booking: updated });
}
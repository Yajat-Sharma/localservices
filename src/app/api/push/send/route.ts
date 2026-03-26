export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import webpush from "web-push";

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { userId, title, message, link } = await req.json();

  const targetUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!targetUser?.pushSubscription) {
    return NextResponse.json({ error: "No subscription" }, { status: 404 });
  }

  try {
    const subscription = JSON.parse(targetUser.pushSubscription);
    await webpush.sendNotification(subscription, JSON.stringify({
      title,
      message,
      link,
      icon: "/icon-192.png",
    }));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Push error:", err);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
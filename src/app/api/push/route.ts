export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { subscription } = await req.json();
  if (!subscription) return NextResponse.json({ error: "No subscription" }, { status: 400 });

  await prisma.user.update({
    where: { id: user.id },
    data: { pushSubscription: JSON.stringify(subscription) },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.user.update({
    where: { id: user.id },
    data: { pushSubscription: null },
  });

  return NextResponse.json({ success: true });
}
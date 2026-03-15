import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const [users, providers, bookings, pendingProviders] = await Promise.all([prisma.user.count(), prisma.provider.count({ where: { isApproved: true } }), prisma.booking.count(), prisma.provider.count({ where: { isApproved: false } })]);
  return NextResponse.json({ users, providers, bookings, pendingProviders });
}

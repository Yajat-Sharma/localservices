import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { status, price } = await req.json();
  const booking = await prisma.booking.findUnique({ where: { id: params.id }, include: { provider: true } });
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const isProvider = user.provider?.id === booking.providerId;
  const isCustomer = user.id === booking.customerId;
  if (!isProvider && !isCustomer) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const updateData: any = {};
  if (status) updateData.status = status;
  if (price && isProvider) updateData.price = price;
  if (status === "COMPLETED") updateData.completedAt = new Date();
  const updated = await prisma.booking.update({ where: { id: params.id }, data: updateData, include: { provider: { include: { category: true } }, customer: true } });
  if ((status === "COMPLETED" || status === "CANCELLED") && booking.provider && !booking.provider.allowMultiple) await prisma.provider.update({ where: { id: booking.providerId }, data: { isAvailable: true, unavailableUntil: null } });
  return NextResponse.json({ booking: updated });
}

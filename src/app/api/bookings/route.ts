import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const where: any = user.role === "PROVIDER" && user.provider ? { providerId: user.provider.id } : { customerId: user.id };
  const bookings = await prisma.booking.findMany({ where, include: { provider: { include: { category: true, user: { select: { name: true, phone: true } } } }, customer: { select: { name: true, phone: true, avatar: true } }, review: true }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ bookings });
}
export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { providerId, problem, address, latitude, longitude } = await req.json();
  if (!providerId || !problem) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  const provider = await prisma.provider.findUnique({ where: { id: providerId } });
  if (!provider) return NextResponse.json({ error: "Provider not found" }, { status: 404 });
  if (!provider.isApproved) return NextResponse.json({ error: "Provider not approved" }, { status: 400 });
  const now = new Date();
  const isAvailable = provider.isAvailable && (!provider.unavailableUntil || provider.unavailableUntil < now);
  if (!isAvailable && !provider.allowMultiple) return NextResponse.json({ error: "Provider is unavailable", message: "This provider is currently unavailable." }, { status: 400 });
  const booking = await prisma.booking.create({ data: { customerId: user.id, providerId, problem, address, latitude, longitude }, include: { provider: { include: { category: true } }, customer: { select: { name: true, phone: true } } } });
  if (!provider.allowMultiple) await prisma.provider.update({ where: { id: providerId }, data: { unavailableUntil: new Date(Date.now() + 4*3600000), isAvailable: false, totalBookings: { increment: 1 } } });
  else await prisma.provider.update({ where: { id: providerId }, data: { totalBookings: { increment: 1 } } });
  return NextResponse.json({ booking }, { status: 201 });
}

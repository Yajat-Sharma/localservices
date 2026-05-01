export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  // Next 15: params is now a Promise — must be awaited
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const messages = await prisma.message.findMany({ where: { bookingId: id }, include: { sender: { select: { name: true, avatar: true } } }, orderBy: { createdAt: "asc" } });
  return NextResponse.json({ messages });
}

export async function POST(
  req: NextRequest,
  // Next 15: params is now a Promise — must be awaited
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { content } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "Empty message" }, { status: 400 });
  const booking = await prisma.booking.findUnique({ where: { id }, include: { provider: true } });
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const isCustomer = user.id === booking.customerId;
  const receiverId = isCustomer ? booking.provider.userId : booking.customerId;
  const message = await prisma.message.create({ data: { bookingId: id, senderId: user.id, receiverId, content: content.trim() }, include: { sender: { select: { name: true, avatar: true } } } });
  return NextResponse.json({ message }, { status: 201 });
}

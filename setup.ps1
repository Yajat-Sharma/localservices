$providerRoute = Get-Content "src\app\api\providers\route.ts" -Raw
Set-Content -LiteralPath "src\app\api\providers\[id]\route.ts" -Value @'
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { haversineDistance } from "@/lib/geo";
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get("lat") || "0");
  const lng = parseFloat(searchParams.get("lng") || "0");
  const provider = await prisma.provider.findUnique({ where: { id: params.id }, include: { user: { select: { name: true, avatar: true, phone: true } }, category: true } });
  if (!provider) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const reviews = await prisma.review.findMany({ where: { providerId: params.id }, include: { customer: { select: { name: true, avatar: true } } }, orderBy: { createdAt: "desc" }, take: 20 });
  const distance = lat && lng ? haversineDistance(lat, lng, provider.latitude, provider.longitude) : undefined;
  const isAvailable = provider.isAvailable && (!provider.unavailableUntil || provider.unavailableUntil < new Date());
  return NextResponse.json({ provider: { ...provider, distance, isAvailable }, reviews });
}
'@

Set-Content -LiteralPath "src\app\api\providers\[id]\review\route.ts" -Value @'
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { rating, comment } = await req.json();
  if (!rating || rating < 1 || rating > 5) return NextResponse.json({ error: "Rating must be 1-5" }, { status: 400 });
  const booking = await prisma.booking.findFirst({ where: { customerId: user.id, providerId: params.id, status: "COMPLETED", review: null } });
  if (!booking) return NextResponse.json({ error: "No completed booking found" }, { status: 400 });
  const review = await prisma.review.create({ data: { bookingId: booking.id, customerId: user.id, providerId: params.id, rating, comment } });
  const reviews = await prisma.review.findMany({ where: { providerId: params.id } });
  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  await prisma.provider.update({ where: { id: params.id }, data: { avgRating, totalReviews: reviews.length } });
  return NextResponse.json({ review });
}
'@

Set-Content -LiteralPath "src\app\api\bookings\[id]\route.ts" -Value @'
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
'@

Set-Content -LiteralPath "src\app\api\bookings\[id]\messages\route.ts" -Value @'
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const booking = await prisma.booking.findUnique({ where: { id: params.id } });
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const messages = await prisma.message.findMany({ where: { bookingId: params.id }, include: { sender: { select: { name: true, avatar: true } } }, orderBy: { createdAt: "asc" } });
  return NextResponse.json({ messages });
}
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { content } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "Empty message" }, { status: 400 });
  const booking = await prisma.booking.findUnique({ where: { id: params.id }, include: { provider: true } });
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const isCustomer = user.id === booking.customerId;
  const receiverId = isCustomer ? booking.provider.userId : booking.customerId;
  const message = await prisma.message.create({ data: { bookingId: params.id, senderId: user.id, receiverId, content: content.trim() }, include: { sender: { select: { name: true, avatar: true } } } });
  return NextResponse.json({ message }, { status: 201 });
}
'@

Set-Content -LiteralPath "src\app\api\admin\providers\[id]\route.ts" -Value @'
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { isApproved } = await req.json();
  const provider = await prisma.provider.update({ where: { id: params.id }, data: { isApproved }, include: { user: true, category: true } });
  return NextResponse.json({ provider });
}
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await prisma.provider.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
'@

Write-Host "Fix complete!" -ForegroundColor Green
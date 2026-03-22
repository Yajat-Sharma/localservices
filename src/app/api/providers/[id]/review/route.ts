export const dynamic = "force-dynamic";
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

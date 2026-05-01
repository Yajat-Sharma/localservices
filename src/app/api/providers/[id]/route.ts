export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { haversineDistance } from "@/lib/geo";
export async function GET(
  req: NextRequest,
  // Next 15: params is now a Promise — must be awaited
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get("lat") || "0");
  const lng = parseFloat(searchParams.get("lng") || "0");
  const provider = await prisma.provider.findUnique({ where: { id }, include: { user: { select: { name: true, avatar: true, phone: true } }, category: true } });
  if (!provider) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const reviews = await prisma.review.findMany({ where: { providerId: id }, include: { customer: { select: { name: true, avatar: true } } }, orderBy: { createdAt: "desc" }, take: 20 });
  const distance = lat && lng ? haversineDistance(lat, lng, provider.latitude, provider.longitude) : undefined;
  const isAvailable = provider.isAvailable && (!provider.unavailableUntil || provider.unavailableUntil < new Date());
  return NextResponse.json({ provider: { ...provider, distance, isAvailable }, reviews });
}

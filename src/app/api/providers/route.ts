import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { haversineDistance } from "@/lib/geo";
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get("lat") || "0");
  const lng = parseFloat(searchParams.get("lng") || "0");
  const radius = parseFloat(searchParams.get("radius") || "5");
  const category = searchParams.get("category");
  const search = searchParams.get("search");
  const where: any = { isApproved: true };
  if (category) where.category = { slug: category };
  if (search) where.OR = [{ businessName: { contains: search, mode: "insensitive" } }, { description: { contains: search, mode: "insensitive" } }];
  const providers = await prisma.provider.findMany({ where, include: { user: { select: { name: true, avatar: true, phone: true } }, category: true }, orderBy: [{ avgRating: "desc" }] });
  const now = new Date();
  const filtered = providers.map((p) => {
    const distance = lat && lng ? haversineDistance(lat, lng, p.latitude, p.longitude) : null;
    const isAvailable = p.isAvailable && (!p.unavailableUntil || p.unavailableUntil < now);
    return { ...p, distance, isAvailable };
  }).filter((p) => !lat || !lng || p.distance === null || p.distance <= radius)
    .sort((a, b) => (a.distance ?? 99) - (b.distance ?? 99));
  return NextResponse.json({ providers: filtered });
}
export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { businessName, categoryId, description, priceMin, priceMax, latitude, longitude, address, city, state, pincode, whatsapp, allowMultiple, images } = body;
  if (!businessName || !categoryId || !latitude || !longitude) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  const existing = await prisma.provider.findUnique({ where: { userId: user.id } });
  if (existing) return NextResponse.json({ error: "Provider already registered" }, { status: 400 });
  const [count, setting] = await Promise.all([prisma.provider.count({ where: { isApproved: true } }), prisma.adminSetting.findUnique({ where: { key: "free_registration_limit" } })]);
  const isPaid = count >= parseInt(setting?.value || "50");
  const provider = await prisma.provider.create({ data: { userId: user.id, businessName, categoryId, description, priceMin, priceMax, latitude, longitude, address: address||"", city: city||"", state: state||"", pincode: pincode||"", whatsapp, allowMultiple: allowMultiple||false, images: images||[], isPaid }, include: { category: true } });
  await prisma.user.update({ where: { id: user.id }, data: { role: "PROVIDER" } });
  return NextResponse.json({ provider });
}

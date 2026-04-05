export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest, signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const {
      businessName, categoryId, description,
      priceMin, priceMax, serviceRadius,
      latitude, longitude, address,
      city, state, pincode, whatsapp,
      allowMultiple,
    } = await req.json();

    if (!businessName || !categoryId || !priceMin || !priceMax || !address || !city || !pincode) {
      return NextResponse.json({ error: "Please fill all required fields" }, { status: 400 });
    }

    // Check if provider already exists
    const existing = await prisma.provider.findUnique({ where: { userId: user.id } });
    if (existing) {
      return NextResponse.json({ error: "Provider profile already exists" }, { status: 400 });
    }

    const provider = await prisma.provider.create({
      data: {
        userId: user.id,
        businessName,
        categoryId,
        description,
        priceMin: Number(priceMin),
        priceMax: Number(priceMax),
        serviceRadius: Number(serviceRadius) || 5,
        latitude: Number(latitude) || 19.076,
        longitude: Number(longitude) || 72.877,
        address, city, state: state || "",
        pincode, whatsapp, allowMultiple: allowMultiple || false,
        isApproved: false,
      },
      include: { category: true },
    });

    return NextResponse.json({ provider, message: "Provider profile created! Awaiting admin approval." }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create provider profile" }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
export async function PATCH(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!user.provider) return NextResponse.json({ error: "Not a provider" }, { status: 400 });
  const body = await req.json();
  const allowed = ["isAvailable","description","priceMin","priceMax","whatsapp","images","allowMultiple","workingHours"];
  const updateData: Record<string,any> = {};
  for (const field of allowed) { if (body[field] !== undefined) updateData[field] = body[field]; }
  if (body.unavailableHours) { updateData.unavailableUntil = new Date(Date.now() + body.unavailableHours * 3600000); updateData.isAvailable = false; }
  const provider = await prisma.provider.update({ where: { id: user.provider.id }, data: updateData, include: { category: true } });
  return NextResponse.json({ provider });
}


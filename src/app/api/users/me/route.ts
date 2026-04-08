export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function PATCH(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, language, phone } = await req.json();
  const updateData: any = {};

  if (name !== undefined) updateData.name = name;
  if (language !== undefined) updateData.language = language;
  if (phone !== undefined && phone !== null) {
    // Check phone not already taken by someone else
    const existing = await prisma.user.findFirst({
      where: { phone, NOT: { id: user.id } }
    });
    if (existing) {
      return NextResponse.json({ error: "Phone number already registered to another account" }, { status: 400 });
    }
    updateData.phone = phone;
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: updateData,
    include: { provider: { include: { category: true } } },
  });

  return NextResponse.json({ user: updated });
}
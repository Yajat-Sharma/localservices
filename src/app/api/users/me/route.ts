export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function PATCH(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, language } = await req.json();
  const updateData: any = {};
  if (name) updateData.name = name;
  if (language) updateData.language = language;

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: updateData,
    include: { provider: { include: { category: true } } },
  });

  return NextResponse.json({ user: updated });
}
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { Prisma } from "@prisma/client";
export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const approvedParam = searchParams.get("approved");
  const where: Prisma.ProviderWhereInput = {};
  if (approvedParam !== null) where.isApproved = approvedParam === "true";
  const providers = await prisma.provider.findMany({ where, include: { user: { select: { name: true, phone: true } }, category: true }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ providers });
}

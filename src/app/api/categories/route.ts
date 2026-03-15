export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export async function GET() {
  const [categories, count, setting] = await Promise.all([
    prisma.category.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.provider.count({ where: { isApproved: true } }),
    prisma.adminSetting.findUnique({ where: { key: "free_registration_limit" } }),
  ]);
  const limit = parseInt(setting?.value || "50");
  return NextResponse.json({ categories, freeSlots: Math.max(0, limit - count) });
}


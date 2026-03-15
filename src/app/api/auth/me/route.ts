export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ user });
}
export async function PATCH(req: NextRequest) {
  const currentUser = await getUserFromRequest(req);
  if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const allowedFields = ["name","email","avatar","role","language"];
  const updateData: Record<string,any> = {};
  for (const field of allowedFields) { if (body[field] !== undefined) updateData[field] = body[field]; }
  if (updateData.role && !["CUSTOMER","PROVIDER"].includes(updateData.role)) delete updateData.role;
  const user = await prisma.user.update({ where: { id: currentUser.id }, data: updateData, include: { provider: { include: { category: true } } } });
  return NextResponse.json({ user });
}


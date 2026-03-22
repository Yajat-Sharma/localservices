export const dynamic = "force-dynamic";
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { isApproved, isVerified } = await req.json();
  const updateData: any = {};
  if (isApproved !== undefined) updateData.isApproved = isApproved;
  if (isVerified !== undefined) updateData.isVerified = isVerified;

  const provider = await prisma.provider.update({
    where: { id: params.id },
    data: updateData,
    include: { user: true, category: true }
  });

  return NextResponse.json({ provider });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await prisma.provider.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
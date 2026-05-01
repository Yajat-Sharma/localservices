export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  // Next 15: params is now a Promise — must be awaited
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { isApproved, isVerified } = await req.json();
  const updateData: any = {};
  if (isApproved !== undefined) updateData.isApproved = isApproved;
  if (isVerified !== undefined) updateData.isVerified = isVerified;

  const provider = await prisma.provider.update({
    where: { id },
    data: updateData,
    include: { user: true, category: true }
  });

  return NextResponse.json({ provider });
}

export async function DELETE(
  req: NextRequest,
  // Next 15: params is now a Promise — must be awaited
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await prisma.provider.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
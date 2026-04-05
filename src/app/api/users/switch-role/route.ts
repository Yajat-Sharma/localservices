export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { role } = await req.json();

  if (!["CUSTOMER", "PROVIDER", "ADMIN"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  // Only admin can switch to ADMIN role
  if (role === "ADMIN" && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Cannot switch to ADMIN" }, { status: 403 });
  }

  // To switch to PROVIDER, must have a provider profile
  if (role === "PROVIDER") {
    const provider = await prisma.provider.findUnique({ where: { userId: user.id } });
    if (!provider) {
      return NextResponse.json({ error: "No provider profile found. Please register as provider first." }, { status: 400 });
    }
    if (!provider.isApproved) {
      return NextResponse.json({ error: "Your provider profile is pending approval." }, { status: 400 });
    }
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { role },
    include: { provider: { include: { category: true } } },
  });

  const token = await signToken({ userId: updated.id, role: updated.role });
  return NextResponse.json({ token, user: updated });
}
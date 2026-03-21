export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!user.provider) return NextResponse.json({ error: "Not a provider" }, { status: 400 });

  const provider = await prisma.provider.findUnique({
    where: { id: user.provider.id },
    include: { category: true },
  });

  return NextResponse.json({ provider });
}
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const providers = await prisma.provider.findMany({
    where: {
      OR: [
        { idProofUrl: { not: null } },
        { licenseUrl: { not: null } },
      ],
    },
    include: {
      user: { select: { name: true, phone: true, email: true } },
      category: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ providers });
}

export async function PATCH(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { providerId, idProofStatus, licenseStatus } = await req.json();
  const updateData: any = {};
  if (idProofStatus) updateData.idProofStatus = idProofStatus;
  if (licenseStatus) updateData.licenseStatus = licenseStatus;

  // Auto verify provider if both docs approved
  if (idProofStatus === "APPROVED" && licenseStatus === "APPROVED") {
    updateData.isVerified = true;
  }

  const provider = await prisma.provider.update({
    where: { id: providerId },
    data: updateData,
  });

  return NextResponse.json({ provider });
}
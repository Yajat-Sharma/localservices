export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { uploadImage } from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!user.provider) return NextResponse.json({ error: "Not a provider" }, { status: 400 });

  try {
    const formData = await req.formData();
    const idProof = formData.get("idProof") as File | null;
    const license = formData.get("license") as File | null;

    const updateData: any = {};

    if (idProof) {
      const bytes = await idProof.arrayBuffer();
      const base64 = `data:${idProof.type};base64,${Buffer.from(bytes).toString("base64")}`;
      const url = await uploadImage(base64, `localservices/documents/${user.id}`);
      updateData.idProofUrl = url;
      updateData.idProofStatus = "PENDING";
    }

    if (license) {
      const bytes = await license.arrayBuffer();
      const base64 = `data:${license.type};base64,${Buffer.from(bytes).toString("base64")}`;
      const url = await uploadImage(base64, `localservices/documents/${user.id}`);
      updateData.licenseUrl = url;
      updateData.licenseStatus = "PENDING";
    }

    const provider = await prisma.provider.update({
      where: { id: user.provider.id },
      data: updateData,
    });

    return NextResponse.json({ provider, message: "Documents uploaded successfully!" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
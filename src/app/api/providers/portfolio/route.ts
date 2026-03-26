export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { uploadImage } from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user || !user.provider) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await req.formData();
    const files = formData.getAll("photos") as File[];
    if (!files.length) return NextResponse.json({ error: "No files" }, { status: 400 });
    if (files.length > 6) return NextResponse.json({ error: "Max 6 photos" }, { status: 400 });

    const urls: string[] = [];
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) continue;
      const bytes = await file.arrayBuffer();
      const base64 = `data:${file.type};base64,${Buffer.from(bytes).toString("base64")}`;
      const url = await uploadImage(base64, `localservices/portfolio/${user.id}`);
      urls.push(url);
    }

    const current = await prisma.provider.findUnique({
      where: { id: user.provider.id },
      select: { portfolio: true },
    });

    const allPhotos = [...(current?.portfolio || []), ...urls].slice(0, 12);

    const provider = await prisma.provider.update({
      where: { id: user.provider.id },
      data: { portfolio: allPhotos },
    });

    return NextResponse.json({ provider, urls });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user || !user.provider) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { url } = await req.json();
  const current = await prisma.provider.findUnique({
    where: { id: user.provider.id },
    select: { portfolio: true },
  });

  const updated = (current?.portfolio || []).filter(p => p !== url);
  const provider = await prisma.provider.update({
    where: { id: user.provider.id },
    data: { portfolio: updated },
  });

  return NextResponse.json({ provider });
}
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { uploadImage } from "@/lib/cloudinary";
export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    if (file.size > 5*1024*1024) return NextResponse.json({ error: "File too large" }, { status: 400 });
    const bytes = await file.arrayBuffer();
    const base64 = `data:${file.type};base64,${Buffer.from(bytes).toString("base64")}`;
    const url = await uploadImage(base64, `localservices/${user.id}`);
    return NextResponse.json({ url });
  } catch (err) { return NextResponse.json({ error: "Upload failed" }, { status: 500 }); }
}


export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/firebase-admin";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";
import { checkRateLimit, getClientIp, AUTH_RATE_LIMIT } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { limited, retryAfter } = checkRateLimit(`login:${ip}`, AUTH_RATE_LIMIT);
  if (limited) {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }
  try {
    const { firebaseToken, phone } = await req.json();
    const decoded = await admin.auth().verifyIdToken(firebaseToken);
    const phoneNumber = decoded.phone_number || phone;
    if (!phoneNumber) return NextResponse.json({ error: "Phone number required" }, { status: 400 });
    let user = await prisma.user.findUnique({ where: { phone: phoneNumber }, include: { provider: { include: { category: true } } } });
    if (!user) user = await prisma.user.create({ data: { phone: phoneNumber }, include: { provider: { include: { category: true } } } });
    const token = await signToken({ userId: user.id, role: user.role });
    return NextResponse.json({ token, user });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
  }
}

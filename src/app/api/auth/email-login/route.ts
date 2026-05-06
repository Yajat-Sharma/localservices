export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";
import bcrypt from "bcryptjs";

const ADMIN_EMAIL = "yajats@gmail.com";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    let user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { provider: { include: { category: true } } },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    if (!user.password) {
      return NextResponse.json({ error: "This account uses phone login. Please use Phone OTP." }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Ensure admin email always has ADMIN role
    if (user.email === ADMIN_EMAIL && user.role !== "ADMIN") {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { role: "ADMIN" },
        include: { provider: { include: { category: true } } },
      });
    }

    const token = await signToken({ userId: user.id, role: user.role });
    return NextResponse.json({ token, user });
  } catch (err) {
    console.error("Email login error:", err);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
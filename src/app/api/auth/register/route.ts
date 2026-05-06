export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";
import bcrypt from "bcryptjs";

const ADMIN_EMAIL = "yajats@gmail.com";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "All fields required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const isAdmin = email === ADMIN_EMAIL;

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone: null,
        role: isAdmin ? "ADMIN" : "CUSTOMER",
      },
      include: { provider: { include: { category: true } } },
    });

    const token = await signToken({ userId: user.id, role: user.role });
    return NextResponse.json({ token, user }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
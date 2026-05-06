export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/firebase-admin";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { firebaseToken } = await req.json();

    if (!firebaseToken) {
      return NextResponse.json({ error: "Firebase token required" }, { status: 400 });
    }

    // Verify the Google ID token via Firebase Admin
    const decoded = await admin.auth().verifyIdToken(firebaseToken);

    const { email, name, picture, uid } = decoded;

    if (!email) {
      return NextResponse.json({ error: "Google account has no email" }, { status: 400 });
    }

    // Find or create the user — prefer matching by email, fall back to creating
    let user = await prisma.user.findUnique({
      where: { email },
      include: { provider: { include: { category: true } } },
    });

    if (!user) {
      // New user — create with Google profile info pre-filled
      user = await prisma.user.create({
        data: {
          email,
          name: name ?? null,
          avatar: picture ?? null,
          // No phone or password for Google users
        },
        include: { provider: { include: { category: true } } },
      });
    } else {
      // Existing user — update avatar/name from Google if they were empty
      const needsUpdate =
        (!user.avatar && picture) || (!user.name && name);

      if (needsUpdate) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            ...((!user.avatar && picture) ? { avatar: picture } : {}),
            ...((!user.name && name) ? { name } : {}),
          },
          include: { provider: { include: { category: true } } },
        });
      }
    }

    const token = await signToken({ userId: user.id, role: user.role });
    return NextResponse.json({ token, user });
  } catch (err) {
    console.error("Google auth error:", err);
    return NextResponse.json({ error: "Google authentication failed" }, { status: 401 });
  }
}

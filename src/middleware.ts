import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/hire",
  "/provider",
];

const PUBLIC_API = [
  "/api/auth",
  "/api/categories",
  "/api/providers",
];

export async function middleware(req: NextRequest) {
  const { pathname, hostname } = req.nextUrl;



  if (PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  if (PUBLIC_API.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token =
    req.cookies.get("auth_token")?.value ||
    req.headers.get("authorization")?.replace("Bearer ", "");

  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const { verifyToken } = await import("@/lib/jwt");
    const payload = await verifyToken(token);

    if (!payload) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized: Invalid Token" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Enforce admin role for /admin routes (defense-in-depth)
    if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
      if (payload.role !== "ADMIN") {
        if (pathname.startsWith("/api/")) {
          return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
        }
        return NextResponse.redirect(new URL("/hire", req.url));
      }
    }

    // Add userId header for downstream usage
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-user-id", payload.userId as string);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized: Invalid Token" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

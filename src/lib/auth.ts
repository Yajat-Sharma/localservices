import { signToken, verifyToken } from "./jwt";
import { prisma } from "./prisma";

export { signToken, verifyToken };

// ── Simple in-memory user cache ─────────────────────────────────────────────
// Assumption: single-process deployment (Docker / VPS / PM2 cluster-mode=1).
// On Vercel serverless, each invocation gets a fresh process, so this cache
// has zero TTL benefit there — swap for unstable_cache or Redis if you migrate.
const USER_CACHE_TTL_MS = 30_000; // 30 seconds
const userCache = new Map<string, { user: Awaited<ReturnType<typeof fetchUser>>; expires: number }>();

async function fetchUser(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: { provider: { include: { category: true } } },
  });
}

export function getTokenFromRequest(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) return authHeader.slice(7);
  const cookieHeader = request.headers.get("cookie");
  if (cookieHeader) { const match = cookieHeader.match(/auth_token=([^;]+)/); if (match) return match[1]; }
  return null;
}
export async function getUserFromRequest(request: Request) {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload || !payload.userId) return null;
  const userId = payload.userId as string;

  // Check cache first
  const cached = userCache.get(token);
  if (cached && cached.expires > Date.now()) return cached.user;

  // Cache miss — fetch from DB and store
  const user = await fetchUser(userId);
  userCache.set(token, { user, expires: Date.now() + USER_CACHE_TTL_MS });
  return user;
}

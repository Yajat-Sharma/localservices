import { signToken, verifyToken } from "./jwt";
import { prisma } from "./prisma";

export { signToken, verifyToken };
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
  return prisma.user.findUnique({ where: { id: payload.userId as string }, include: { provider: { include: { category: true } } } });
}

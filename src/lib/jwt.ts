import { SignJWT, jwtVerify } from "jose";

// Always require JWT_SECRET in production. Using a fallback only for development safety.
const secretKey = process.env.JWT_SECRET || "fallback_secret_32_chars_minimum!!";
const SECRET = new TextEncoder().encode(secretKey);

export async function signToken(payload: Record<string, unknown>) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(SECRET);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload;
  } catch {
    return null;
  }
}

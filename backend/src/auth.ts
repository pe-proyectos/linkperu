import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-production";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

interface JWTPayload {
  userId: string;
  email: string;
  exp: number;
}

export function signToken(payload: { userId: string; email: string }): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = btoa(JSON.stringify({ ...payload, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 }));
  const signature = new Bun.CryptoHasher("sha256").update(`${header}.${body}.${JWT_SECRET}`).digest("hex");
  return `${header}.${body}.${signature}`;
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const [header, body, signature] = token.split(".");
    const expected = new Bun.CryptoHasher("sha256").update(`${header}.${body}.${JWT_SECRET}`).digest("hex");
    if (signature !== expected) return null;
    const payload = JSON.parse(atob(body)) as JWTPayload;
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getUser(authorization: string | undefined) {
  if (!authorization?.startsWith("Bearer ")) return null;
  return verifyToken(authorization.slice(7));
}

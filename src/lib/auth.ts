import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { sql } from "./db";
import { HttpError } from "./errors";
export type User = {
  id: string;
  name: string;
  email: string;
  role: "MEMBER" | "TRAINER";
};
function key() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32)
    throw new Error("SESSION_SECRET must have 32+ characters");
  return new TextEncoder().encode(s);
}
export async function session(user: User) {
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuer("pulsefit")
    .setAudience("pulsefit")
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(key());
  (await cookies()).set("pulsefit", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 28800,
  });
}
export async function currentUser(): Promise<User | null> {
  const token = (await cookies()).get("pulsefit")?.value;
  if (!token) return null;
  let id: string | undefined;
  try {
    id = (
      await jwtVerify(token, key(), {
        issuer: "pulsefit",
        audience: "pulsefit",
        algorithms: ["HS256"],
      })
    ).payload.sub;
  } catch {
    return null;
  }
  if (!id) return null;
  return (
    (
      await sql().query("SELECT id,name,email,role FROM users WHERE id=$1", [
        id,
      ])
    ).rows[0] || null
  );
}
export async function requireUser(role?: User["role"]) {
  const u = await currentUser();
  if (!u) throw new HttpError(401, "Please sign in");
  if (role && u.role !== role)
    throw new HttpError(403, "This action is not permitted for your role");
  return u;
}
export function guardOrigin(req: Request) {
  const expected = process.env.APP_ORIGIN || "http://localhost:3000";
  if (req.headers.get("origin") !== expected)
    throw new HttpError(403, "Invalid request origin");
}

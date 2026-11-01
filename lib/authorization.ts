import { NextResponse } from "next/server";
import { currentSession, type Session } from "@/lib/auth";

export async function requireSession(allowed?: Session["role"][]) {
  const session = await currentSession();
  if (!session) return { error: NextResponse.json({ error: "Authentication required" }, { status: 401 }) };
  if (allowed && !allowed.includes(session.role)) return { error: NextResponse.json({ error: "Insufficient role" }, { status: 403 }) };
  return { session };
}

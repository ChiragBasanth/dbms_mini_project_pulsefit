import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/session-core";
export async function POST() { return NextResponse.json({ ok: true }, { headers: { "Set-Cookie": `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${process.env.NODE_ENV === "production" ? "; Secure" : ""}` } }); }

import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifyEdgeSession } from "@/lib/edge-auth";
import { canAccessPath } from "@/lib/access-policy";
export async function middleware(request: NextRequest) { const path = request.nextUrl.pathname; const session = await verifyEdgeSession(request.cookies.get(SESSION_COOKIE)?.value); if (!session) return NextResponse.redirect(new URL("/login", request.url)); if (!canAccessPath(path, session.role)) return NextResponse.redirect(new URL("/dashboard", request.url)); return NextResponse.next(); }
export const config = { matcher: ["/dashboard/:path*", "/trainer/:path*", "/bookings/:path*", "/workouts/:path*", "/analytics/:path*", "/recommendations/:path*", "/profile/:path*"] };

import type { SessionRole } from "@/lib/session-core";
export function canAccessPath(pathname: string, role: SessionRole) {
  return !pathname.startsWith("/trainer") || role === "TRAINER";
}

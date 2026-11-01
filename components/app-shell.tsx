"use client";

import Link from "next/link";
import { Activity, BarChart3, CalendarDays, Dumbbell, Search, Settings, Sparkles, UserRound } from "lucide-react";
import { usePathname } from "next/navigation";

const memberLinks = [
  ["Dashboard", "/dashboard", Activity], ["Discover trainers", "/trainers", Search], ["My bookings", "/booking-history", CalendarDays],
  ["Log a workout", "/workouts", Dumbbell], ["Analytics", "/analytics", BarChart3], ["Recommendations", "/recommendations", Sparkles], ["Profile", "/profile", UserRound]
] as const;

export function AppShell({ children, role = "MEMBER" }: { children: React.ReactNode; role?: "MEMBER" | "TRAINER" }) {
  const pathname = usePathname();
  const links = role === "TRAINER" ? [["Trainer dashboard", "/trainer", Activity], ["My availability", "/trainer/availability", CalendarDays], ["Bookings", "/trainer/bookings", UserRound], ["Profile", "/trainer/profile", Settings]] as const : memberLinks;
  return <div className="app-shell"><aside className="sidebar"><Link className="brand" href="/"><span className="brand-mark"><Activity size={18}/></span>PULSE<span className="brand-light">FIT</span></Link><span className="workspace-label">{role === "TRAINER" ? "TRAINER SPACE" : "MEMBER SPACE"}</span><nav>{links.map(([label, href, Icon]) => <Link className={pathname === href ? "nav-item active" : "nav-item"} href={href} key={href}><Icon size={17}/>{label}</Link>)}</nav><div className="sidebar-bottom"><Link href="/login" className="nav-item"><Settings size={17}/>Account</Link></div></aside><section className="app-content">{children}</section></div>;
}

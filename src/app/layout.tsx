import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
export const metadata: Metadata = {
  title: "PulseFit | Train with purpose",
  description:
    "Smart trainer reservations, flexible workout tracking and goal-based discovery.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="topbar">
          <Link href="/" className="brand">
            <span className="brand-icon">P</span>PulseFit
            <span className="brand-dot">.</span>
          </Link>
          <nav>
            <Link href="/trainers">Find a trainer</Link>
            <Link href="/dashboard">Your space</Link>
            <Link className="button small" href="/login">
              Sign in ↗
            </Link>
          </nav>
        </header>
        {children}
        <footer>
          <Link href="/" className="brand">
            PulseFit.
          </Link>
          <p>One place for a stronger routine.</p>
          <span>DBMS Level 3 · PostgreSQL + MongoDB + pgvector</span>
        </footer>
      </body>
    </html>
  );
}

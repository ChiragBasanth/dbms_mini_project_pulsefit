import type { Metadata } from "next"; import "./globals.css";
export const metadata:Metadata={title:"PulseFit — Build strength. Find your rhythm.",description:"Your training, in sync. Book a coach, track workouts, and see your progress."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}

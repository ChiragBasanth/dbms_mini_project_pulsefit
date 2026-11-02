import { notFound } from "next/navigation";
import Portal from "@/components/Portal";
const views = [
  "dashboard",
  "trainers",
  "bookings",
  "workouts",
  "analytics",
  "recommendations",
  "availability",
  "appointments",
  "login",
  "register",
];
export default async function Page({
  params,
}: {
  params: Promise<{ view: string }>;
}) {
  const { view } = await params;
  if (!views.includes(view)) notFound();
  return <Portal view={view} />;
}

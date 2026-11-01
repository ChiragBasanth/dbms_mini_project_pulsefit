import Portal from "@/components/Portal";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <Portal view="trainers" trainerId={id} />;
}

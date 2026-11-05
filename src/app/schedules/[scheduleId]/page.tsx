import { ScheduleDetailScreen } from "@/features/schedule/components/detail/ScheduleDetailScreen";

export default async function ScheduleDetailPage({
  params,
}: PageProps<"/schedules/[scheduleId]">) {
  const { scheduleId } = await params;
  return <ScheduleDetailScreen scheduleIdParam={scheduleId} />;
}

import { ActivityLogsPage } from '@/components/activity/ActivityLogsPage';

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const admin = Array.isArray(params.admin) ? params.admin[0] : params.admin;

  return <ActivityLogsPage initialAdmin={admin ?? 'All'} />;
}

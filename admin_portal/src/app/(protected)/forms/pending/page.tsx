import { PendingApprovalsPage } from '@/components/forms/PendingApprovalsPage';

export default async function PendingApprovalsRoute({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const verifier = Array.isArray(params.verifier) ? params.verifier[0] : params.verifier;

  return <PendingApprovalsPage initialVerifier={verifier ?? 'All'} />;
}

'use client';

export const dynamic = 'force-dynamic';   // 👈 ADD THIS LINE

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
function AdminAllSubmissionsRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const query = searchParams.toString();
    router.replace(query ? `/forms/all?${query}` : '/forms/all');
  }, [router, searchParams]);

  return null;
}
import { Suspense } from 'react';
export default function AdminAllSubmissionsRedirectPage() {
  return <Suspense fallback={null}><AdminAllSubmissionsRedirectContent /></Suspense>;
}
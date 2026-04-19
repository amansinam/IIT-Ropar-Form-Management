'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';

export function useRequireAuth(redirectTo = '/login') {
  const { authStatus } = useApp();
  const router = useRouter();

  useEffect(() => {
    // Wait for session to resolve before deciding
    if (authStatus === 'unauthenticated') {
      router.replace(redirectTo);
    }
  }, [authStatus, router, redirectTo]);

  return { isLoading: authStatus === 'loading' };
}
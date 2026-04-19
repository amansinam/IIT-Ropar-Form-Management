'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp }    from '@/lib/app-context';
import { VERIFIER_ROLES, VerifierRole } from '@/lib/auth.service';

export function useRequireAuth(redirectTo = '/login') {
  const { authStatus, currentUser } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (authStatus === 'loading') return;

    // Not logged in at all
    if (authStatus === 'unauthenticated' || !currentUser) {
      router.replace(redirectTo);
      return;
    }

    // Logged in but wrong portal or blocked role
    if (
      currentUser.portal !== 'verifier' ||
      !VERIFIER_ROLES.includes(currentUser.role as VerifierRole)
    ) {
      router.replace(redirectTo);
    }
  }, [authStatus, currentUser, router, redirectTo]);

  return {
    isLoading:   authStatus === 'loading' || !currentUser,
    currentUser,
  };
}
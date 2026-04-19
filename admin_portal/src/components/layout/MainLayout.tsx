'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { TopNavbar } from './TopNavbar';
import { useApp } from '@/context/AppContext';
import styles from '@/styles/MainLayout.module.css';

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn) {
      router.replace('/login');
    }
  }, [isLoggedIn, router]);

  if (!isLoggedIn) return null;

  return (
    <div className={`${styles.layoutWrapper} flex h-screen overflow-hidden`}>
      <Sidebar />
      <div className={`${styles.mainContainer} flex-1 flex flex-col min-w-0 overflow-hidden`}>
        <TopNavbar />
        <main className={`${styles.mainContent} flex-1 overflow-y-auto`}>
          {children}
        </main>
      </div>
    </div>
  );
}

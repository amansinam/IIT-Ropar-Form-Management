'use client';
import { useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Navbar from '@/components/layout/Navbar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div className={`main-content ${collapsed ? 'sidebar-collapsed' : ''} flex flex-col min-h-screen`}>
        <Navbar />
        <main className="flex-1 p-6 page-enter">
          {children}
        </main>
      </div>
    </div>
  );
}

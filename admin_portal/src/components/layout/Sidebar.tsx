'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import {
  LayoutDashboard, FileText, FilePlus, List, Clock,
  CheckSquare, Users, UserPlus, UserCheck, Activity,
  Settings, LogOut, ChevronDown, ChevronRight, X,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import styles from '@/styles/Sidebar.module.css';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  to?: string;
  children?: { label: string; to: string; icon: React.ReactNode }[];
  collapsed: boolean;
}

function NavItem({ icon, label, to, children, collapsed }: NavItemProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  if (children) {
    return (
      <div className={styles.navGroup}>
        <button
          onClick={() => setOpen(!open)}
          className={`${styles.navButton} ${collapsed ? styles.collapsed : ''}`}
          title={collapsed ? label : undefined}
        >
          <div className={styles.navLeft}>
            <span className={styles.navIcon}>{icon}</span>
            {!collapsed && <span className={styles.navLabel}>{label}</span>}
          </div>
          {!collapsed && (
            <span className={styles.chevron}>
              {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </span>
          )}
        </button>

        {open && !collapsed && (
          <div className={styles.submenu}>
            {children.map((child) => (
              <Link
                key={child.to}
                href={child.to}
                className={`${styles.subItem} ${pathname === child.to ? styles.subActive : ''}`}
              >
                <span className={styles.subIcon}>{child.icon}</span>
                {child.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  const isActive = pathname === to;

  return (
    <Link
      href={to!}
      className={`${styles.navLink} ${collapsed ? styles.collapsed : ''} ${isActive ? styles.activeLink : ''}`}
      title={collapsed ? label : undefined}
    >
      <span className={styles.navIcon}>{icon}</span>
      {!collapsed && <span className={styles.navLabel}>{label}</span>}
    </Link>
  );
}

export function Sidebar() {
  const { sidebarCollapsed, setSidebarCollapsed, logout, currentUser } = useApp();

  return (
    <aside className={`${styles.sidebar} ${sidebarCollapsed ? styles.collapsedSidebar : ''}`}>
      {/* Header */}
      <div className={`${styles.header} ${sidebarCollapsed ? styles.headerCollapsed : ''}`}>
        <div className={styles.logoWrapper}>
          <Image src="/logo.png" alt="IIT Ropar" width={40} height={40} />
        </div>

        {!sidebarCollapsed && (
          <div className={styles.logoText}>
            <p className={styles.title}>IIT Ropar</p>
            <p className={styles.subtitle}>Form Portal Admin</p>
          </div>
        )}

        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className={styles.collapseBtn}
        >
          {sidebarCollapsed ? <ChevronRight size={16} /> : <X size={16} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className={styles.nav}>
        <NavItem icon={<LayoutDashboard size={18} />} label="Dashboard" to="/dashboard" collapsed={sidebarCollapsed} />

        <NavItem
          icon={<FileText size={18} />}
          label="Forms Management"
          collapsed={sidebarCollapsed}
          children={[
            { label: 'Create Form',         to: '/forms/create',    icon: <FilePlus size={14} /> },
            { label: 'Available Forms',     to: '/forms/available', icon: <List size={14} /> },
            { label: 'Pending Approvals',   to: '/forms/pending',   icon: <Clock size={14} /> },
            { label: 'All Submitted Forms', to: '/forms/all',       icon: <CheckSquare size={14} /> },
          ]}
        />

        <NavItem icon={<Users size={18} />}    label="Users Directory"    to="/users"    collapsed={sidebarCollapsed} />

        <NavItem
          icon={<UserCheck size={18} />}
          label="Members Management"
          collapsed={sidebarCollapsed}
          children={[
            { label: 'Add Member',  to: '/members/add', icon: <UserPlus size={14} /> },
            { label: 'All Members', to: '/members/all', icon: <UserCheck size={14} /> },
          ]}
        />

        <NavItem icon={<Activity size={18} />} label="Activity Logs" to="/activity" collapsed={sidebarCollapsed} />
        <NavItem icon={<Settings size={18} />} label="Settings"      to="/settings" collapsed={sidebarCollapsed} />
      </nav>

      {/* Footer — user info + logout */}
      <div className={styles.footer}>

        {/* Logout — calls NextAuth signOut via context */}
        <button
          onClick={logout}
          className={`${styles.logoutBtn} ${sidebarCollapsed ? styles.collapsed : ''}`}
        >
          <LogOut size={18} />
          {!sidebarCollapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
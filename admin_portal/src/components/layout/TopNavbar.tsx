'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bell,
  Sun,
  Moon,
  ChevronRight,
  Menu,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { getFormById, getMemberById, getSubmissionById } from '@/data/mockData';
import styles from '@/styles/TopNavbar.module.css';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

function getBreadcrumbs(pathname: string): BreadcrumbItem[] {
  if (pathname === '/dashboard') {
    return [{ label: 'Dashboard' }];
  }

  if (pathname === '/users') {
    return [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Users Directory' }];
  }

  if (pathname === '/activity') {
    return [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Activity Logs' }];
  }

  if (pathname === '/settings') {
    return [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Settings' }];
  }

  if (pathname === '/members/add') {
    return [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Members Management', href: '/members/all' }, { label: 'Add Member' }];
  }

  if (pathname === '/members/all') {
    return [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Members Management' }, { label: 'All Members' }];
  }

  const memberMatch = pathname.match(/^\/members\/all\/([^/]+)$/);
  if (memberMatch) {
    const member = getMemberById(memberMatch[1]);
    return [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Members Management', href: '/members/all' },
      { label: 'All Members', href: '/members/all' },
      { label: member?.name ?? 'Member Dashboard' },
    ];
  }

  const memberEditMatch = pathname.match(/^\/members\/all\/([^/]+)\/edit$/);
  if (memberEditMatch) {
    const member = getMemberById(memberEditMatch[1]);
    return [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Members Management', href: '/members/all' },
      { label: 'All Members', href: '/members/all' },
      { label: member?.name ?? 'Member', href: `/members/all/${memberEditMatch[1]}` },
      { label: 'Edit Member' },
    ];
  }

  if (pathname === '/forms/create') {
    return [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Forms Management', href: '/forms/available' }, { label: 'Create Form' }];
  }

  if (pathname === '/forms/available') {
    return [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Forms Management' }, { label: 'Available Forms' }];
  }

  if (pathname === '/forms/pending') {
    return [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Forms Management', href: '/forms/available' }, { label: 'Pending Approvals' }];
  }

  if (pathname === '/forms/all') {
    return [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Forms Management', href: '/forms/available' }, { label: 'All Submitted Forms' }];
  }

  const availableMatch = pathname.match(/^\/forms\/available\/([^/]+)$/);
  if (availableMatch) {
    const form = getFormById(availableMatch[1]);
    return [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Forms Management', href: '/forms/available' },
      { label: 'Available Forms', href: '/forms/available' },
      { label: form?.name ?? 'Form Dashboard' },
    ];
  }

  const editMatch = pathname.match(/^\/forms\/available\/([^/]+)\/edit$/);
  if (editMatch) {
    const form = getFormById(editMatch[1]);
    return [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Forms Management', href: '/forms/available' },
      { label: 'Available Forms', href: '/forms/available' },
      { label: form?.name ?? 'Form', href: `/forms/available/${editMatch[1]}` },
      { label: 'Edit Form' },
    ];
  }

  const submissionMatch = pathname.match(/^\/forms\/all\/([^/]+)$/);
  if (submissionMatch) {
    const submission = getSubmissionById(submissionMatch[1]);
    return [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Forms Management', href: '/forms/available' },
      { label: 'All Submitted Forms', href: '/forms/all' },
      { label: submission?.user ?? 'Submission Details' },
    ];
  }

  return [{ label: 'Dashboard' }];
}

export function TopNavbar() {
  const { darkMode, toggleDarkMode, currentUser, notifications, sidebarCollapsed, setSidebarCollapsed } = useApp();
  const pathname = usePathname();
  const [showNotifications, setShowNotifications] = useState(false);
  

  const breadcrumbs = getBreadcrumbs(pathname);

  const notificationItems = [
    { id: 1, text: 'New hostel leave application submitted', time: '5 min ago', unread: true },
    { id: 2, text: "Arjun Sharma's form approved by HOD", time: '1 hour ago', unread: true },
    { id: 3, text: 'Bulk rejection processed for 3 forms', time: '2 hours ago', unread: true },
    { id: 4, text: 'New member Dr. Kavita Rao added', time: 'Yesterday', unread: false },
    { id: 5, text: 'System maintenance scheduled for Sunday', time: '2 days ago', unread: false },
  ];

  return (
    <header className={styles.navbar}>
      <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className={styles.mobileToggle}>
        <Menu size={20} />
      </button>

      <div className={styles.breadcrumbs}>
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={`${crumb.label}-${index}`}>
            {index > 0 && <ChevronRight size={14} className={styles.breadcrumbIcon} />}
            {crumb.href ? (
              <Link href={crumb.href} className={styles.breadcrumbLink}>
                {crumb.label}
              </Link>
            ) : (
              <span className={index === breadcrumbs.length - 1 ? styles.breadcrumbActive : styles.breadcrumbItem}>
                {crumb.label}
              </span>
            )}
          </React.Fragment>
        ))}
      </div>

 

      <div className={styles.notificationWrapper}>
        <button onClick={() => setShowNotifications(!showNotifications)} className={styles.iconButton}>
          <Bell size={20} />
          {notifications > 0 && <span className={styles.notificationBadge}>{notifications}</span>}
        </button>

        {showNotifications && (
          <>
            <div className={styles.overlay} onClick={() => setShowNotifications(false)} />
            <div className={styles.notificationDropdown}>
              <div className={styles.notificationHeader}>
                <h3>Notifications</h3>
                <button className={styles.markRead}>Mark all read</button>
              </div>
              <div className={styles.notificationList}>
                {notificationItems.map((notification) => (
                  <div
                    key={notification.id}
                    className={`${styles.notificationItem} ${notification.unread ? styles.unread : ''}`}
                  >
                    <div className={styles.notificationContent}>
                      {notification.unread && <span className={styles.dot} />}
                      <div>
                        <p className={styles.notificationText}>{notification.text}</p>
                        <p className={styles.notificationTime}>{notification.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <button onClick={toggleDarkMode} className={styles.iconButton}>
        {darkMode ? <Sun size={20} className={styles.sunIcon} /> : <Moon size={20} />}
      </button>

      <Link href="/settings" className={styles.profile}>
        <div className={styles.avatar}>{currentUser?.initials}</div>
        <div className={styles.profileText}>
          <p className={styles.name}>{currentUser?.name}</p>
          <p className={styles.email}>{currentUser?.email}</p>
        </div>
      </Link>
    </header>
  );
}

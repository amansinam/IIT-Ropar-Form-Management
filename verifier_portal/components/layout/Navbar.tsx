'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Bell, Sun, Moon, Search, ChevronRight, User, LogOut } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { useApp } from '@/lib/app-context';

const breadcrumbMap: Record<string, string> = {
  '/dashboard':        'Dashboard',
  '/assigned-forms':   'All Assigned Forms',
  '/pending-approvals':'Pending Approvals',
  '/all-submissions':  'All Submissions',
  '/activity':         'Activity',
  '/profile':          'Profile',
  '/form-details':     'Form Details',
};

function getBreadcrumbs(path: string) {
  const parts = path.split('/').filter(Boolean);
  const crumbs: { label: string; href: string }[] = [{ label: 'Dashboard', href: '/dashboard' }];
  let current = '';
  for (const part of parts) {
    current += '/' + part;
    const label = breadcrumbMap[current] || part.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    if (current !== '/dashboard') crumbs.push({ label, href: current });
  }
  return crumbs;
}

export default function Navbar() {
  const { theme, toggle }               = useTheme();
  const { currentUser, logout }         = useApp();
  const pathname                        = usePathname();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotif,    setShowNotif]    = useState(false);

  const crumbs    = getBreadcrumbs(pathname);
  const pageTitle = crumbs[crumbs.length - 1]?.label || 'Dashboard';

  // Derive display values from currentUser
  const displayName    = currentUser?.name     ?? 'Verifier';
  const displayEmail   = currentUser?.email    ?? '';
  const displayRole    = currentUser?.role     ?? '';
  const displayInitials = currentUser?.initials
    ?? displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <header
      className="sticky top-0 z-30 flex items-center gap-4 px-6 border-b"
      style={{ background: 'var(--card)', borderColor: 'var(--border)', height: 64 }}
    >
      {/* ── Left: Breadcrumbs ─────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        {crumbs.map((c, i) => (
          <span key={c.href} className="flex items-center gap-1.5">
            {i > 0 && (
              <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
            )}
            {i === crumbs.length - 1 ? (
              <span
                className="text-sm font-medium truncate"
                style={{ color: 'var(--text)', cursor: 'default' }}
                aria-current="page"
              >
                {c.label}
              </span>
            ) : (
              <Link
                href={c.href}
                className="text-sm font-medium transition-colors hover:underline truncate"
                style={{ color: 'var(--text-muted)' }}
              >
                {c.label}
              </Link>
            )}
          </span>
        ))}
      </div>

      {/* ── Center: Page title ────────────────────────────────────── */}
      <h1
        className="hidden md:block text-base font-bold absolute left-1/2 -translate-x-1/2"
        style={{ color: 'var(--text)' }}
      >
        {pageTitle}
      </h1>

      {/* ── Right ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2">

        {/* Search */}
        {/* <button className="icon-btn" title="Search">
          <Search className="w-4 h-4" />
        </button> */}

        {/* Notifications */}
        <div className="relative">
          <button
            className="icon-btn relative"
            onClick={() => { setShowNotif(!showNotif); setShowUserMenu(false); }}
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="notif-dot" />
          </button>

          {showNotif && (
            <div
              className="absolute right-0 top-12 w-80 rounded-2xl shadow-card-hover z-50 overflow-hidden animate-scale-in"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
            >
              <div
                className="px-4 py-3 border-b flex items-center justify-between"
                style={{ borderColor: 'var(--border)' }}
              >
                <span className="font-semibold text-sm" style={{ color: 'var(--text)' }}>Notifications</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: '#EFF6FF', color: '#1D4ED8' }}>3 New</span>
              </div>
              {[
                { msg: 'New submission: No Dues Certificate',          time: '2m ago', color: '#3B82F6' },
                { msg: 'Arjun Verma resubmitted Leave Application',    time: '1h ago', color: '#22C55E' },
                { msg: 'Deadline tomorrow: Scholarship Form',          time: '2h ago', color: '#F59E0B' },
              ].map((n, i) => (
                <div
                  key={i}
                  className="px-4 py-3 border-b flex gap-3 items-start hover:bg-blue-50/5 cursor-pointer transition-colors"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: n.color }} />
                  <div>
                    <p className="text-sm" style={{ color: 'var(--text)' }}>{n.msg}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{n.time}</p>
                  </div>
                </div>
              ))}
              <div className="px-4 py-3 text-center">
                <button className="text-sm font-medium"
                  style={{ color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer' }}>
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Theme toggle */}
        <button onClick={toggle} className="icon-btn" title="Toggle theme">
          {theme === 'dark'
            ? <Sun  className="w-4 h-4 text-yellow-400" />
            : <Moon className="w-4 h-4" />}
        </button>

        {/* User menu */}
        <div className="relative ml-1">
          <button
            onClick={() => { setShowUserMenu(!showUserMenu); setShowNotif(false); }}
            className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer"
            style={{ background: showUserMenu ? 'var(--bg)' : 'transparent', border: 'none' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg)')}
            onMouseLeave={e => { if (!showUserMenu) e.currentTarget.style.background = 'transparent'; }}
          >
            {/* Avatar */}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #1E3A8A, #3B82F6)' }}
            >
              {displayInitials}
            </div>
          </button>

          {showUserMenu && (
            <div
              className="absolute right-0 top-12 w-56 rounded-xl shadow-card-hover z-50 overflow-hidden animate-scale-in"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
            >
              {/* User info */}
              <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>
                  {displayName}
                </p>
                <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                  {displayEmail}
                </p>
                {/* Role badge */}
                <span
                  className="inline-block mt-1.5 text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: '#EFF6FF', color: '#1D4ED8' }}
                >
                  {displayRole}
                </span>
              </div>

              {/* Profile */}
              <Link
                href="/profile"
                onClick={() => setShowUserMenu(false)}
                className="flex items-center gap-2.5 px-4 py-3 text-sm font-medium transition-colors hover:bg-blue-50/10"
                style={{ color: 'var(--text)', textDecoration: 'none' }}
              >
                <User className="w-4 h-4" /> Profile
              </Link>

              {/* Logout — calls AuthService.logout() via context */}
              <button
                onClick={() => { setShowUserMenu(false); logout(); }}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium transition-colors hover:bg-red-50/10 text-red-400"
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Click-outside backdrop */}
      {(showUserMenu || showNotif) && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => { setShowUserMenu(false); setShowNotif(false); }}
        />
      )}
    </header>
  );
}

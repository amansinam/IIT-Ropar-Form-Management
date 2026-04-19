'use client';

// ─────────────────────────────────────────────────────────────────────────────
// IIT Ropar — Unified Landing Page
// Runs on port 3004.  Each portal card redirects to the portal's own /login.
// ─────────────────────────────────────────────────────────────────────────────

const USER_PORTAL_URL     = process.env.NEXT_PUBLIC_USER_PORTAL_URL     || 'http://localhost:3000';
const ADMIN_PORTAL_URL    = process.env.NEXT_PUBLIC_ADMIN_PORTAL_URL    || 'http://localhost:3002';
const VERIFIER_PORTAL_URL = process.env.NEXT_PUBLIC_VERIFIER_PORTAL_URL || 'http://localhost:3003';

// ── Portal config ─────────────────────────────────────────────────────────────
const portals = [
  {
    key: 'user',
    title: 'Student Portal',
    subtitle: 'For Students & Faculty',
    description:
      'Submit institutional forms, track approval status in real time, and manage your form history — all in one place.',
    href: `${USER_PORTAL_URL}/login`,
    cardClass: 'portal-card-user',
    iconBg: 'bg-blue-500/20',
    iconBorder: 'border-blue-400/30',
    iconColor: 'text-blue-300',
    badgeBg: 'bg-blue-500/15',
    badgeText: 'text-blue-300',
    badgeBorder: 'border-blue-400/20',
    btnBg: 'bg-blue-500 hover:bg-blue-400',
    btnShadow: 'shadow-blue-500/30',
    features: ['Submit & track forms', 'Real-time status updates', 'Resubmit rejected forms'],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422A12.083 12.083 0 0121 13.5c0 4.142-4.03 7.5-9 7.5S3 17.642 3 13.5c0-1.003.204-1.96.574-2.844L12 14z" />
      </svg>
    ),
  },
  {
    key: 'verifier',
    title: 'Verifier Portal',
    subtitle: 'For HOD, Dean & Caretaker',
    description:
      'Review and approve form submissions assigned to your role. Manage your verification queue with full audit trails.',
    href: `${VERIFIER_PORTAL_URL}/login`,
    cardClass: 'portal-card-verifier',
    iconBg: 'bg-violet-500/20',
    iconBorder: 'border-violet-400/30',
    iconColor: 'text-violet-300',
    badgeBg: 'bg-violet-500/15',
    badgeText: 'text-violet-300',
    badgeBorder: 'border-violet-400/20',
    btnBg: 'bg-violet-500 hover:bg-violet-400',
    btnShadow: 'shadow-violet-500/30',
    features: ['Pending approval queue', 'Approve / reject forms', 'Activity & audit logs'],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
  {
    key: 'admin',
    title: 'Admin Portal',
    subtitle: 'For System Administrators',
    description:
      'Build dynamic forms, manage verifier members, monitor all submissions, and control system-wide settings.',
    href: `${ADMIN_PORTAL_URL}/login`,
    cardClass: 'portal-card-admin',
    iconBg: 'bg-emerald-500/20',
    iconBorder: 'border-emerald-400/30',
    iconColor: 'text-emerald-300',
    badgeBg: 'bg-emerald-500/15',
    badgeText: 'text-emerald-300',
    badgeBorder: 'border-emerald-400/20',
    btnBg: 'bg-emerald-500 hover:bg-emerald-400',
    btnShadow: 'shadow-emerald-500/30',
    features: ['Dynamic form builder', 'Manage verifier members', 'All submissions dashboard'],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

// ── Small check icon ──────────────────────────────────────────────────────────
function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5 flex-shrink-0 mt-0.5">
      <circle cx="8" cy="8" r="7" fill="currentColor" fillOpacity={0.15} />
      <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Arrow icon ────────────────────────────────────────────────────────────────
function ArrowRight() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1">
      <path d="M4 10h12M11 5l5 5-5 5" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Stat row for the header ───────────────────────────────────────────────────
function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center px-6 py-3">
      <p className="text-white font-heading font-bold text-2xl">{value}</p>
      <p className="text-blue-300 text-xs mt-0.5">{label}</p>
    </div>
  );
}

// ── Decorative animated circles ───────────────────────────────────────────────
function BgDecor() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden>
      {/* Large blurred blobs */}
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-[120px]" />
      <div className="absolute top-1/2 right-0 w-[500px] h-[500px] rounded-full bg-violet-600/10 blur-[100px]" />
      <div className="absolute -bottom-40 left-1/3 w-[400px] h-[400px] rounded-full bg-emerald-600/8 blur-[80px]" />
      {/* Dot grid overlay */}
      <div className="absolute inset-0 dot-grid opacity-30" />
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Main page component
// ═════════════════════════════════════════════════════════════════════════════
export default function LandingPage() {
  return (
    <main className="gradient-bg min-h-screen relative overflow-x-hidden">
      <BgDecor />

      {/* ── Top navbar ── */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-5">
        <div className="flex items-center gap-3">
          {/* IIT monogram badge */}
          <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
            <span className="text-white font-heading font-bold text-sm">IIT</span>
          </div>
          <div>
            <p className="text-white font-heading font-semibold text-sm leading-tight">
              IIT Ropar
            </p>
            <p className="text-blue-300 text-[11px]">Form Management System</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-blue-300 text-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          All portals online
        </div>
      </nav>

      {/* ── Hero section ── */}
      <section className="relative z-10 text-center px-6 pt-12 pb-6">
        {/* Tagline badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-card text-blue-200 text-xs font-medium mb-7
                        opacity-0 animate-fade-in delay-100">
          <svg viewBox="0 0 16 16" fill="none" className="w-3 h-3">
            <path d="M8 1l1.88 3.81L14 5.82l-3 2.92.71 4.14L8 10.77l-3.71 1.95L5 8.74 2 5.82l4.12-.99L8 1z"
              fill="currentColor" />
          </svg>
          Indian Institute of Technology Ropar
        </div>

        <h1 className="text-white font-heading font-bold text-4xl md:text-5xl lg:text-6xl leading-tight mb-5
                       opacity-0 animate-fade-in-up delay-200">
          Centralized Forms
          <br />
          <span className="bg-gradient-to-r from-blue-300 via-violet-300 to-emerald-300 bg-clip-text text-transparent">
            Management Portal
          </span>
        </h1>

        <p className="text-blue-200/80 text-base md:text-lg max-w-xl mx-auto leading-relaxed
                      opacity-0 animate-fade-in-up delay-300">
          One unified platform to submit, verify, and administer all institutional
          forms — built for the IIT Ropar community.
        </p>

        {/* Stats strip */}
        <div className="inline-flex items-center divide-x divide-white/10 glass-card rounded-2xl mt-10 mb-2
                        opacity-0 animate-fade-in delay-400">
          <Stat value="3" label="Portals" />
          <Stat value="Google" label="SSO Login" />
          <Stat value="Multi-role" label="Verification" />
        </div>
      </section>

      {/* ── Portal cards ── */}
      <section className="relative z-10 px-6 md:px-12 pb-10 pt-4 max-w-6xl mx-auto">
        <p className="text-center text-blue-300/60 text-sm mb-8 opacity-0 animate-fade-in delay-400">
          Select your portal below to sign in with your Google account
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {portals.map((p, idx) => (
            <a
              key={p.key}
              href={p.href}
              className={`portal-card glass-card rounded-2xl p-7 flex flex-col gap-5 no-underline
                          opacity-0 animate-fade-in-up
                          ${p.cardClass}
                          delay-${(idx + 3) * 100}`}
              style={{ animationDelay: `${0.3 + idx * 0.12}s` }}
            >
              {/* Icon + badge row */}
              <div className="flex items-start justify-between">
                <div className={`w-14 h-14 rounded-2xl ${p.iconBg} border ${p.iconBorder}
                                 ${p.iconColor} flex items-center justify-center`}>
                  {p.icon}
                </div>
                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full
                                  ${p.badgeBg} ${p.badgeText} border ${p.badgeBorder}`}>
                  {p.subtitle}
                </span>
              </div>

              {/* Title & description */}
              <div className="flex-1">
                <h2 className="text-white font-heading font-bold text-xl mb-2">
                  {p.title}
                </h2>
                <p className="text-blue-200/70 text-sm leading-relaxed">
                  {p.description}
                </p>
              </div>

              {/* Feature list */}
              <ul className="space-y-1.5">
                {p.features.map((f) => (
                  <li key={f} className={`flex items-start gap-2 text-xs ${p.badgeText}`}>
                    <CheckIcon />
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA button */}
              <button
                className={`group w-full mt-1 flex items-center justify-center gap-2
                             py-3 px-5 rounded-xl text-white font-semibold text-sm
                             ${p.btnBg} shadow-lg ${p.btnShadow}
                             transition-all duration-200`}
              >
                Sign in to {p.title}
                <ArrowRight />
              </button>
            </a>
          ))}
        </div>
      </section>

      {/* ── Info banner ── */}
      <section className="relative z-10 px-6 md:px-12 pb-8 max-w-6xl mx-auto">
        <div className="glass-card rounded-2xl px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-400/20
                           flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
              className="w-5 h-5 text-amber-300">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-amber-200 text-sm font-semibold mb-0.5">Access is role-based</p>
            <p className="text-blue-200/60 text-xs leading-relaxed">
              Use your institutional Google account to sign in. Access is automatically granted based on your
              registered role — Student, Verifier (HOD / Dean / Caretaker / Faculty), or Admin.
              Contact your system administrator if access is denied.
            </p>
          </div>
        </div>
      </section>

      {/* ── Auth flow explainer ── */}
      <section className="relative z-10 px-6 md:px-12 pb-10 max-w-6xl mx-auto">
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-white font-heading font-semibold text-sm mb-5 text-center">
            How sign-in works
          </h3>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-center">
            {[
              { step: '1', label: 'Choose Portal', desc: 'Select the portal matching your role' },
              { step: '2', label: 'Google OAuth', desc: 'Sign in with your institutional account' },
              { step: '3', label: 'Role verified', desc: 'System validates your registered role' },
              { step: '4', label: 'Dashboard', desc: 'Redirected to your personal dashboard' },
            ].map((s, i, arr) => (
              <div key={s.step} className="flex items-center gap-3">
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-400/30
                                   flex items-center justify-center text-blue-300 font-heading font-bold text-xs">
                    {s.step}
                  </div>
                  <p className="text-white text-xs font-semibold">{s.label}</p>
                  <p className="text-blue-300/60 text-[10px] max-w-[90px]">{s.desc}</p>
                </div>
                {i < arr.length - 1 && (
                  <div className="hidden sm:block text-blue-500/40 pb-8">
                    <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4">
                      <path d="M4 10h12M11 5l5 5-5 5" stroke="currentColor" strokeWidth={1.5}
                        strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 text-center pb-8 px-6">
        <p className="text-blue-400/50 text-xs">
          © {new Date().getFullYear()} Indian Institute of Technology Ropar. All rights reserved.
        </p>
        <p className="text-blue-500/30 text-[11px] mt-1 italic">
          धियो यो नः प्रचोदयात्
        </p>
      </footer>
    </main>
  );
}

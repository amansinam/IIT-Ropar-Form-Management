import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowUpRight,
  Building2,
  Calendar,
  Edit2,
  Mail,
  Phone,
  Shield,
  Workflow,
  BadgeCheck,
  BriefcaseBusiness,
} from 'lucide-react';
import styles from '@/styles/DashboardPage.module.css';

// ── Types ─────────────────────────────────────────────────────────────────────

type Role = 'Admin' | 'HOD' | 'Caretaker' | 'Dean' | 'Faculty';

interface Verifier {
  id: string;
  userName: string;
  email: string;
  role: Role;
  department: string;
  mobileNo: string;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: Verifier | null;
}

// ── Role badge CSS module class map ───────────────────────────────────────────

const roleBadgeColors: Record<Role, string> = {
  Caretaker: styles.statusPending,
  HOD:       styles.levelBadge,
  Dean:      styles.statusApproved,
  Faculty:   styles.statusDefault,
  Admin:     styles.statusRejected,
};

// ── Server-side data fetch ────────────────────────────────────────────────────

async function getVerifier(verifierId: string): Promise<Verifier | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';

    const res = await fetch(
      `${baseUrl}/api/admin/getVerifierMemberDetails/${verifierId}`,
      { cache: 'no-store' }
    );

    if (!res.ok) return null;

    const json: ApiResponse = await res.json();

    if (!json.success || !json.data) return null;

    return json.data;
  } catch {
    return null;
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

const initials = (name: string) =>
  name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

const avatarHue = (name: string) =>
  `hsl(${(name.charCodeAt(0) * 7) % 360}, 60%, 40%)`;

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function MemberDashboardPage({
  params,
}: {
  params: Promise<{ memberId: string }>;
}) {
  const { memberId } = await params;

  const member = await getVerifier(memberId);

  if (!member) notFound();

  const joinedDate    = formatDate(member.createdAt);
  const lastUpdated   = formatDate(member.updatedAt);

  const stats = [
    {
      label:     'Role',
      value:     member.role,
      icon:      <Shield size={20} />,
      iconStyle: { backgroundColor: '#dbeafe', color: '#2563eb' },
    },
    {
      label:     'Department',
      value:     member.department,
      icon:      <Building2 size={20} />,
      iconStyle: { backgroundColor: '#dcfce7', color: '#15803d' },
    },
    {
      label:     'Active Queue',
      value:     'View',
      icon:      <Workflow size={20} />,
      href:      `/forms/pending?verifier=${encodeURIComponent(member.role)}`,
      iconStyle: { backgroundColor: '#fef3c7', color: '#b45309' },
    },
    {
      label:     'Member Since',
      value:     new Date(member.createdAt).getFullYear().toString(),
      icon:      <Calendar size={20} />,
      iconStyle: { backgroundColor: '#ede9fe', color: '#7c3aed' },
    },
  ];

  return (
    <div className={styles.dashboardWrapper}>

      {/* ── Hero ── */}
      <section className={styles.memberHero}>
        <div className={styles.memberHeroContent}>

          {/* Initials avatar — Verifier has no avatar URL */}
          <div
            className={styles.memberPhoto}
            style={{
              display:         'flex',
              alignItems:      'center',
              justifyContent:  'center',
              background:      avatarHue(member.userName),
              color:           '#fff',
              fontSize:        '1.5rem',
              fontWeight:      700,
              borderRadius:    '50%',
              flexShrink:      0,
            }}
          >
            {initials(member.userName)}
          </div>

          <div className={styles.memberHeroMeta}>
            <h1 className={styles.memberHeroTitle}>{member.userName}</h1>
            <p className={styles.memberHeroSubtitle}>
              Member dashboard — contact details, role assignment, and workflow access.
            </p>
            <div className={styles.memberBadgeRow}>
              <span className={styles.memberBadge}>
                <BadgeCheck size={14} />
                {member.role}
              </span>
              <span className={styles.memberBadge}>
                <BriefcaseBusiness size={14} />
                {member.department}
              </span>
              <span className={styles.memberBadge}>
                <Calendar size={14} />
                Joined {joinedDate}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.memberHeroActions}>
          <Link href={`/members/all/${member.id}/edit`} className={styles.primaryAction}>
            <Edit2 size={16} />
            Edit Member
          </Link>
          <Link
            href={`/forms/pending?verifier=${encodeURIComponent(member.role)}`}
            className={styles.secondaryAction}
          >
            <ArrowUpRight size={16} />
            View Queue
          </Link>
        </div>
      </section>

      {/* ── Stats ── */}
      <div className={styles.statsGrid}>
        {stats.map((stat) => {
          const content = (
            <>
              <div className={styles.statTop}>
                <div className={styles.iconBox} style={stat.iconStyle}>
                  {stat.icon}
                </div>
                {stat.href && <ArrowUpRight size={14} className={styles.statActionIcon} />}
              </div>
              <p className={styles.statValue}>{stat.value}</p>
              <p className={styles.statLabel}>{stat.label}</p>
            </>
          );

          return stat.href ? (
            <Link
              key={stat.label}
              href={stat.href}
              className={`${styles.statCard} ${styles.statCardLink} ${styles.memberStatCard}`}
            >
              {content}
            </Link>
          ) : (
            <div key={stat.label} className={`${styles.statCard} ${styles.memberStatCard}`}>
              {content}
            </div>
          );
        })}
      </div>

      {/* ── Detail panels ── */}
      <div className={styles.chartGrid}>

        {/* Member Profile */}
        <div className={`${styles.chartCardLarge} ${styles.memberPanel}`}>
          <div className={styles.memberPanelContent}>
            <div className={styles.chartHeader}>
              <h3 className={styles.chartTitle}>Member Profile</h3>
              <p className={styles.chartSubtitle}>Contact details and account information</p>
            </div>
            <div className={styles.infoGrid}>
              <div className={styles.infoTile}>
                <Mail size={18} color="#2563eb" />
                <div>
                  <span className={styles.infoLabel}>Email</span>
                  <strong>{member.email}</strong>
                </div>
              </div>
              <div className={styles.infoTile}>
                <Phone size={18} color="#0f766e" />
                <div>
                  <span className={styles.infoLabel}>Mobile</span>
                  <strong>{member.mobileNo}</strong>
                </div>
              </div>
              <div className={styles.infoTile}>
                <Building2 size={18} color="#7c3aed" />
                <div>
                  <span className={styles.infoLabel}>Department</span>
                  <strong>{member.department}</strong>
                </div>
              </div>
              <div className={styles.infoTile}>
                <Calendar size={18} color="#b45309" />
                <div>
                  <span className={styles.infoLabel}>Joined</span>
                  <strong>{joinedDate}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Current Role */}
        <div className={`${styles.chartCard} ${styles.memberPanel}`}>
          <div className={styles.memberPanelContent}>
            <div className={styles.chartHeader}>
              <h3 className={styles.chartTitle}>Current Role</h3>
              <p className={styles.chartSubtitle}>Primary verification responsibility</p>
            </div>
            <div className={styles.statusList}>
              <div className={styles.statusRow}>
                <span>Designation</span>
                <span
                  className={`${styles.statusBadge} ${
                    roleBadgeColors[member.role] ?? styles.statusDefault
                  }`}
                >
                  {member.role}
                </span>
              </div>
              <div className={styles.statusRow}>
                <span>Department</span>
                <span className={styles.statusValue}>{member.department}</span>
              </div>
              <div className={styles.statusRow}>
                <span>Member ID</span>
                <span className={styles.statusValue}>
                  {member.id.slice(0, 8).toUpperCase()}
                </span>
              </div>
              <div className={styles.statusRow}>
                <span>Last Updated</span>
                <span className={styles.statusValue}>{lastUpdated}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Verification Actions table ── */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <div>
            <h3 className={styles.chartTitle}>Recent Verification Actions</h3>
            <p className={styles.chartSubtitle}>
              Latest actions performed by {member.userName}
            </p>
          </div>
          <Link
            href={`/forms/pending?verifier=${encodeURIComponent(member.role)}`}
            className={styles.viewAllBtn}
          >
            View Queue <ArrowUpRight size={14} />
          </Link>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                {['Field', 'Value'].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { field: 'Full Name',    value: member.userName },
                { field: 'Email',        value: member.email },
                { field: 'Mobile',       value: member.mobileNo },
                { field: 'Role',         value: member.role },
                { field: 'Department',   value: member.department },
                { field: 'Joined',       value: joinedDate },
                { field: 'Last Updated', value: lastUpdated },
              ].map(({ field, value }) => (
                <tr key={field}>
                  <td className="text-gray-500 dark:text-gray-400 font-medium">{field}</td>
                  <td>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
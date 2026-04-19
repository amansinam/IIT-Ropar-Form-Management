import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cookies, headers } from 'next/headers';
import {
  ArrowUpRight, Calendar, CheckCircle, Clock,
  Edit2, FileText, Layers3, Users, XCircle,
} from 'lucide-react';
import styles from '@/styles/DashboardPage.module.css';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Verifier {
  id:         string;
  userName:   string;
  role:       string;
  department: string;
  mobileNo:   string;
}

interface VerifierLevel {
  id:       string;
  level:    number;
  verifier: Verifier;
}

interface Submission {
  id:            string;
  overallStatus: 'Pending' | 'Approved' | 'Rejected';
  currentLevel:  number;
  createdAt:     string;
  updatedAt:     string;
  user: {
    id:       string;
    userName: string;
    email:    string;
  };
}

interface FormData {
  id:              number;
  title:           string;
  description:     string;
  deadline:        string;
  formStatus:      boolean;
  formFields:      any[];
  createdAt:       string;
  updatedAt:       string;
  verifiersList:   VerifierLevel[];
  formSubmissions: Submission[];
  _count: { formSubmissions: number };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    Approved: styles.statusApproved,
    Pending:  styles.statusPending,
    Rejected: styles.statusRejected,
  };
  return map[status] ?? styles.statusDefault;
};

const getInitials = (name: string) =>
  name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

// ─── Server-side data fetcher ─────────────────────────────────────────────────

async function getForm(formId: string): Promise<FormData | null> {
  try {
    // ✅ Must use absolute URL in server components
    const baseUrl = process.env.BACKEND_URL ?? 'http://localhost:3000';

    // ✅ Forward cookies so NextAuth session is available in the API route
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const res = await fetch(`${baseUrl}/api/form/getForm/${formId}`, {
      cache: 'no-store',
      headers: {
        'Cookie': cookieHeader,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) return null;

    const json = await res.json();
    return json.success ? json.data : null;

  } catch (error) {
    console.error('[getForm]', error);
    return null;
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function FormDashboardPage({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  const { formId } = await params;
  const form = await getForm(formId);

  if (!form) notFound();

  // ── Derive stats ───────────────────────────────────────────────────
  const total    = form._count.formSubmissions;
  const approved = form.formSubmissions.filter((s) => s.overallStatus === 'Approved').length;
  const pending  = form.formSubmissions.filter((s) => s.overallStatus === 'Pending').length;
  const rejected = form.formSubmissions.filter((s) => s.overallStatus === 'Rejected').length;

  const recentSubmissions = form.formSubmissions.slice(0, 5);

  const statCards = [
    {
      label: 'Total Submissions',
      value: total,
      href:  `/forms/all?formId=${form.id}`,
      icon:  <Users size={22} />,
      color: '#0891B2',
      bg:    '#ECFEFF',
    },
    {
      label: 'Approved',
      value: approved,
      href:  `/forms/all?formId=${form.id}&status=Approved`,
      icon:  <CheckCircle size={22} />,
      color: '#16A34A',
      bg:    '#F0FDF4',
    },
    {
      label: 'Pending',
      value: pending,
      href:  `/forms/all?formId=${form.id}&status=Pending`,
      icon:  <Clock size={22} />,
      color: '#D97706',
      bg:    '#FFFBEB',
    },
    {
      label: 'Rejected',
      value: rejected,
      href:  `/forms/all?formId=${form.id}&status=Rejected`,
      icon:  <XCircle size={22} />,
      color: '#DC2626',
      bg:    '#FFF1F2',
    },
  ];

  return (
    <div className={styles.dashboardWrapper}>

      {/* ── Header ── */}
      <div className={styles.pageHeader}>
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.pageTitle}>{form.title}</h1>
            <p className={styles.pageSubtitle}>{form.description}</p>
          </div>
          <div className={styles.headerActions}>
            <Link
              href={`/forms/available/${form.id}/edit`}
              className={styles.primaryAction}
            >
              <Edit2 size={16} /> Edit Form
            </Link>
            <Link
              href={`/forms/all?formId=${form.id}`}
              className={styles.secondaryAction}
            >
              <ArrowUpRight size={16} /> View All Submissions
            </Link>
          </div>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className={styles.statsGrid}>
        {statCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className={`${styles.statCard} ${styles.statCardLink}`}
          >
            <div className={styles.statTop}>
              <div
                className={styles.iconBox}
                style={{ backgroundColor: card.bg, color: card.color }}
              >
                {card.icon}
              </div>
              <ArrowUpRight size={14} className={styles.statActionIcon} />
            </div>
            <p className={styles.statValue}>{card.value}</p>
            <p className={styles.statLabel}>{card.label}</p>
          </Link>
        ))}
      </div>

      {/* ── Overview + verification flow ── */}
      <div className={styles.chartGrid}>

        {/* Form overview */}
        <div className={styles.chartCardLarge}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>Form Overview</h3>
            <p className={styles.chartSubtitle}>Metadata for this form</p>
          </div>
          <div className={styles.infoGrid}>
            <div className={styles.infoTile}>
              <FileText size={18} />
              <div>
                <span className={styles.infoLabel}>Status</span>
                <strong style={{ color: form.formStatus ? '#16A34A' : '#6B7280' }}>
                  {form.formStatus ? 'Active' : 'Draft'}
                </strong>
              </div>
            </div>
            <div className={styles.infoTile}>
              <Calendar size={18} />
              <div>
                <span className={styles.infoLabel}>Deadline</span>
                <strong>{formatDate(form.deadline)}</strong>
              </div>
            </div>
            <div className={styles.infoTile}>
              <Layers3 size={18} />
              <div>
                <span className={styles.infoLabel}>Fields</span>
                <strong>{form.formFields.length} configured</strong>
              </div>
            </div>
            <div className={styles.infoTile}>
              <Clock size={18} />
              <div>
                <span className={styles.infoLabel}>Last Updated</span>
                <strong>{formatDate(form.updatedAt)}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Verification flow */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>Verification Flow</h3>
            <p className={styles.chartSubtitle}>Approval chain for this form</p>
          </div>
          <div className={styles.statusList}>
            {form.verifiersList.length === 0 ? (
              <p style={{ fontSize: '12px', color: '#9CA3AF', padding: '8px 0' }}>
                No verifiers configured
              </p>
            ) : (
              form.verifiersList.map((vl) => (
                <div key={vl.id} className={styles.flowStep}>
                  <span className={styles.flowIndex}>{vl.level}</span>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 500, margin: 0 }}>
                      {vl.verifier.userName}
                    </p>
                    <p style={{ fontSize: '12px', color: '#9CA3AF', margin: 0 }}>
                      {vl.verifier.role} · {vl.verifier.department}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Recent submissions table ── */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <div>
            <h3 className={styles.chartTitle}>Recent Submissions</h3>
            <p className={styles.chartSubtitle}>Latest 5 submissions for this form</p>
          </div>
          <Link
            href={`/forms/all?formId=${form.id}`}
            className={styles.viewAllBtn}
          >
            View All <ArrowUpRight size={14} />
          </Link>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                {['Applicant', 'Submitted On', 'Email', 'Current Level', 'Status', 'Action'].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={6} className={styles.emptyCell}>
                    No submissions found for this form yet.
                  </td>
                </tr>
              ) : (
                recentSubmissions.map((submission) => (
                  <tr key={submission.id}>

                    {/* Applicant */}
                    <td>
                      <div className={styles.userCell}>
                        <div className={styles.avatar}>
                          {getInitials(submission.user.userName)}
                        </div>
                        <div>
                          <div>{submission.user.userName}</div>
                          <div className={styles.subtleText}>
                            #{submission.id.slice(0, 8).toUpperCase()}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Submitted on */}
                    <td>{formatDate(submission.createdAt)}</td>

                    {/* Email */}
                    <td>{submission.user.email}</td>

                    {/* Current level */}
                    <td>
                      <span className={styles.levelBadge}>
                        Level {submission.currentLevel}
                      </span>
                    </td>

                    {/* Status */}
                    <td>
                      <span className={`${styles.statusBadge} ${statusBadge(submission.overallStatus)}`}>
                        {submission.overallStatus}
                      </span>
                    </td>

                    {/* Action */}
                    <td>
                      <Link
                        href={`/forms/all/${submission.id}`}
                        className={styles.inlineLink}
                      >
                        View details
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
'use client';
import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useApp } from '@/lib/app-context';
import {
  User, Mail, Building, Shield, Edit2, LogOut, CheckCircle,
  XCircle, FileStack, Camera, Save, X, Loader2, Phone,
} from 'lucide-react';

interface ProfileData {
  name: string; email: string; role: string; department: string;
  mobileNo?: string;
  stats: { formsHandled: number; approvals: number; rejections: number; sentBacks: number; };
}

export default function ProfilePage() {
  const { currentUser, logout } = useApp();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [toast, setToast] = useState('');

  // Editable fields (display only — verifiers cannot change name/email via portal)
  const [name, setName] = useState('');

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch verifier stats from activity endpoint
      const [profileRes, activityRes] = await Promise.all([
        fetch('/api/user/profile'),
        fetch('/api/verifier/activity?limit=100'),
      ]);
      const profileJson = profileRes.ok ? await profileRes.json() : null;
      const activityJson = activityRes.ok ? await activityRes.json() : null;

      const p: ProfileData = {
        name: profileJson?.data?.name ?? currentUser?.name ?? 'Verifier',
        email: profileJson?.data?.email ?? currentUser?.email ?? '',
        role: profileJson?.data?.role ?? currentUser?.role ?? '',
        department: profileJson?.data?.department ?? '',
        stats: {
          formsHandled: (activityJson?.stats?.totalActions ?? 0),
          approvals: activityJson?.stats?.approvals ?? 0,
          rejections: activityJson?.stats?.rejections ?? 0,
          sentBacks: activityJson?.stats?.sentBacks ?? 0,
        },
      };
      setProfile(p);
      setName(p.name);
    } catch {
      // fallback to session data
      if (currentUser) {
        setProfile({ name: currentUser.name, email: currentUser.email, role: currentUser.role, department: '', stats: { formsHandled: 0, approvals: 0, rejections: 0, sentBacks: 0 } });
        setName(currentUser.name);
      }
    } finally { setLoading(false); }
  }, [currentUser]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleSave = () => {
    if (profile) setProfile({ ...profile, name });
    setEditing(false);
    setToast('Profile updated successfully!');
    setTimeout(() => setToast(''), 3000);
  };

  const statsDisplay = [
    { label: 'Total Actions', val: profile?.stats.formsHandled ?? 0, icon: FileStack, color: '#3B82F6', bg: '#EFF6FF' },
    { label: 'Approvals', val: profile?.stats.approvals ?? 0, icon: CheckCircle, color: '#22C55E', bg: '#F0FDF4' },
    { label: 'Rejections', val: profile?.stats.rejections ?? 0, icon: XCircle, color: '#EF4444', bg: '#FFF5F5' },
  ];

  const approvalRate = profile?.stats.formsHandled
    ? Math.round((profile.stats.approvals / profile.stats.formsHandled) * 100) : 0;
  const rejectionRate = profile?.stats.formsHandled
    ? Math.round((profile.stats.rejections / profile.stats.formsHandled) * 100) : 0;
  const completionRate = profile?.stats.formsHandled
    ? Math.round(((profile.stats.approvals + profile.stats.rejections) / profile.stats.formsHandled) * 100) : 0;

  return (
    <DashboardLayout>
      {toast && (
        <div className="fixed top-6 right-6 z-50 px-5 py-3 rounded-xl text-white text-sm font-semibold shadow-lg"
          style={{ background: 'linear-gradient(135deg,#22C55E,#16a34a)' }}>
          ✓ {toast}
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Profile</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Manage your account settings</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--text-muted)' }} />
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {/* Profile Card */}
          <div className="xl:col-span-1">
            <div className="content-card p-6 text-center">
              <div className="relative inline-block mb-4">
                <div className="w-24 h-24 rounded-3xl flex items-center justify-center text-white text-3xl font-bold mx-auto"
                  style={{ background: 'linear-gradient(135deg, #1E3A8A, #3B82F6)' }}>
                  {(profile?.name ?? 'V').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <button className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl flex items-center justify-center text-white"
                  style={{ background: 'linear-gradient(135deg,#14B8A6,#0D9488)', border: 'none', cursor: 'pointer' }}>
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>

              <h3 className="text-xl font-bold mb-1" style={{ color: 'var(--text)' }}>{profile?.name}</h3>
              <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>{profile?.role}</p>
              <span className="badge" style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>
                <Shield className="w-3 h-3" /> Verifier Authority
              </span>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mt-6 pt-5 border-t" style={{ borderColor: 'var(--border)' }}>
                {statsDisplay.map(({ label, val, icon: Icon, color, bg }) => (
                  <div key={label} className="text-center">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-1.5" style={{ background: bg }}>
                      <Icon className="w-4 h-4" style={{ color }} />
                    </div>
                    <div className="text-xl font-bold" style={{ color }}>{val}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="space-y-2.5 mt-6 pt-5 border-t" style={{ borderColor: 'var(--border)' }}>
                <button onClick={() => setEditing(true)} className="btn-primary w-full justify-center" style={{ width: '100%' }}>
                  <Edit2 className="w-4 h-4" /> Edit Profile
                </button>
                <button
                  onClick={() => logout()}
                  className="btn-outline w-full justify-center flex items-center gap-2"
                  style={{ width: '100%', color: '#EF4444', borderColor: '#FCA5A5', background: 'none', cursor: 'pointer' }}>
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            </div>
          </div>

          {/* Right panel */}
          <div className="xl:col-span-2 space-y-5">
            <div className="content-card p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-base" style={{ color: 'var(--text)' }}>
                  {editing ? 'Edit Profile' : 'Account Information'}
                </h3>
                {editing && (
                  <div className="flex gap-2">
                    <button onClick={() => setEditing(false)} className="btn-outline" style={{ padding: '7px 14px' }}>
                      <X className="w-4 h-4" /> Cancel
                    </button>
                    <button onClick={handleSave} className="btn-primary" style={{ padding: '7px 14px' }}>
                      <Save className="w-4 h-4" /> Save Changes
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: 'Full Name',     val: editing ? name : (profile?.name ?? ''),       icon: User,     editable: true  },
                  { label: 'Email Address', val: profile?.email ?? '',                          icon: Mail,     editable: false },
                  { label: 'Department',    val: profile?.department ?? 'N/A',                  icon: Building, editable: false },
                  { label: 'Role',          val: profile?.role ?? '',                           icon: Shield,   editable: false },
                ].map(({ label, val, icon: Icon, editable }) => (
                  <div key={label} className="rounded-xl p-4" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-4 h-4" style={{ color: '#3B82F6' }} />
                      <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{label}</p>
                    </div>
                    {editing && editable ? (
                      <input type="text" value={name} onChange={e => setName(e.target.value)}
                        className="form-input" style={{ padding: '7px 12px', fontSize: 14 }} />
                    ) : (
                      <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{val || '—'}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Performance Summary */}
            <div className="content-card p-6">
              <h3 className="font-bold text-base mb-5" style={{ color: 'var(--text)' }}>Performance Summary</h3>
              <div className="space-y-4">
                {[
                  { label: 'Approval Rate',    pct: approvalRate,    color: '#22C55E' },
                  { label: 'Rejection Rate',   pct: rejectionRate,   color: '#EF4444' },
                  { label: 'Completion Rate',  pct: completionRate,  color: '#3B82F6' },
                ].map(({ label, pct, color }) => (
                  <div key={label}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span style={{ color: 'var(--text)' }}>{label}</span>
                      <span className="font-bold" style={{ color }}>{pct}%</span>
                    </div>
                    <div className="h-2 rounded-full" style={{ background: 'var(--border)' }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

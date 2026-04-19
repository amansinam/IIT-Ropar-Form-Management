'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Building, Check, Loader2, Mail, Phone, Shield, User, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

const roles = ['Admin', 'HOD', 'Caretaker', 'Dean', 'Faculty', 'Assistant_Registrar', 'Mess_Manager'] as const;

const departments = [
  { label: 'Computer Science', value: 'Computer_Science' },
  { label: 'Electrical Engineering', value: 'Electrical_Engineering' },
  { label: 'Mechanical Engineering', value: 'Mechanical_Engineering' },
  { label: 'Civil Engineering', value: 'Civil_Engineering' },
  { label: 'Physics', value: 'Physics' },
  { label: 'Chemistry', value: 'Chemistry' },
  { label: 'Mathematics', value: 'Mathematics' },
  { label: 'Humanities', value: 'Humanities' },
  { label: 'Academic Affairs', value: 'Academic_Affairs' },
  { label: 'Administration', value: 'Administration' },
  { label: 'Hostel Affairs', value: 'Hostel_Affairs' },
] as const;

interface MemberFormPageProps {
  mode: 'add' | 'edit';
  memberId?: string;
}

interface FormState {
  memberName: string;
  email: string;
  role: string;
  department: string;
  mobileNo: string;
}

const emptyForm: FormState = {
  memberName: '',
  email: '',
  role: '',
  department: '',
  mobileNo: '',
};

export function MemberFormPage({ mode, memberId }: MemberFormPageProps) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // ── Fetch existing verifier when editing ──────────────────────────
  useEffect(() => {
    if (mode !== 'edit' || !memberId) return;

    const fetchMember = async () => {
      try {
        const res = await fetch(`/api/admin/getVerifierMemberDetails/${memberId}`);
        if (!res.ok) throw new Error('Failed to fetch member');
        const { data } = await res.json();
        setForm({
          memberName: data.userName ?? '',
          email: data.email ?? '',
          role: data.role ?? '',
          department: data.department ?? '',
          mobileNo: data.mobileNo ?? '',
        });
      } catch {
        toast.error('Failed to load member details.');
      }
    };

    fetchMember();
  }, [mode, memberId]);

  // ── Field updater helper ──────────────────────────────────────────
  const setField = <K extends keyof FormState>(key: K, value: string) => {
    setForm(p => ({ ...p, [key]: value }));
    setErrors(p => ({ ...p, [key]: undefined }));
  };

  // ── Validation ────────────────────────────────────────────────────
  const validate = (): boolean => {
    const next: Partial<FormState> = {};
    if (!form.memberName.trim())
      next.memberName = 'Name is required';
    if (!form.email.trim())
      next.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email))
      next.email = 'Invalid email format';
    if (!form.role)
      next.role = 'Role is required';
    if (!form.department)
      next.department = 'Department is required';
    if (!form.mobileNo.trim())
      next.mobileNo = 'Phone number is required';
    else if (!/^[\+\d\s-]{10,}$/.test(form.mobileNo))
      next.mobileNo = 'Invalid phone number';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  // ── Submit ────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      // Edit uses PATCH /api/admin/updateMember/[id]
      // Create uses POST /api/admin/registerVerifier
      const url = mode === 'edit' && memberId
        ? `/api/admin/updateMember/${memberId}`
        : '/api/admin/registerVerifier';
      const method = mode === 'edit' ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberName: form.memberName,
          email: form.email,
          role: form.role,
          department: form.department,
          mobileNo: form.mobileNo,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message ?? 'Something went wrong. Please try again.');
        return;
      }

      setSuccess(true);
      toast.success(
        mode === 'edit'
          ? `Member "${form.memberName}" updated successfully`
          : `Member "${form.memberName}" registered successfully`
      );
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* Page heading */}
      <div>
        {mode === 'edit' && memberId && (
          <Link
            href={`/members/all/${memberId}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-[#1E3A8A] dark:text-blue-400 mb-3"
          >
            ← Back to member dashboard
          </Link>
        )}
        <h1 className="text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
          {mode === 'edit' ? 'Edit Member' : 'Add Member'}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          {mode === 'edit'
            ? 'Update the verifier profile details.'
            : 'Register a new verifier in the verification system.'}
        </p>
      </div>

      <div
        className="bg-white dark:bg-gray-900 rounded-2xl p-8 border border-gray-100 dark:border-gray-800"
        style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
      >
        {/* Card header */}
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-100 dark:border-gray-800">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 flex items-center justify-center text-[#1E3A8A] dark:text-blue-300">
            <UserPlus size={24} />
          </div>
          <div>
            <h3 className="text-gray-900 dark:text-white font-semibold">
              {mode === 'edit' ? 'Edit Verifier Details' : 'New Verifier Registration'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {mode === 'edit'
                ? 'Update contact and assignment details'
                : 'Fill in the information to register a new verifier'}
            </p>
          </div>
        </div>

        <div className="space-y-5">

          {/* Full Name */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              <User size={14} className="text-[#1E3A8A]" /> Full Name *
            </label>
            <input
              type="text"
              value={form.memberName}
              onChange={e => setField('memberName', e.target.value)}
              placeholder="e.g., Dr. Suresh Kumar"
              className={`w-full px-4 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-all bg-gray-50 dark:bg-gray-800 dark:text-white ${errors.memberName
                ? 'border-red-400 focus:ring-red-200'
                : 'border-gray-200 dark:border-gray-600 focus:ring-[#3B82F6]/30 focus:border-[#3B82F6]'
                }`}
            />
            {errors.memberName && <p className="text-red-500 text-xs mt-1">{errors.memberName}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              <Mail size={14} className="text-[#1E3A8A]" /> Email Address *
            </label>
            <input
              type="email"
              value={form.email}
              onChange={e => setField('email', e.target.value)}
              placeholder="e.g., suresh.kumar@iitrpr.ac.in"
              className={`w-full px-4 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-all bg-gray-50 dark:bg-gray-800 dark:text-white ${errors.email
                ? 'border-red-400 focus:ring-red-200'
                : 'border-gray-200 dark:border-gray-600 focus:ring-[#3B82F6]/30 focus:border-[#3B82F6]'
                }`}
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          {/* Role */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              <Shield size={14} className="text-[#1E3A8A]" /> Role *
            </label>
            <div className="flex flex-wrap gap-2">
              {roles.map(role => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setField('role', role)}
                  className={`px-4 py-2 text-sm font-medium rounded-xl border-2 transition-all ${form.role === role
                    ? 'border-[#1E3A8A] bg-[#1E3A8A] text-white shadow-lg shadow-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-[#1E3A8A]'
                    }`}
                >
                  {role}
                </button>
              ))}
            </div>
            {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role}</p>}
          </div>

          {/* Department */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              <Building size={14} className="text-[#1E3A8A]" /> Department *
            </label>
            <select
              value={form.department}
              onChange={e => setField('department', e.target.value)}
              className={`w-full px-4 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-all bg-gray-50 dark:bg-gray-800 dark:text-white appearance-none ${errors.department
                ? 'border-red-400 focus:ring-red-200'
                : 'border-gray-200 dark:border-gray-600 focus:ring-[#3B82F6]/30 focus:border-[#3B82F6]'
                }`}
            >
              <option value="">Select department...</option>
              {departments.map(d => (
                <option key={d.value} value={d.value}>
                  {d.label} {/* shows "Computer Science", sends "Computer_Science" */}
                </option>
              ))}
            </select>
            {errors.department && <p className="text-red-500 text-xs mt-1">{errors.department}</p>}
          </div>

          {/* Phone */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              <Phone size={14} className="text-[#1E3A8A]" /> Phone Number *
            </label>
            <input
              type="tel"
              value={form.mobileNo}
              onChange={e => setField('mobileNo', e.target.value)}
              placeholder="e.g., +91 98765 43210"
              className={`w-full px-4 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-all bg-gray-50 dark:bg-gray-800 dark:text-white ${errors.mobileNo
                ? 'border-red-400 focus:ring-red-200'
                : 'border-gray-200 dark:border-gray-600 focus:ring-[#3B82F6]/30 focus:border-[#3B82F6]'
                }`}
            />
            {errors.mobileNo && <p className="text-red-500 text-xs mt-1">{errors.mobileNo}</p>}
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              onClick={handleSave}
              disabled={saving || success}
              className={`w-full flex items-center justify-center gap-2 py-3 text-white font-semibold text-sm rounded-xl transition-all shadow-lg ${success
                ? 'bg-green-500 shadow-green-500/20'
                : 'bg-[#1E3A8A] hover:bg-[#1e3a8a]/90 shadow-blue-900/20 disabled:opacity-60 disabled:cursor-not-allowed'
                }`}
            >
              {success ? (
                <><Check size={18} className="animate-bounce" /> {mode === 'edit' ? 'Member Updated' : 'Member Registered'} Successfully!</>
              ) : saving ? (
                <><Loader2 size={16} className="animate-spin" /> {mode === 'edit' ? 'Updating...' : 'Registering...'}</>
              ) : (
                <><UserPlus size={16} /> {mode === 'edit' ? 'Save Changes' : 'Register Verifier'}</>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
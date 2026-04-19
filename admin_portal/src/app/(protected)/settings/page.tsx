'use client';

import React, { useState, useEffect } from 'react';
import { User, Bell, Shield, Palette, Globe, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '@/context/AppContext';
import { useSession } from 'next-auth/react';
import Image from 'next/image';

export default function SettingsPage() {
  const { darkMode, toggleDarkMode } = useApp();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    designation: '',
    department: '',
  });
  const [notifications, setNotifications] = useState({
    emailOnSubmission: true,
    emailOnApproval: true,
    emailOnRejection: true,
    browserNotifications: false,
    weeklyDigest: true,
  });

  // Fetch admin details from database
  useEffect(() => {
    const fetchAdminDetails = async () => {
      try {
        if (!session?.user?.email) {
          setLoading(false);
          return;
        }

        const response = await fetch('/api/admin/getVerifierMemberDetails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: session.user.email }),
        });

        if (response.ok) {
          const data = await response.json();
          setProfile({
            name: data.userName || session.user.name || '',
            email: data.email || session.user.email || '',
            phone: data.mobileNo || '8902345678',
            designation: data.role || 'Admin',
            department: data.department || 'Administration',
          });
        } else {
          // Fallback to session data if API fails
          setProfile({
            name: session.user.name || 'Admin User',
            email: session.user.email || 'admin@iitrpr.ac.in',
            phone: '8902345678',
            designation: session.user.role || 'Admin',
            department: 'Administration',
          });
        }
      } catch (error) {
        console.error('Failed to fetch admin details:', error);
        // Fallback to session data
        setProfile({
          name: session?.user?.name || 'Admin User',
          email: session?.user?.email || 'admin@iitrpr.ac.in',
          phone: '8902345678',
          designation: session?.user?.role || 'Admin',
          department: 'Administration',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAdminDetails();
  }, [session]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // You can add API call here to save changes if needed
      await new Promise(r => setTimeout(r, 1200));
      toast.success('Settings saved successfully!');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 size={32} className="animate-spin text-[#1E3A8A]" />
      </div>
    );
  }

  // Get initials from name
  const initials = profile.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'AD';

  return (
    <div className="space-y-6 max-w-3xl" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div>
        <h1 className="text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage your account preferences and system settings</p>
      </div>

      {/* Profile Settings */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden"
        style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
            <User size={16} className="text-[#1E3A8A] dark:text-blue-400" />
          </div>
          <h3 className="text-gray-900 dark:text-white">Profile Settings</h3>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-5 mb-6 pb-6 border-b border-gray-100 dark:border-gray-800">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-[#1E3A8A] text-white text-xl font-bold flex items-center justify-center">
                {initials}
              </div>
              <button className="absolute bottom-0 right-0 w-5 h-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-full flex items-center justify-center shadow-sm">
                <User size={10} className="text-gray-500" />
              </button>
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">{profile.name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{profile.email}</p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <div className="w-4 h-4 rounded-full overflow-hidden">
                  <Image src="/logo.png" width={40} height={40} alt="IIT Ropar" className="w-full h-full object-contain bg-white" />
                </div>
                <span className="text-xs text-[#1E3A8A] dark:text-blue-400 font-medium">IIT Ropar</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { key: 'name', label: 'Full Name' },
              { key: 'email', label: 'Email Address' },
              { key: 'phone', label: 'Phone Number' },
              { key: 'designation', label: 'Designation' },
              { key: 'department', label: 'Department' },
            ].map(field => (
              <div key={field.key} className={field.key === 'department' ? 'sm:col-span-2' : ''}>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">{field.label}</label>
                <input
                  type="text"
                  value={profile[field.key as keyof typeof profile]}
                  onChange={(e) => setProfile(p => ({ ...p, [field.key]: e.target.value }))}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30 bg-gray-50 dark:bg-gray-800 dark:text-white"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden"
        style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
          <div className="w-8 h-8 bg-amber-50 dark:bg-amber-900/20 rounded-lg flex items-center justify-center">
            <Bell size={16} className="text-amber-600 dark:text-amber-400" />
          </div>
          <h3 className="text-gray-900 dark:text-white">Notification Preferences</h3>
        </div>
        <div className="p-6 space-y-4">
          {[
            { key: 'emailOnSubmission', label: 'New Form Submission', desc: 'Receive email when a new form is submitted' },
            { key: 'emailOnApproval', label: 'Form Approved', desc: 'Receive email when a form is approved' },
            { key: 'emailOnRejection', label: 'Form Rejected', desc: 'Receive email when a form is rejected' },
            { key: 'browserNotifications', label: 'Browser Notifications', desc: 'Show desktop push notifications' },
            { key: 'weeklyDigest', label: 'Weekly Digest', desc: 'Receive a weekly summary report' },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{item.label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
              </div>
              <button
                onClick={() => setNotifications(p => ({ ...p, [item.key]: !p[item.key as keyof typeof p] }))}
                className={`relative w-11 h-6 rounded-full transition-colors ${notifications[item.key as keyof typeof notifications] ? 'bg-[#14B8A6]' : 'bg-gray-300 dark:bg-gray-600'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${notifications[item.key as keyof typeof notifications] ? 'translate-x-5' : ''}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Appearance */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden"
        style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
          <div className="w-8 h-8 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
            <Palette size={16} className="text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-gray-900 dark:text-white">Appearance</h3>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Dark Mode</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Switch between light and dark interface</p>
            </div>
            <button
              onClick={toggleDarkMode}
              className={`relative w-11 h-6 rounded-full transition-colors ${darkMode ? 'bg-[#1E3A8A]' : 'bg-gray-300 dark:bg-gray-600'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${darkMode ? 'translate-x-5' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden"
        style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
          <div className="w-8 h-8 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
            <Shield size={16} className="text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-gray-900 dark:text-white">Security</h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Change Password</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Last changed 30 days ago</p>
            </div>
            <button
              onClick={() => toast.info('Password change dialog coming soon')}
              className="px-4 py-2 text-xs font-medium text-[#1E3A8A] dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 rounded-lg transition-colors"
            >
              Change
            </button>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Two-Factor Authentication</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Add an extra layer of security</p>
            </div>
            <button
              onClick={() => toast.info('2FA setup coming soon')}
              className="px-4 py-2 text-xs font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 rounded-lg transition-colors"
            >
              Enable
            </button>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pb-6">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-[#1E3A8A] hover:bg-[#1e3a8a]/90 text-white font-semibold text-sm rounded-xl transition-all disabled:opacity-60 shadow-lg shadow-blue-900/20"
        >
          {saving ? (
            <><Loader2 size={16} className="animate-spin" /> Saving...</>
          ) : (
            <><Save size={16} /> Save All Changes</>
          )}
        </button>
      </div>
    </div>
  );
}

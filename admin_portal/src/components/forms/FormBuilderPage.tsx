'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  GripVertical, Trash2, Plus, X, ChevronUp, ChevronDown,
  FileText, Hash, Phone, Mail, MapPin, Building, BookOpen, Calendar,
  Upload, CheckSquare, Circle, List, Type, AlignLeft, Settings,
  Eye, Zap, Info, ArrowLeft, Loader2, AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import styles from '@/styles/CreateFormPage.module.css';

// ─── Types ────────────────────────────────────────────────────────────────────

type FormFieldType =
  | 'text' | 'number' | 'date' | 'file' | 'checkbox'
  | 'radio' | 'select' | 'textarea' | 'email' | 'tel';

interface FormField {
  id: string;
  label: string;
  type: FormFieldType;
  required: boolean;
  placeholder?: string;
  options?: string[];
  isCustom?: boolean;
}

interface VerifierLevel {
  id: string;   // local UI id only
  verifierId: string;   // real DB Verifier.id (uuid)
  name: string;
  role: string;
}

interface ApiVerifier {
  id: string;
  userName: string;
  email: string;
  role: string;
  department: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const QUICK_FIELDS: {
  label: string; type: FormFieldType; icon: React.ReactNode; placeholder?: string;
}[] = [
    { label: 'Name', type: 'text', icon: <FileText size={14} />, placeholder: 'Enter full name' },
    { label: 'Age', type: 'number', icon: <Hash size={14} />, placeholder: 'Enter age' },
    { label: 'Mobile', type: 'tel', icon: <Phone size={14} />, placeholder: 'Enter mobile number' },
    { label: 'Email', type: 'email', icon: <Mail size={14} />, placeholder: 'Enter email address' },
    { label: 'Address', type: 'textarea', icon: <MapPin size={14} />, placeholder: 'Enter full address' },
    { label: 'Department', type: 'text', icon: <Building size={14} />, placeholder: 'Enter department' },
    { label: 'Roll Number', type: 'text', icon: <BookOpen size={14} />, placeholder: 'Enter roll number' },
  ];

const fieldTypeOptions: { value: FormFieldType; label: string; icon: React.ReactNode }[] = [
  { value: 'text', label: 'Text', icon: <Type size={14} /> },
  { value: 'number', label: 'Number', icon: <Hash size={14} /> },
  { value: 'date', label: 'Date', icon: <Calendar size={14} /> },
  { value: 'file', label: 'File Upload', icon: <Upload size={14} /> },
  { value: 'checkbox', label: 'Checkbox', icon: <CheckSquare size={14} /> },
  { value: 'radio', label: 'Radio', icon: <Circle size={14} /> },
  { value: 'select', label: 'Select / Dropdown', icon: <List size={14} /> },
  { value: 'textarea', label: 'Textarea', icon: <AlignLeft size={14} /> },
  { value: 'email', label: 'Email', icon: <Mail size={14} /> },
  { value: 'tel', label: 'Phone', icon: <Phone size={14} /> },
];

const fieldIcons: Record<FormFieldType, React.ReactNode> = {
  text: <Type size={12} />,
  number: <Hash size={12} />,
  date: <Calendar size={12} />,
  file: <Upload size={12} />,
  checkbox: <CheckSquare size={12} />,
  radio: <Circle size={12} />,
  select: <List size={12} />,
  textarea: <AlignLeft size={12} />,
  email: <Mail size={12} />,
  tel: <Phone size={12} />,
};

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

// ─── CustomFieldForm ──────────────────────────────────────────────────────────

interface CustomFieldFormProps {
  onAdd: (field: FormField) => void;
  onCancel: () => void;
}

function CustomFieldForm({ onAdd, onCancel }: CustomFieldFormProps) {
  const [label, setLabel] = useState('');
  const [type, setType] = useState<FormFieldType>('text');
  const [options, setOptions] = useState<string[]>([]);
  const [newOption, setNewOption] = useState('');
  const [required, setRequired] = useState(false);

  const needsOptions = ['checkbox', 'radio', 'select'].includes(type);

  const addOption = () => {
    if (newOption.trim()) {
      setOptions((prev) => [...prev, newOption.trim()]);
      setNewOption('');
    }
  };

  const handleAdd = () => {
    if (!label.trim()) { toast.error('Field label is required'); return; }
    if (needsOptions && options.length === 0) { toast.error('Please add at least one option'); return; }
    onAdd({
      id: generateId(),
      label: label.trim(),
      type,
      required,
      options: needsOptions ? options : undefined,
      isCustom: true,
    });
  };

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4 space-y-3">
      <h4 className="text-sm font-semibold text-[#1E3A8A] dark:text-blue-300 flex items-center gap-2">
        <Zap size={14} /> Add Custom Field
      </h4>
      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Field Label</label>
        <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g., Passport No., CGPA..." className={styles.input} />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Input Type</label>
        <div className="grid grid-cols-2 gap-1.5">
          {fieldTypeOptions.map((option) => (
            <button key={option.value} type="button" onClick={() => setType(option.value)}
              className={`${styles.typeSelector} ${type === option.value ? styles.typeSelectorActive : ''}`}>
              {option.icon} {option.label}
            </button>
          ))}
        </div>
      </div>
      {needsOptions && (
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Options</label>
          <div className="flex gap-2 mb-2">
            <input type="text" value={newOption} onChange={(e) => setNewOption(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addOption()} placeholder="Type option name..." className={styles.input} />
            <button type="button" onClick={addOption} className="w-8 h-8 bg-[#1E3A8A] text-white rounded-lg flex items-center justify-center hover:bg-[#1e3a8a]/90 flex-shrink-0">
              <Plus size={14} />
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {options.map((opt, i) => (
              <span key={i} className="flex items-center gap-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-xs px-2 py-1 rounded-full text-gray-700 dark:text-gray-300">
                {opt}
                <button type="button" onClick={() => setOptions(options.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500">
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
      <div className="flex items-center gap-2">
        <input type="checkbox" id="required" checked={required} onChange={(e) => setRequired(e.target.checked)} className="w-3.5 h-3.5" />
        <label htmlFor="required" className="text-xs text-gray-600 dark:text-gray-400">Required field</label>
      </div>
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={handleAdd} className="flex-1 py-2 bg-[#1E3A8A] text-white text-xs font-semibold rounded-lg hover:bg-[#1e3a8a]/90 transition-colors cursor-pointer">
          Add to Form
        </button>
        <button type="button" onClick={onCancel} className="px-3 py-2 text-xs text-gray-500 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface FormBuilderPageProps {
  mode: 'create' | 'edit';
  formId?: string;
}

export function FormBuilderPage({ mode, formId }: FormBuilderPageProps) {
  const router = useRouter();

  // ── Form state ─────────────────────────────────────────────────────
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [fields, setFields] = useState<FormField[]>([]);
  const [verifiers, setVerifiers] = useState<VerifierLevel[]>([]);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  // ── Form fetch state (edit mode only) ──────────────────────────────
  const [formLoading, setFormLoading] = useState(mode === 'edit' && !!formId); // ✅ both conditions
  const [formError, setFormError] = useState<string | null>(null);

  // ── Available verifiers from DB ────────────────────────────────────
  const [availableVerifiers, setAvailableVerifiers] = useState<ApiVerifier[]>([]);
  const [verifiersLoading, setVerifiersLoading] = useState(true);
  const [verifiersError, setVerifiersError] = useState<string | null>(null);
  const [verifierSearch, setVerifierSearch] = useState('');
  const [showVerifierDropdown, setShowVerifierDropdown] = useState(false);

  // ── Fetch existing form data (edit mode) ───────────────────────────
  const fetchForm = useCallback(async () => {
    if (mode !== 'edit' || !formId) {
      setFormLoading(false); // ✅ always unblock the UI
      return;
    }
    setFormLoading(true);
    setFormError(null);
    try {
      const { data } = await axios.get(`/api/form/getForm/${formId}`);
      const form = data.data;

      setFormTitle(form.title);
      setFormDescription(form.description ?? '');
      setDeadline(form.deadline.slice(0, 10));
      setIsActive(form.formStatus);

      const hydratedFields: FormField[] = (form.formFields as any[]).map((f: any) => ({
        id: generateId(),
        label: f.label,
        type: f.type as FormFieldType,
        required: f.required,
        placeholder: f.placeholder,
        options: f.options,
      }));
      setFields(hydratedFields);

      const hydratedVerifiers: VerifierLevel[] = form.verifiersList.map((vl: any) => ({
        id: generateId(),
        verifierId: vl.verifier.id,
        name: vl.verifier.userName,
        role: vl.verifier.role,
      }));
      setVerifiers(hydratedVerifiers);

    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.message ?? err.message
        : 'Failed to load form';
      setFormError(msg);
      toast.error(msg);
    } finally {
      setFormLoading(false); // ✅ always runs
    }
  }, [mode, formId]);

  useEffect(() => { fetchForm(); }, [fetchForm]);

  // ── Fetch verifiers from DB ────────────────────────────────────────
  const fetchVerifiers = useCallback(async () => {
    setVerifiersLoading(true);
    setVerifiersError(null);
    try {
      const { data } = await axios.get('/api/admin/getAllMembers');
      setAvailableVerifiers(data.data ?? []);
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.message ?? err.message
        : 'Failed to load verifiers';
      setVerifiersError(msg);
      toast.error(msg);
    } finally {
      setVerifiersLoading(false);
    }
  }, []);

  useEffect(() => { fetchVerifiers(); }, [fetchVerifiers]);

  // ── Quick fields ───────────────────────────────────────────────────
  const addedLabels = new Set(fields.map((f) => f.label));

  const addQuickField = (qf: typeof QUICK_FIELDS[number]) => {
    if (addedLabels.has(qf.label)) return;
    setFields((prev) => [...prev, { id: generateId(), label: qf.label, type: qf.type, required: true, placeholder: qf.placeholder }]);
  };

  const removeField = (id: string) => setFields((prev) => prev.filter((f) => f.id !== id));

  const moveField = (index: number, direction: 'up' | 'down') => {
    const next = [...fields];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setFields(next);
  };

  const handleDragStart = (index: number) => setDragIndex(index);
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    const next = [...fields];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(index, 0, moved);
    setFields(next);
    setDragIndex(index);
  };
  const handleDragEnd = () => setDragIndex(null);

  // ── Verifier management ────────────────────────────────────────────
  const addedVerifierIds = new Set(verifiers.map((v) => v.verifierId));

  const filteredVerifierOptions = availableVerifiers.filter(
    (v) =>
      !addedVerifierIds.has(v.id) &&
      (verifierSearch === '' ||
        v.userName.toLowerCase().includes(verifierSearch.toLowerCase()) ||
        v.role.toLowerCase().includes(verifierSearch.toLowerCase()) ||
        v.department.toLowerCase().includes(verifierSearch.toLowerCase()))
  );

  const addVerifier = (v: ApiVerifier) => {
    setVerifiers((prev) => [...prev, { id: generateId(), verifierId: v.id, name: v.userName, role: v.role }]);
    setVerifierSearch('');
    setShowVerifierDropdown(false);
  };

  const removeVerifier = (id: string) => setVerifiers((prev) => prev.filter((v) => v.id !== id));

  // ── Submit ─────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!formTitle.trim()) { toast.error('Form title is required'); return; }
    if (!deadline) { toast.error('Deadline is required'); return; }
    if (fields.length === 0) { toast.error('Please add at least one field'); return; }
    if (verifiers.length === 0) { toast.error('Please add at least one verifier'); return; }

    const apiFields = fields.map(({ label, type, required, placeholder, options }) => ({
      label, type, required,
      ...(placeholder && { placeholder }),
      ...(options && { options }),
    }));

    const apiVerifiers = verifiers.map((v, i) => ({
      verifierId: v.verifierId,
      level: i + 1,
    }));

    const payload = {
      title: formTitle.trim(),
      description: formDescription.trim(),
      deadline,
      formStatus: isActive,
      fields: apiFields,
      verifiers: apiVerifiers,
    };

    setSaving(true);
    try {
      if (mode === 'create') {
        await axios.post('/api/form/createForm', payload);
        toast.success('Form published successfully');
        setFormTitle(''); setFormDescription(''); setDeadline('');
        setIsActive(true); setFields([]); setVerifiers([]);
        router.push('/dashboard');
      } else {
        await axios.patch(`/api/form/updateForm/${formId}`, payload); // ✅ fixed
        toast.success('Form updated successfully');
        router.push(`/forms/available/${formId}`);
      }
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.message ?? err.message
        : 'Something went wrong';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────

  const pageTitle = mode === 'edit' ? 'Edit Form' : 'Create Form';
  const pageSubtitle = mode === 'edit'
    ? 'Update the form configuration, fields, and verification flow.'
    : 'Build a new form with custom fields and a verification flow.';

  // ── Full-page loading state (edit mode fetching) ───────────────────
  if (formLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <Loader2 size={28} className="animate-spin text-[#1E3A8A]" />
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading form data...</p>
      </div>
    );
  }

  // ── Full-page error state (edit mode fetch failed) ─────────────────
  if (formError) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
          <AlertCircle size={22} className="text-red-500" />
        </div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{formError}</p>
        <div className="flex gap-3">
          <button onClick={fetchForm} className="px-4 py-2 text-sm bg-[#1E3A8A] text-white rounded-xl hover:bg-[#1e3a8a]/90">
            Retry
          </button>
          <button onClick={() => router.back()} className="px-4 py-2 text-sm border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${styles.page}`} style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* ── Page header ── */}
      <div className={styles.pageHeader}>
        {mode === 'edit' && (
          <button type="button" onClick={() => router.push(`/forms/available/${formId}`)}
            className="mb-4 inline-flex items-center gap-2 text-sm text-[#1E3A8A] dark:text-blue-400 font-medium">
            <ArrowLeft size={16} /> Back to form dashboard
          </button>
        )}
        <h1 className="text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>{pageTitle}</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">{pageSubtitle}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-6 space-y-6">

          {/* ── Quick add fields ── */}
          <div className={styles.card}>
            <h3 className={styles.sectionTitle}>Quick Add Fields</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-4 mb-5">Click to add common fields</p>
            <div className="flex flex-wrap gap-3">
              {QUICK_FIELDS.map((qf) => {
                const added = addedLabels.has(qf.label);
                return (
                  <button key={qf.label} type="button" onClick={() => addQuickField(qf)} disabled={added}
                    className={`${styles.quickChip} ${added ? styles.quickChipAdded : ''}`}>
                    {qf.icon} {qf.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Custom field ── */}
          <div className={styles.card}>
            <h3 className={`${styles.sectionTitle} mb-5`}>Custom Field</h3>
            {showCustomForm ? (
              <CustomFieldForm
                onAdd={(field) => { setFields((prev) => [...prev, field]); setShowCustomForm(false); toast.success(`"${field.label}" field added`); }}
                onCancel={() => setShowCustomForm(false)}
              />
            ) : (
              <button type="button" onClick={() => setShowCustomForm(true)} className={styles.addFieldBtn}>
                <Plus size={16} /> Add Custom Field
              </button>
            )}
          </div>

          {/* ── Form settings ── */}
          <div className={styles.card}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg">
                <Settings size={20} className="text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className={styles.sectionTitle}>Form Settings</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                  Form Title <span className="text-red-500">*</span>
                </label>
                <input type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g., Hostel Leave Application" className={styles.input} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Description</label>
                <textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Brief description of the form..." className={styles.input} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                  Deadline <span className="text-red-500">*</span>
                </label>
                <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)}
                  min={new Date().toISOString().split('T')[0]} className={styles.input} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Form Status</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {isActive ? 'Active — accepting submissions' : 'Draft — not visible to users'}
                  </p>
                </div>
                <button type="button" onClick={() => setIsActive(!isActive)}
                  className={`relative w-11 h-6 rounded-full cursor-pointer transition-colors ${isActive ? 'bg-[#22C55E]' : 'bg-gray-300 dark:bg-gray-600'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isActive ? 'translate-x-5' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* ── Verification flow ── */}
          <div className={styles.card} style={{ overflow: 'visible' }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-lg">
                <Zap size={20} className="text-teal-600 dark:text-teal-400" />
              </div>
              <h3 className={styles.sectionTitle}>Verification Flow</h3>
            </div>

            {/* Current verifier chain */}
            {verifiers.length > 0 && (
              <div className="mb-4">
                {verifiers.map((v, i) => (
                  <div key={v.id} className="flex items-center gap-3 mb-3 last:mb-0">
                    <div className="flex flex-col items-center">
                      <div className={styles.levelCircle}>{i + 1}</div>
                      {i < verifiers.length - 1 && <div className="w-0.5 h-6 bg-blue-200 dark:bg-blue-700 mt-1" />}
                    </div>
                    <div className={styles.verifierCard}>
                      <div>
                        <p className="text-xs font-semibold text-[#1E3A8A] dark:text-blue-300">Level {i + 1}</p>
                        <p className="text-sm font-medium text-gray-800 dark:text-white">{v.name}</p>
                        <p className="text-xs text-gray-400">{v.role}</p>
                      </div>
                      <button type="button" onClick={() => removeVerifier(v.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer">
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Verifier picker */}
            <div className="relative">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                {verifiers.length === 0 ? 'Add 1st Level Verifier' : '+ Add Next Level Verifier'}
              </p>

              {verifiersLoading ? (
                <div className="flex items-center gap-2 text-xs text-gray-400 py-2">
                  <Loader2 size={13} className="animate-spin" /> Loading verifiers...
                </div>
              ) : verifiersError ? (
                <div className="text-xs text-red-500 flex items-center gap-2">
                  Failed to load verifiers.
                  <button onClick={fetchVerifiers} className="underline">Retry</button>
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="text"
                    value={verifierSearch}
                    onChange={(e) => { setVerifierSearch(e.target.value); setShowVerifierDropdown(true); }}
                    onFocus={() => setShowVerifierDropdown(true)}
                    onBlur={() => setTimeout(() => setShowVerifierDropdown(false), 200)}
                    placeholder="Search verifier by name, role, or department..."
                    className={styles.input}
                  />

                  {showVerifierDropdown && (
                    <div
                      className="absolute left-0 right-0 mb-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-2xl overflow-y-auto"
                      style={{ zIndex: 9999, maxHeight: '240px', bottom: '100%' }}
                    >
                      {filteredVerifierOptions.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-6">
                          {availableVerifiers.length === 0 ? 'No verifiers in database' : 'No matches found'}
                        </p>
                      ) : (
                        <>
                          <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
                            <p className="text-xs text-gray-400">
                              {filteredVerifierOptions.length} verifier{filteredVerifierOptions.length !== 1 ? 's' : ''} found
                            </p>
                          </div>
                          {filteredVerifierOptions.map((v) => (
                            <button
                              key={v.id}
                              type="button"
                              onMouseDown={(e) => { e.preventDefault(); addVerifier(v); }}
                              className="w-full flex items-center justify-between px-4 py-3 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors text-left border-b border-gray-50 dark:border-gray-700/50 last:border-0"
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-8 h-8 rounded-full text-white text-xs font-bold flex items-center justify-center flex-shrink-0"
                                  style={{ background: `hsl(${v.userName.charCodeAt(0) * 17 % 360}, 55%, 40%)` }}
                                >
                                  {v.userName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-800 dark:text-white">{v.userName}</p>
                                  <p className="text-xs text-gray-400">{v.role} · {v.department}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-[#1E3A8A] dark:text-blue-400 font-medium flex-shrink-0">
                                <Plus size={12} /> Add
                              </div>
                            </button>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {availableVerifiers.length > 0 && addedVerifierIds.size === availableVerifiers.length && (
                <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-2">
                  <Info size={12} /> All available verifiers have been added
                </p>
              )}
            </div>
          </div>

          {/* ── Publish button ── */}
          <button type="button" onClick={handleSave} disabled={saving} className={styles.publishBtn}>
            {saving ? (
              <><Loader2 size={16} className="animate-spin" />{mode === 'edit' ? 'Saving...' : 'Publishing...'}</>
            ) : (
              <><FileText size={16} />{mode === 'edit' ? 'Save Form Changes' : 'Publish Form'}</>
            )}
          </button>
        </div>

        {/* ── Form canvas ── */}
        <div className="lg:col-span-6">
          <div className={styles.card}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className={styles.sectionTitle}>Form Canvas</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                  {fields.length} field{fields.length !== 1 ? 's' : ''} added
                </p>
              </div>
              {fields.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Eye size={12} /> Preview
                </div>
              )}
            </div>

            {fields.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className={styles.emptyIcon}>
                  <FileText size={28} className="text-gray-400" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">No fields added yet</p>
                <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Click chips on the left or add a custom field</p>
              </div>
            ) : (
              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className={`group ${styles.fieldCard} transition-opacity ${dragIndex === index ? 'opacity-50' : 'opacity-100'}`}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="absolute top-2 right-2 hidden group-hover:flex items-center gap-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-1.5 py-1 shadow-sm">
                      <button type="button" onClick={() => moveField(index, 'up')} disabled={index === 0}
                        className="p-0.5 text-gray-400 hover:text-gray-700 dark:hover:text-white disabled:opacity-30 transition-colors cursor-pointer">
                        <ChevronUp size={13} />
                      </button>
                      <button type="button" onClick={() => moveField(index, 'down')} disabled={index === fields.length - 1}
                        className="p-0.5 text-gray-400 hover:text-gray-700 dark:hover:text-white disabled:opacity-30 transition-colors cursor-pointer">
                        <ChevronDown size={13} />
                      </button>
                      <div className="w-px h-3 bg-gray-200 dark:bg-gray-600 mx-0.5" />
                      <button type="button" onClick={() => removeField(field.id)}
                        className="p-0.5 text-gray-400 hover:text-red-500 transition-colors cursor-pointer">
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 transition-colors">
                      <GripVertical size={14} />
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <div className={styles.fieldBadge}>{fieldIcons[field.type]} {field.type}</div>
                        <span className="text-sm font-medium text-gray-800 dark:text-white">{field.label}</span>
                        {field.required && <span className="text-red-500 text-xs">*</span>}
                        {field.isCustom && <span className={styles.customTag}>custom</span>}
                      </div>
                      {field.type === 'textarea' ? (
                        <textarea placeholder={field.placeholder ?? `Enter ${field.label.toLowerCase()}...`} className={styles.input} readOnly />
                      ) : field.type === 'file' ? (
                        <div className="border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-lg p-3 text-center">
                          <Upload size={16} className="text-gray-400 mx-auto mb-1" />
                          <p className="text-xs text-gray-400">Drag and drop or click to upload</p>
                          <p className="text-xs text-gray-300 mt-0.5">PDF, JPG, PNG up to 5MB</p>
                        </div>
                      ) : field.options ? (
                        <div className="flex flex-wrap gap-1.5">
                          {field.options.map((opt, i) => (
                            <span key={i} className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300">
                              {field.type === 'checkbox' ? <CheckSquare size={11} className="text-gray-400" /> : <Circle size={11} className="text-gray-400" />}
                              {opt}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <input type={field.type} placeholder={field.placeholder ?? `Enter ${field.label.toLowerCase()}...`} className={styles.input} readOnly />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
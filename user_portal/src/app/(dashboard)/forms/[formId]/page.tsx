"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import {
  Loader2, Pen, ArrowLeft, Eye,
  AlertCircle, Clock, CheckCircle, ChevronRight,
  FileText, Upload, Send,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
type FieldType =
  | "text" | "email" | "number" | "date" | "tel"
  | "textarea" | "dropdown" | "select"
  | "checkbox" | "radio" | "file";

interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: string[];
}

interface VerifierLevel {
  level: number;
  verifier: { userName: string; role: string; department: string };
}

interface FormDetail {
  id: number;
  title: string;
  description: string;
  deadline: string;
  formStatus: boolean;
  formFields: FormField[];
  verifiersList: VerifierLevel[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDeadline(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const label = date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  return { label, isExpired: diff < 0, isExpiringSoon: diff <= 3 && diff >= 0 };
}

function fieldKey(field: FormField, index: number): string {
  return field.id && field.id.trim() !== "" ? field.id : `field-${index}`;
}

function normaliseType(type: FieldType): FieldType {
  return type === "select" ? "dropdown" : type;
}

// ── FieldInput ────────────────────────────────────────────────────────────────
interface FieldInputProps {
  field: FormField;
  fieldId: string;
  value: string | boolean;
  onChange: (val: string | boolean) => void;
  onFileChange: (files: FileList | null) => void;
  fileNames?: string;
  disabled: boolean;
}

function FieldInput({ field, fieldId, value, onChange, onFileChange, fileNames, disabled }: FieldInputProps) {
  const type = normaliseType(field.type);
  const placeholder = field.placeholder ?? `Enter ${field.label.toLowerCase()}…`;

  const inputClass = `w-full bg-transparent border-0 border-b-2 border-[#c8b89a] focus:border-[#1a2744] outline-none py-2 px-0 text-[#1a1a2e] placeholder-[#a89880] text-sm transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed`;
  const textareaClass = `w-full bg-transparent border-2 border-[#c8b89a] rounded-lg focus:border-[#1a2744] outline-none py-2.5 px-3 text-[#1a1a2e] placeholder-[#a89880] text-sm transition-colors duration-200 disabled:opacity-50 resize-none mt-1`;
  const selectClass = `w-full bg-transparent border-0 border-b-2 border-[#c8b89a] focus:border-[#1a2744] outline-none py-2 px-0 text-[#1a1a2e] text-sm transition-colors duration-200 appearance-none cursor-pointer disabled:opacity-50`;

  switch (type) {
    case "text": case "email": case "number": case "date": case "tel":
      return (
        <input id={fieldId} type={type} placeholder={placeholder}
          value={String(value || "")} onChange={(e) => onChange(e.target.value)}
          className={inputClass} disabled={disabled} />
      );

    case "textarea":
      return (
        <textarea id={fieldId} placeholder={placeholder} rows={3}
          value={String(value || "")} onChange={(e) => onChange(e.target.value)}
          className={textareaClass} disabled={disabled} />
      );

    case "dropdown":
      return (
        <div className="relative">
          <select id={fieldId} value={String(value || "")}
            onChange={(e) => onChange(e.target.value)}
            className={selectClass} disabled={disabled}>
            <option value="">Select an option…</option>
            {field.options?.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          <ChevronRight className="absolute right-1 top-1/2 -translate-y-1/2 rotate-90 h-3.5 w-3.5 text-[#a89880] pointer-events-none" />
        </div>
      );

    case "radio":
      return (
        <div className="mt-2 flex flex-col gap-2.5">
          {field.options?.map((opt) => (
            <label key={opt} className="flex items-center gap-2.5 cursor-pointer group">
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors
                ${String(value) === opt ? "border-[#1a2744]" : "border-[#c8b89a] group-hover:border-[#1a2744]/50"}`}>
                {String(value) === opt && <div className="w-2 h-2 rounded-full bg-[#1a2744]" />}
              </div>
              <input type="radio" name={fieldId} value={opt}
                checked={String(value) === opt} onChange={() => onChange(opt)}
                className="sr-only" disabled={disabled} />
              <span className="text-sm text-[#1a1a2e]">{opt}</span>
            </label>
          ))}
        </div>
      );

    case "checkbox": {
      if (field.options && field.options.length > 0) {
        const selected = String(value || "").split(",").map((s) => s.trim()).filter(Boolean);
        const toggle = (opt: string) => {
          const next = selected.includes(opt) ? selected.filter((s) => s !== opt) : [...selected, opt];
          onChange(next.join(", "));
        };
        return (
          <div className="mt-2 flex flex-col gap-2.5">
            {field.options.map((opt) => (
              <label key={opt} onClick={() => !disabled && toggle(opt)} className="flex items-center gap-2.5 cursor-pointer group">
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors
                  ${selected.includes(opt) ? "border-[#1a2744] bg-[#1a2744]" : "border-[#c8b89a] group-hover:border-[#1a2744]/50"}`}>
                  {selected.includes(opt) && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className="text-sm text-[#1a1a2e]">{opt}</span>
              </label>
            ))}
          </div>
        );
      }
      return (
        <label onClick={() => !disabled && onChange(!value)} className="mt-2 flex items-center gap-2.5 cursor-pointer group">
          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors
            ${value ? "border-[#1a2744] bg-[#1a2744]" : "border-[#c8b89a] group-hover:border-[#1a2744]/50"}`}>
            {value && (
              <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <span className="text-sm text-[#1a1a2e]">{field.label}</span>
          {field.required && <span className="text-rose-400 text-xs ml-0.5">*</span>}
        </label>
      );
    }

    case "file":
      return (
        <label className={`mt-1 flex items-center gap-3 border-2 border-dashed border-[#c8b89a] rounded-lg px-4 py-3 cursor-pointer hover:border-[#1a2744]/50 transition-colors ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}>
          <Upload className="h-4 w-4 text-[#a89880] shrink-0" />
          <span className="text-sm text-[#a89880]">{fileNames || "Click to upload a file…"}</span>
          <input type="file" className="sr-only" onChange={(e) => onFileChange(e.target.files)} disabled={disabled} />
        </label>
      );

    default: return null;
  }
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function FormFillPage() {
  const params = useParams<{ formId: string }>();
  const router = useRouter();
  const { data: session } = useSession();

  // Verifiers/admins cannot submit forms
  const isVerifierOrAdmin = session?.user?.portal === "verifier" || session?.user?.portal === "admin";

  const [form, setForm] = useState<FormDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string | boolean>>({});
  const [files, setFiles] = useState<Record<string, File[]>>({});
  const [signatureMode, setSignatureMode] = useState<"draw" | "upload" | null>(null);
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    if (!params.formId) return;
    const fetchForm = async () => {
      try {
        setLoading(true); setError(null);
        const res = await fetch(`/api/form/getForm/${params.formId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message ?? `Error ${res.status}`);
        setForm(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally { setLoading(false); }
    };
    fetchForm();
  }, [params.formId]);

  const updateField = (key: string, value: string | boolean) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  const handleFileChange = (key: string, fileList: FileList | null) => {
    if (!fileList) return;
    setFiles((prev) => ({ ...prev, [key]: Array.from(fileList) }));
  };

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const ctx = canvasRef.current?.getContext("2d");
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!ctx || !rect) return;
    ctx.beginPath(); ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };
  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext("2d");
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!ctx || !rect) return;
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.strokeStyle = "#1a2744"; ctx.lineWidth = 1.5; ctx.stroke();
  };
  const stopDraw = () => setIsDrawing(false);
  const clearCanvas = () => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx && canvasRef.current) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  const handleSubmit = async () => {
    if (!form) return;
    const missing = form.formFields
      .filter((f, i) => {
        if (!f.required) return false;
        const key = fieldKey(f, i);
        if (f.type === "file") return !files[key]?.length;
        const val = formData[key];
        if (typeof val === "boolean") return !val;
        return !String(val || "").trim();
      })
      .map((f) => f.label);

    if (missing.length > 0) { toast.error(`Please fill in: ${missing.join(", ")}`); return; }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("formId", String(form.id));
      const enrichedFields: Record<string, { label: string; value: string | boolean }> = {};
      for (let i = 0; i < form.formFields.length; i++) {
        const field = form.formFields[i];
        if (field.type !== "file") {
          const key = fieldKey(field, i);
          enrichedFields[key] = { label: field.label, value: formData[key] ?? "" };
        }
      }
      fd.append("fields", JSON.stringify(enrichedFields));
      for (const [key, fileList] of Object.entries(files)) {
        if (fileList.length > 0) fd.append(`file_${key}`, fileList[0]);
      }
      if (signatureMode === "upload" && signatureFile) {
        fd.append("signature", signatureFile);
      } else if (signatureMode === "draw" && canvasRef.current) {
        await new Promise<void>((resolve) => {
          canvasRef.current!.toBlob((blob) => {
            if (blob) fd.append("signature", blob, "signature.png");
            resolve();
          }, "image/png");
        });
      }
      const res = await fetch("/api/form/submitForm", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Submission failed");
      toast.success("Form submitted successfully!");
      router.push("/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Submission failed. Please try again.");
    } finally { setSubmitting(false); }
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf7f2] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-2 border-[#1a2744] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-[#6b5e4e] italic">Loading form…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#faf7f2] flex items-center justify-center">
        <div className="text-center space-y-4 max-w-sm px-4">
          <AlertCircle className="h-10 w-10 text-rose-400 mx-auto" />
          <p className="text-[#1a1a2e]">{error}</p>
          <button onClick={() => router.back()} className="text-sm text-[#1a2744] underline underline-offset-2">Go back</button>
        </div>
      </div>
    );
  }

  if (!form) return null;

  const deadline = formatDeadline(form.deadline);
  const isLocked = deadline.isExpired || !form.formStatus || isVerifierOrAdmin;

  // ── Preview ───────────────────────────────────────────────────────────────
  if (showPreview) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="w-full bg-[#faf7f2] py-6 px-6"
        style={{ fontFamily: "'Crimson Text', Georgia, serif" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,600;1,400&family=Playfair+Display:wght@600;700&display=swap');`}</style>
        <div className="w-full">
          <button onClick={() => setShowPreview(false)}
            className="mb-6 flex items-center gap-2 text-sm text-[#6b5e4e] hover:text-[#1a2744] transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to edit
          </button>
          <div className="bg-white shadow-[0_4px_40px_rgba(0,0,0,0.08)] rounded-sm border border-[#e8dfd0]">
            <div className="border-b border-[#e8dfd0] p-8">
              <div className="flex items-center gap-4">

                {/* Logo */}
                <img src="/logo.png" alt="IIT Ropar Logo" className="m-5 w-24 object-contain" />

                {/* Header Content */}
                <div className="flex-1 text-center space-y-1 ">


                  <h2 className="text-lg font-bold text-[#1a2744] font-['Playfair_Display',_serif]">
                    Indian Institute of Technology Ropar
                  </h2>
                  <p className="text-sm text-[#6b5e4e]">रूपनगर, पंजाब – 140001</p>
                  <p className="mt-2 text-base font-semibold text-[#1a1a2e] font-['Playfair_Display',_serif]">
                    {form.title}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-8 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {form.formFields.map((field, index) => {
                  const key = fieldKey(field, index);
                  const type = normaliseType(field.type);
                  const displayValue = type === "file"
                    ? files[key]?.map((f) => f.name).join(", ") || "—"
                    : type === "checkbox" && typeof formData[key] === "boolean"
                      ? formData[key] ? "Yes" : "No"
                      : String(formData[key] || "—");
                  return (
                    <div key={key} className={["textarea", "radio", "checkbox"].includes(type) ? "sm:col-span-2" : ""}>
                      <p className="text-[10px] uppercase tracking-widest text-[#a89880] mb-1">{field.label}</p>
                      <p className="text-sm text-[#1a1a2e] border-b border-dotted border-[#c8b89a] pb-1.5 min-h-[1.5rem]">{displayValue}</p>
                    </div>
                  );
                })}
              </div>
              {form.verifiersList.length > 0 && (
                <div className="pt-4 border-t border-[#e8dfd0]">
                  <p className="text-[10px] uppercase tracking-widest text-[#a89880] mb-3">Approval Chain</p>
                  <div className="flex flex-wrap items-center gap-2">
                    {form.verifiersList.map((v, i) => (
                      <div key={v.level} className="flex items-center gap-2">
                        <div className="bg-[#f5f0e8] border border-[#e8dfd0] rounded px-2.5 py-1.5 text-xs">
                          <span className="text-[#1a2744] font-semibold">L{v.level}</span>
                          <span className="text-[#6b5e4e] mx-1">·</span>
                          <span>{v.verifier.userName}</span>
                        </div>
                        {i < form.verifiersList.length - 1 && <ChevronRight className="h-3 w-3 text-[#c8b89a]" />}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="pt-4 border-t border-[#e8dfd0] flex justify-end">
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-widest text-[#a89880] mb-1">Signature</p>
                  <p className="text-sm">
                    {signatureMode === "draw" ? "✔ Drawn" : signatureMode === "upload" ? `✔ ${signatureFile?.name ?? "Uploaded"}` : "Not provided"}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-5 flex gap-3">
            <button onClick={() => setShowPreview(false)}
              className="flex-1 py-2.5 border-2 border-[#c8b89a] text-[#6b5e4e] text-sm rounded hover:border-[#1a2744] hover:text-[#1a2744] transition-colors">
              Edit Form
            </button>
            <button onClick={handleSubmit} disabled={submitting}
              className="flex-1 py-2.5 bg-[#1a2744] text-[#f5f0e8] text-sm rounded hover:bg-[#243660] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Confirm & Submit
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // ── Main Form ─────────────────────────────────────────────────────────────
  return (
    <div className="w-full bg-[#faf7f2]" style={{ fontFamily: "'Crimson Text', Georgia, serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,600;1,400&family=Playfair+Display:wght@600;700&display=swap');`}</style>

      <div className="w-full py-6 px-6">
        <motion.button initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-1.5 text-sm text-[#6b5e4e] hover:text-[#1a2744] transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back
        </motion.button>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="bg-white shadow-[0_4px_40px_rgba(0,0,0,0.06)] rounded-sm border border-[#e8dfd0] overflow-hidden">

          {/* Letterhead */}
          <div className="bg-[#1a2744] px-8 py-7 text-center relative">

            {/* Logo (positioned without affecting layout) */}
            <img 
    src="/logo.png" 
    alt="IIT Ropar Logo" 
    className="absolute left-6 top-6  w-24 object-contain bg-white p-1 rounded-md"
  />

            <div className="absolute inset-x-0 bottom-0 h-px bg-[#c8b89a] opacity-40 align-middle" />

            <h1 className="text-xl font-bold text-white font-['Playfair_Display',_serif]">
              Indian Institute of Technology Ropar
            </h1>

            <p className="text-xs text-[#a89880] mt-1">
              रूपनगर, पंजाब – 140001
            </p>

            <div className="mt-4 h-px bg-[#c8b89a] opacity-25 mx-24" />

            <h2 className="mt-3 text-base font-semibold text-[#e8dfd0] font-['Playfair_Display',_serif]">
              {form.title}
            </h2>
          </div>

          {/* Meta bar */}
          <div className="bg-[#f5f0e8] border-b border-[#e8dfd0] px-8 py-3 flex flex-wrap items-center justify-between gap-2">
            <div className={`flex items-center gap-1.5 text-xs ${deadline.isExpired ? "text-rose-500" : deadline.isExpiringSoon ? "text-amber-600" : "text-[#6b5e4e]"}`}>
              <Clock className="h-3.5 w-3.5" />
              {deadline.isExpired ? `Deadline passed · ${deadline.label}` : deadline.isExpiringSoon ? `Closing soon · ${deadline.label}` : `Due ${deadline.label}`}
            </div>
            <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${isLocked ? "border-rose-200 bg-rose-50 text-rose-600" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
              {isLocked ? "Closed" : "Accepting Submissions"}
            </span>
          </div>

          {/* Locked banner */}
          {isLocked && (
            <div className="mx-8 mt-5 bg-rose-50 border border-rose-200 rounded px-4 py-3 flex items-center gap-2 text-sm text-rose-600">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {!form.formStatus ? "This form is currently inactive." : "This form is closed."}
            </div>
          )}

          {/* Description */}
          {form.description && (
            <div className="px-8 pt-6">
              <p className="text-sm text-[#6b5e4e] italic leading-relaxed border-l-2 border-[#c8b89a] pl-3">{form.description}</p>
            </div>
          )}

          {/* Approval chain */}
          {form.verifiersList.length > 0 && (
            <div className="px-8 pt-6">
              <p className="text-[10px] uppercase tracking-widest text-[#a89880] mb-3 flex items-center gap-1.5">
                <CheckCircle className="h-3 w-3" /> Approval Workflow
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {form.verifiersList.map((v, i) => (
                  <div key={v.level} className="flex items-center gap-2">
                    <div className="flex items-center gap-2 bg-[#f5f0e8] border border-[#e8dfd0] rounded px-3 py-1.5">
                      <span className="text-[10px] font-bold text-[#1a2744] uppercase tracking-wider">L{v.level}</span>
                      <div className="w-px h-3 bg-[#c8b89a]" />
                      <div>
                        <p className="text-xs font-semibold text-[#1a1a2e] leading-none">{v.verifier.userName}</p>
                        <p className="text-[10px] text-[#a89880] mt-0.5">{v.verifier.role} · {v.verifier.department}</p>
                      </div>
                    </div>
                    {i < form.verifiersList.length - 1 && <ChevronRight className="h-3.5 w-3.5 text-[#c8b89a] shrink-0" />}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Form fields */}
          <div className="px-8 py-7">
            <div className="flex items-center gap-3 mb-6">
              <p className="text-[10px] uppercase tracking-widest text-[#a89880] whitespace-nowrap">Application Details</p>
              <div className="flex-1 h-px bg-[#e8dfd0]" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-6">
              {form.formFields.map((field, index) => {
                const key = fieldKey(field, index);
                const type = normaliseType(field.type);
                const hideTopLabel = type === "checkbox" && (!field.options || field.options.length === 0);
                // Wide fields span full row
                const isWide = ["textarea", "radio", "checkbox", "file"].includes(type);
                return (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}
                    className={isWide ? "md:col-span-2 xl:col-span-3" : ""}
                  >
                    {!hideTopLabel && (
                      <label htmlFor={key} className="block text-[11px] uppercase tracking-widest text-[#a89880] mb-1.5">
                        {field.label}{field.required && <span className="text-rose-400 ml-1">*</span>}
                      </label>
                    )}
                    <FieldInput field={field} fieldId={key} value={formData[key] ?? ""}
                      onChange={(val) => updateField(key, val)}
                      onFileChange={(fl) => handleFileChange(key, fl)}
                      fileNames={files[key]?.map((f) => f.name).join(", ")}
                      disabled={isLocked} />
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Signature */}
          <div className="px-8 pb-7">
            <div className="flex items-center gap-3 mb-4">
              <p className="text-[10px] uppercase tracking-widest text-[#a89880] flex items-center gap-1.5 whitespace-nowrap">
                <Pen className="h-3 w-3" /> Signature
              </p>
              <div className="flex-1 h-px bg-[#e8dfd0]" />
            </div>
            <div className="max-w-lg">
              <div className="flex gap-2 mb-4">
                {(["draw", "upload"] as const).map((mode) => (
                  <button key={mode} onClick={() => setSignatureMode(mode)} disabled={isLocked}
                    className={`px-4 py-1.5 text-xs rounded border transition-colors ${signatureMode === mode ? "bg-[#1a2744] border-[#1a2744] text-white" : "border-[#c8b89a] text-[#6b5e4e] hover:border-[#1a2744] hover:text-[#1a2744]"} disabled:opacity-40`}>
                    {mode === "draw" ? "Draw" : "Upload"}
                  </button>
                ))}
              </div>
              <AnimatePresence mode="wait">
                {signatureMode === "draw" && (
                  <motion.div key="draw" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                    <canvas ref={canvasRef} width={500} height={140}
                      className="w-full rounded border-2 border-dashed border-[#c8b89a] bg-[#faf7f2] cursor-crosshair"
                      onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw} />
                    <button onClick={clearCanvas} className="mt-2 text-xs text-[#a89880] hover:text-rose-500 transition-colors">Clear</button>
                  </motion.div>
                )}
                {signatureMode === "upload" && (
                  <motion.div key="upload" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                    <label className="flex items-center gap-3 border-2 border-dashed border-[#c8b89a] rounded px-4 py-3 cursor-pointer hover:border-[#1a2744] transition-colors">
                      <Upload className="h-4 w-4 text-[#a89880]" />
                      <span className="text-sm text-[#a89880]">{signatureFile ? signatureFile.name : "Upload signature image (.png, .jpg)"}</span>
                      <input type="file" accept=".png,.jpg,.jpeg" className="sr-only" onChange={(e) => setSignatureFile(e.target.files?.[0] || null)} />
                    </label>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-[#f5f0e8] border-t border-[#e8dfd0] px-8 py-5 flex gap-3">
            <button onClick={() => setShowPreview(true)} disabled={isLocked}
              className="flex items-center gap-2 px-5 py-2.5 border-2 border-[#c8b89a] text-[#6b5e4e] text-sm rounded hover:border-[#1a2744] hover:text-[#1a2744] transition-colors disabled:opacity-40">
              <Eye className="h-4 w-4" /> Preview
            </button>
            <button onClick={handleSubmit} disabled={submitting || isLocked}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#1a2744] text-[#f5f0e8] text-sm rounded hover:bg-[#243660] active:bg-[#111d38] transition-colors disabled:opacity-40">
              {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>
                : isLocked ? "Form Closed"
                  : <><Send className="h-4 w-4" /> Submit Application</>}
            </button>
          </div>
        </motion.div>

        <p className="mt-4 text-center text-[11px] text-[#c8b89a]">
          IIT Ropar · Official Form Portal · Fields marked <span className="text-rose-400">*</span> are required
        </p>
      </div>
    </div>
  );
}
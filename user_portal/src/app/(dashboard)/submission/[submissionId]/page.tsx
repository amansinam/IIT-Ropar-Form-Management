"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, ArrowLeft, FileText, User2, Calendar,
  CheckCircle2, Clock, XCircle, AlertCircle, RotateCcw,
  Send, Upload, Pen, Eye,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface WorkflowStep {
  level: number;
  verifierId: string | null;
  verifierName: string;
  role: string;
  department: string;
  status: "Completed" | "Current" | "Pending" | "SentBack";
  actionStatus: string | null;
  remark: string | null;
  date: string | null;
}

interface FormField { label: string; value: string; type: string; }

interface SubmissionDetail {
  submission: { id: string; status: string; overallStatus: string; currentLevel: number; totalLevels: number; submissionDate: string; };
  student: { id: string; name: string; email: string; };
  form: {
    id: number; title: string; description: string; deadline: string;
    isExpired: boolean; isClosedForUser: boolean;
    formFields?: Array<{ id: string; label: string; type: string; required?: boolean; placeholder?: string; options?: string[]; }>;
  };
  fields: FormField[];
  workflow: WorkflowStep[];
}

function getStatusColor(status: string) {
  const m: Record<string,string> = {
    Accepted: "bg-emerald-100 text-emerald-700 border-emerald-200",
    Pending:  "bg-amber-100 text-amber-700 border-amber-200",
    Rejected: "bg-rose-100 text-rose-700 border-rose-200",
    Expired:  "bg-slate-100 text-slate-700 border-slate-200",
    SentBack: "bg-orange-100 text-orange-700 border-orange-200",
  };
  return m[status] ?? "bg-blue-100 text-blue-700 border-blue-200";
}

function getStatusIcon(status: string) {
  switch (status) {
    case "Accepted":  return <CheckCircle2 className="h-5 w-5" />;
    case "Pending":   return <Clock className="h-5 w-5" />;
    case "Rejected":  return <XCircle className="h-5 w-5" />;
    case "Expired":   return <AlertCircle className="h-5 w-5" />;
    case "SentBack":  return <RotateCcw className="h-5 w-5" />;
    default: return null;
  }
}

function getStepBadgeClass(status: string, actionStatus: string | null) {
  if (status === "SentBack")   return "bg-orange-100 text-orange-700 border-orange-200";
  if (status === "Completed")  return actionStatus === "Rejected" ? "bg-rose-100 text-rose-700 border-rose-200" : "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (status === "Current")    return "bg-indigo-100 text-indigo-700 border-indigo-200";
  return "bg-slate-100 text-slate-600 border-slate-200";
}

function getCircleClass(status: string, actionStatus: string | null) {
  if (status === "SentBack")   return "bg-orange-100 border-orange-300 text-orange-700";
  if (status === "Completed")  return actionStatus === "Rejected" ? "bg-rose-100 border-rose-300 text-rose-700" : "bg-emerald-100 border-emerald-300 text-emerald-700";
  if (status === "Current")    return "bg-indigo-100 border-indigo-300 text-indigo-700";
  return "bg-slate-100 border-slate-300 text-slate-600";
}

// Simple inline field input for edit mode
function EditInput({ field, value, onChange, onFile, fileNames }: {
  field: { type: string; label: string; placeholder?: string; options?: string[] };
  value: string;
  onChange: (v: string) => void;
  onFile: (f: FileList|null) => void;
  fileNames?: string;
}) {
  const cls = "w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400";
  const t = field.type === "select" ? "dropdown" : field.type;
  if (t === "textarea") return <textarea rows={3} value={value} onChange={e=>onChange(e.target.value)} placeholder={field.placeholder} className={`${cls} resize-none`} />;
  if (t === "dropdown") return (
    <select value={value} onChange={e=>onChange(e.target.value)} className={cls}>
      <option value="">Select…</option>
      {field.options?.map(o=><option key={o} value={o}>{o}</option>)}
    </select>
  );
  if (t === "radio") return (
    <div className="flex flex-col gap-2">{field.options?.map(o=>(
      <label key={o} className="flex items-center gap-2 text-sm cursor-pointer">
        <input type="radio" checked={value===o} onChange={()=>onChange(o)} />{o}
      </label>
    ))}</div>
  );
  if (t === "file") return (
    <label className="flex items-center gap-3 border-2 border-dashed rounded-lg px-4 py-3 cursor-pointer hover:border-indigo-400">
      <Upload className="h-4 w-4 text-slate-400 shrink-0"/>
      <span className="text-sm text-slate-400">{fileNames||"Click to upload…"}</span>
      <input type="file" className="sr-only" onChange={e=>onFile(e.target.files)}/>
    </label>
  );
  return <input type={t==="dropdown"?"text":t} value={value} onChange={e=>onChange(e.target.value)} placeholder={field.placeholder} className={cls}/>;
}

export default function SubmissionDetailPage() {
  const params = useParams<{ submissionId: string }>();
  const router = useRouter();

  const [data, setData] = useState<SubmissionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editMode, setEditMode] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<Record<string, File[]>>({});
  const [signatureMode, setSignatureMode] = useState<"draw"|"upload"|null>(null);
  const [signatureFile, setSignatureFile] = useState<File|null>(null);
  const [submitting, setSubmitting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const formatDate = (d: string) => {
    try { return new Date(d).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" }); }
    catch { return d; }
  };

  useEffect(() => {
    if (!params.submissionId) return;
    (async () => {
      try {
        const res = await fetch(`/api/submissions/${params.submissionId}`);
        if (!res.ok) throw new Error(`Error: ${res.status}`);
        const resp = await res.json();
        setData(resp);
        // Pre-fill from existing fields
        const pre: Record<string,string> = {};
        resp.fields?.forEach((f: FormField, i: number) => {
          pre[`field-${i}`] = f.value === "—" ? "" : f.value;
        });
        setFormData(pre);
      } catch(e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally { setLoading(false); }
    })();
  }, [params.submissionId]);

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const ctx = canvasRef.current?.getContext("2d");
    const r = canvasRef.current?.getBoundingClientRect();
    if (!ctx||!r) return;
    ctx.beginPath(); ctx.moveTo(e.clientX-r.left, e.clientY-r.top);
  };
  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext("2d");
    const r = canvasRef.current?.getBoundingClientRect();
    if (!ctx||!r) return;
    ctx.lineTo(e.clientX-r.left, e.clientY-r.top);
    ctx.strokeStyle="#1a2744"; ctx.lineWidth=1.5; ctx.stroke();
  };

  const handleResubmit = async () => {
    if (!data) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("submissionId", data.submission.id);
      const enriched: Record<string, { label: string; value: string }> = {};
      const fields = data.form.formFields ?? data.fields.map((f,i)=>({id:`field-${i}`,label:f.label,type:f.type}));
      fields.forEach((field, i) => {
        if (field.type !== "file") enriched[`field-${i}`] = { label: field.label, value: formData[`field-${i}`] ?? "" };
      });
      fd.append("fields", JSON.stringify(enriched));
      for (const [k,fl] of Object.entries(files)) { if (fl.length>0) fd.append(`file_${k}`, fl[0]); }
      if (signatureMode==="upload"&&signatureFile) fd.append("signature", signatureFile);
      else if (signatureMode==="draw"&&canvasRef.current) {
        await new Promise<void>(res => {
          canvasRef.current!.toBlob(blob => { if(blob) fd.append("signature",blob,"sig.png"); res(); }, "image/png");
        });
      }
      const res = await fetch("/api/submissions/resubmit", { method: "POST", body: fd });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message ?? "Resubmit failed");
      toast.success("Form resubmitted successfully!");
      router.push("/dashboard");
    } catch(e) {
      toast.error(e instanceof Error ? e.message : "Resubmit failed.");
    } finally { setSubmitting(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto"/>
        <p className="text-muted-foreground">Loading submission details…</p>
      </div>
    </div>
  );

  if (error||!data) return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} className="space-y-4">
      <Button variant="outline" size="icon" onClick={()=>router.back()} className="rounded-xl"><ArrowLeft className="h-5 w-5"/></Button>
      <Card className="border-rose-200 bg-rose-50"><CardContent className="pt-6"><p className="text-rose-700 font-semibold">{error||"Submission not found"}</p></CardContent></Card>
    </motion.div>
  );

  const isSentBack = data.submission.status === "SentBack";
  const canEdit = isSentBack && !data.form.isExpired;
  const sentBackRemarks = data.workflow.filter(s => s.status === "SentBack" && s.remark);

  // ── Edit mode ──
  if (editMode) {
    const fields = data.form.formFields ?? data.fields.map((f,i)=>({id:`field-${i}`,label:f.label,type:f.type,required:false,placeholder:"",options:undefined as string[]|undefined}));

    if (showPreview) return (
      <motion.div initial={{opacity:0}} animate={{opacity:1}} className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={()=>setShowPreview(false)} className="rounded-xl"><ArrowLeft className="h-5 w-5"/></Button>
          <h1 className="font-bold text-2xl">Preview — {data.form.title}</h1>
        </div>
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-indigo-600 text-white rounded-t-lg">
            <h2 className="font-bold text-lg">Indian Institute of Technology Ropar</h2>
            <p className="text-white/70 text-sm">{data.form.title}</p>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fields.map((field,i)=>(
                <div key={i} className="p-3 rounded-lg bg-slate-50 border space-y-1">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{field.label}</p>
                  <p className="text-sm font-medium">{formData[`field-${i}`]||"—"}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex gap-3">
              <Button variant="outline" onClick={()=>setShowPreview(false)} className="flex-1">Edit</Button>
              <Button onClick={handleResubmit} disabled={submitting} className="flex-1 bg-indigo-600 hover:bg-indigo-700">
                {submitting?<><Loader2 className="h-4 w-4 animate-spin mr-2"/>Submitting…</>:<><Send className="h-4 w-4 mr-2"/>Confirm & Resubmit</>}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );

    return (
      <motion.div initial={{opacity:0}} animate={{opacity:1}} className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={()=>setEditMode(false)} className="rounded-xl"><ArrowLeft className="h-5 w-5"/></Button>
          <div>
            <h1 className="font-bold text-2xl">Edit & Resubmit — {data.form.title}</h1>
            <p className="text-sm text-muted-foreground">Make your changes and resubmit.</p>
          </div>
        </div>

        {sentBackRemarks.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4 text-orange-500"/>
              <p className="font-semibold text-orange-800 text-sm">Verifier Notes</p>
            </div>
            {sentBackRemarks.map((step,i)=>(
              <div key={i} className="bg-white border border-orange-200 rounded-lg p-3">
                <p className="text-xs font-semibold text-orange-600">{step.verifierName} (Level {step.level}):</p>
                <p className="text-sm text-orange-800 mt-0.5">{step.remark?.replace(/^\[SENT BACK\]\s*/i,"")}</p>
              </div>
            ))}
          </div>
        )}

        <Card className="shadow-md border-0">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-violet-50 border-b">
            <CardTitle className="text-base">Form Fields</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {fields.map((field,i)=>(
                <div key={i} className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                    {field.label}{field.required&&<span className="text-rose-400 ml-1">*</span>}
                  </label>
                  <EditInput
                    field={field} value={formData[`field-${i}`]??""} 
                    onChange={v=>setFormData(p=>({...p,[`field-${i}`]:v}))}
                    onFile={fl=>{if(fl)setFiles(p=>({...p,[`field-${i}`]:Array.from(fl)}))}}
                    fileNames={files[`field-${i}`]?.map(f=>f.name).join(", ")}
                  />
                </div>
              ))}
            </div>

            {/* Signature */}
            <div className="mt-6 pt-6 border-t">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Pen className="h-3 w-3"/> Signature
              </p>
              <div className="flex gap-2 mb-4">
                {(["draw","upload"] as const).map(m=>(
                  <button key={m} onClick={()=>setSignatureMode(m)}
                    className={`px-4 py-1.5 text-xs rounded border transition-colors ${signatureMode===m?"bg-indigo-600 border-indigo-600 text-white":"border-slate-300 text-slate-600 hover:border-indigo-400"}`}>
                    {m==="draw"?"Draw":"Upload"}
                  </button>
                ))}
              </div>
              <AnimatePresence mode="wait">
                {signatureMode==="draw"&&(
                  <motion.div key="draw" initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}} exit={{opacity:0,height:0}}>
                    <canvas ref={canvasRef} width={500} height={120}
                      className="w-full rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 cursor-crosshair"
                      onMouseDown={startDraw} onMouseMove={draw} onMouseUp={()=>setIsDrawing(false)} onMouseLeave={()=>setIsDrawing(false)}/>
                    <button onClick={()=>{const ctx=canvasRef.current?.getContext("2d");if(ctx&&canvasRef.current)ctx.clearRect(0,0,canvasRef.current.width,canvasRef.current.height);}} className="mt-1 text-xs text-slate-400 hover:text-rose-500">Clear</button>
                  </motion.div>
                )}
                {signatureMode==="upload"&&(
                  <motion.div key="upload" initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}} exit={{opacity:0,height:0}}>
                    <label className="flex items-center gap-3 border-2 border-dashed border-slate-300 rounded-lg px-4 py-3 cursor-pointer hover:border-indigo-400">
                      <Upload className="h-4 w-4 text-slate-400"/>
                      <span className="text-sm text-slate-400">{signatureFile?signatureFile.name:"Upload signature (.png, .jpg)"}</span>
                      <input type="file" accept=".png,.jpg,.jpeg" className="sr-only" onChange={e=>setSignatureFile(e.target.files?.[0]||null)}/>
                    </label>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex gap-3 mt-6 pt-6 border-t">
              <Button variant="outline" onClick={()=>setShowPreview(true)} className="flex items-center gap-2">
                <Eye className="h-4 w-4"/> Preview
              </Button>
              <Button onClick={handleResubmit} disabled={submitting} className="flex-1 bg-indigo-600 hover:bg-indigo-700">
                {submitting?<><Loader2 className="h-4 w-4 animate-spin mr-2"/>Submitting…</>:<><Send className="h-4 w-4 mr-2"/>Resubmit Form</>}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // ── View mode ──
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={()=>router.back()} className="rounded-xl"><ArrowLeft className="h-5 w-5"/></Button>
          <div>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-600"/>
              <h1 className="font-heading text-3xl font-bold text-slate-900">{data.form.title}</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Submission ID: {data.submission.id}</p>
          </div>
        </div>
        <Badge className={`${getStatusColor(data.submission.status)} border text-base px-4 py-2 font-semibold flex items-center gap-2`}>
          {getStatusIcon(data.submission.status)}
          {data.submission.status === "SentBack" ? "Sent Back" : data.submission.status}
        </Badge>
      </div>

      {/* SentBack banner */}
      {isSentBack && (
        <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}}
          className="rounded-2xl border border-orange-200 bg-orange-50 p-5 flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <RotateCcw className="h-6 w-6 text-orange-500 shrink-0 mt-0.5"/>
            <div className="space-y-2">
              <p className="font-bold text-orange-800 text-base">Action Required — Form Sent Back</p>
              <p className="text-orange-700 text-sm">
                {data.form.isExpired
                  ? "The deadline has passed. You cannot resubmit this form."
                  : "A verifier has sent this form back. Please review the notes and edit & resubmit."}
              </p>
              {sentBackRemarks.map((step,i)=>(
                <div key={i} className="bg-white border border-orange-200 rounded-lg p-3">
                  <p className="text-xs font-semibold text-orange-600">{step.verifierName} (Level {step.level}):</p>
                  <p className="text-sm text-orange-800 mt-0.5">{step.remark?.replace(/^\[SENT BACK\]\s*/i,"")}</p>
                </div>
              ))}
            </div>
          </div>
          {canEdit && (
            <Button onClick={()=>setEditMode(true)} className="bg-orange-500 hover:bg-orange-600 text-white whitespace-nowrap shrink-0">
              <Pen className="h-4 w-4 mr-2"/> Edit & Resubmit
            </Button>
          )}
        </motion.div>
      )}

      {/* Workflow */}
      <Card className="shadow-card border-0 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-violet-50 border-b">
          <CardTitle className="font-heading text-base flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-indigo-600"/> Verification Workflow
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {data.workflow.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No workflow steps</p>
          ) : (
            <div className="space-y-4">
              {data.workflow.map((step, index) => (
                <motion.div key={step.level} initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} transition={{delay:index*0.1}} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`h-10 w-10 rounded-full border-2 flex items-center justify-center font-semibold text-sm ${getCircleClass(step.status,step.actionStatus)}`}>
                      {step.status==="Completed"&&step.actionStatus==="Approved"?"✓":
                       step.status==="Completed"&&step.actionStatus==="Rejected"?"✗":
                       step.status==="SentBack"?"↩":step.level}
                    </div>
                    {index!==data.workflow.length-1&&(
                      <div className={`w-1 h-12 mt-1 ${step.status==="Completed"&&step.actionStatus!=="Rejected"?"bg-emerald-300":step.status==="SentBack"?"bg-orange-300":"bg-slate-200"}`}/>
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="rounded-lg border border-slate-200 bg-white p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold text-slate-900">{step.verifierName}</p>
                          <p className="text-xs text-muted-foreground">{step.role}{step.department&&` • ${step.department}`}</p>
                        </div>
                        <Badge className={`text-xs font-semibold border ${getStepBadgeClass(step.status,step.actionStatus)}`}>
                          {step.status==="Current"&&"In Review"}
                          {step.status==="Pending"&&"Waiting"}
                          {step.status==="SentBack"&&"Sent Back"}
                          {step.status==="Completed"&&(step.actionStatus==="Approved"?"Approved":step.actionStatus==="Rejected"?"Rejected":"Done")}
                        </Badge>
                      </div>
                      {step.date&&<p className="text-xs text-muted-foreground mb-2">{formatDate(step.date)}</p>}
                      {step.remark&&(
                        <div className={`mt-3 rounded p-3 border ${step.status==="SentBack"?"bg-orange-50 border-orange-200":"bg-slate-50 border-slate-200"}`}>
                          <p className="text-xs font-semibold text-muted-foreground mb-1">{step.status==="SentBack"?"Reason for sending back:":"Remark:"}</p>
                          <p className="text-sm text-slate-700">{step.remark.replace(/^\[SENT BACK\]\s*/i,"")}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Student node at bottom if sent back to them */}
              {isSentBack&&(
                <motion.div initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} transition={{delay:data.workflow.length*0.1}} className="flex gap-4">
                  <div className="h-10 w-10 rounded-full border-2 border-dashed border-orange-300 bg-orange-50 flex items-center justify-center">
                    <User2 className="h-4 w-4 text-orange-500"/>
                  </div>
                  <div className="flex-1">
                    <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
                      <p className="font-semibold text-orange-800 text-sm">You (Student) — Current</p>
                      <p className="text-xs text-orange-600 mt-1">
                        {canEdit?"Please edit and resubmit the form.":"Deadline passed — cannot resubmit."}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submitted By */}
      <Card className="shadow-card border-0 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b">
          <CardTitle className="font-heading text-base flex items-center gap-2">
            <User2 className="h-4 w-4 text-blue-600"/> Submitted By
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div><p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name</p><p className="text-sm font-medium text-slate-900 mt-1">{data.student.name}</p></div>
              <div><p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</p><p className="text-sm text-slate-700 mt-1">{data.student.email}</p></div>
            </div>
            <div className="space-y-4">
              <div><p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Submission Date</p><p className="text-sm font-medium text-slate-900 mt-1">{formatDate(data.submission.submissionDate)}</p></div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Deadline</p>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-amber-600"/>
                  <p className={`text-sm font-medium ${data.form.isExpired?"text-rose-600":"text-slate-900"}`}>{formatDate(data.form.deadline)}</p>
                  {data.form.isExpired&&<Badge className="bg-rose-100 text-rose-700 border-rose-200 text-xs">Expired</Badge>}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Data */}
      <Card className="shadow-card border-0 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="font-heading text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-purple-600"/> Form Data
            </CardTitle>
            {canEdit&&(
              <Button size="sm" onClick={()=>setEditMode(true)} className="bg-orange-500 hover:bg-orange-600 text-white text-xs">
                <Pen className="h-3.5 w-3.5 mr-1.5"/> Edit & Resubmit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {data.fields.length===0?(
            <p className="text-sm text-muted-foreground text-center py-8">No form data available</p>
          ):(
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {data.fields.map((field,index)=>(
                <motion.div key={index} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:index*0.05}}
                  className="space-y-2 p-4 rounded-lg border border-slate-200 bg-slate-50">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{field.label}</p>
                  <p className="text-sm font-medium text-slate-900 break-words">{field.value||"—"}</p>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

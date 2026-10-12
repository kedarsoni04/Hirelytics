"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowUpDown,
  UserCheck,
  UserX,
  ChevronRight,
  Sparkles,
  SlidersHorizontal,
  ArrowUp,
  ArrowDown,
  Loader2,
  AlertCircle,
  ClipboardCheck,
  Plus,
  Trash2,
  X,
  Upload,
  FileSpreadsheet,
  FileText,
  Check,
  HelpCircle,
  Calendar,
  Clock,
  Timer,
  ShieldAlert,
  UserMinus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { dispatchNotificationsUpdated } from "@/lib/use-unread-count";

// ── Stage config ──────────────────────────────────────────────────────────────

const stageConfig: Record<string, { label: string; bg: string; color: string }> = {
  applied:         { label: "Applied",         bg: "#F1F5F9", color: "#475569" },
  resume_screened: { label: "Resume Screened", bg: "#EDE9FE", color: "#5B21B6" },
  assessment:      { label: "Assessment",      bg: "#DBEAFE", color: "#1E40AF" },
  ai_interview:    { label: "AI Interview",    bg: "#FEF3C7", color: "#92400E" },
  shortlisted:     { label: "Shortlisted",     bg: "#D1FAE5", color: "#065F46" },
  hr_round:        { label: "HR Round",        bg: "#E0E7FF", color: "#3730A3" },
  offered:         { label: "Offered",         bg: "#D1FAE5", color: "#065F46" },
  hired:           { label: "Hired",           bg: "#CCFBF1", color: "#115E59" },
  rejected:        { label: "Rejected",        bg: "#FFE4E6", color: "#9F1239" },
};

function StageBadge({ stage }: { stage: string }) {
  const cfg = stageConfig[stage] || { label: stage, bg: "#F1F5F9", color: "#475569" };
  return (
    <span
      className="px-2.5 py-1 rounded-full text-xs tracking-tight font-bold whitespace-nowrap"
      style={{ backgroundColor: cfg.bg, color: cfg.color }}
    >
      {cfg.label}
    </span>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  if (!name) return "??";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return "N/A";
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function toDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const mins = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${mins}`;
}

function formatDateTimeWindow(iso: string | null | undefined): string {
  if (!iso) return "N/A";
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return String(iso);
  }
}

type SortField = "cgpa" | "name" | "date";
type SortDir = "asc" | "desc";

const stageFilterLabels = [
  { value: "all", label: "All" },
  { value: "applied", label: "Applied" },
  { value: "assessment", label: "Assessment" },
  { value: "ai_interview", label: "AI Interview" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "rejected", label: "Rejected" },
];

// ── Assessment question shape ─────────────────────────────────────────────────

interface MCQQuestion {
  question: string;
  options: [string, string, string, string];
  correct_option: number; // 0–3
}

interface RawQuestionInput {
  question?: string;
  options?: string[];
  correct_option?: number;
}

function makeBlankQuestion(): MCQQuestion {
  return { question: "", options: ["", "", "", ""], correct_option: 0 };
}

type CandidateApplication = {
  id: string;
  drive_id: string;
  student_id: string;
  current_stage: string;
  applied_at: string;
  student?: {
    id?: string;
    full_name?: string;
    email?: string;
    college?: string;
    branch?: string;
    cgpa?: number;
    skills?: string[];
    resume_url?: string;
  };
  score?: number;
  match_score?: number;
  resume_match_score?: number;
  assessment_score?: number;
  [key: string]: unknown;
};

type DriveData = {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  package?: string;
  location?: string;
  [key: string]: unknown;
};

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function CandidateListPage() {
  const router = useRouter();
  const params = useParams();
  const driveId = params?.driveId as string;

  const [drive, setDrive] = useState<DriveData | null>(null);
  const [applications, setApplications] = useState<CandidateApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Assessment state
  const [assessmentExists, setAssessmentExists] = useState<boolean | null>(null); // null = loading
  const [existingQuestionCount, setExistingQuestionCount] = useState(0);
  const [loadingAssessment, setLoadingAssessment] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [questions, setQuestions] = useState<MCQQuestion[]>([makeBlankQuestion()]);
  const [durationMins, setDurationMins] = useState(30);
  const [assessmentStart, setAssessmentStart] = useState("");
  const [assessmentEnd, setAssessmentEnd] = useState("");
  const [currentAssessmentStart, setCurrentAssessmentStart] = useState<string | null>(null);
  const [currentAssessmentEnd, setCurrentAssessmentEnd] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(0);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  // AI Assessment Generator state
  const [aiFile, setAiFile] = useState<File | null>(null);
  const [aiNumQuestions, setAiNumQuestions] = useState(10);
  const [aiJobDesc, setAiJobDesc] = useState("");
  const [generatingAi, setGeneratingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSuccessMessage, setAiSuccessMessage] = useState<string | null>(null);
  const [appendMode, setAppendMode] = useState<"replace" | "append">("replace");
  const [showJdContext, setShowJdContext] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    if (!driveId) return;
    try {
      setLoading(true);
      setError(null);
      const [driveData, appsData] = await Promise.all([
        api.getDrive(driveId).catch(() => null),
        api.getDriveApplications(driveId),
      ]);
      setDrive(driveData);
      setApplications(appsData);
    } catch (err: unknown) {
      console.error("[Candidate List] Error fetching data:", err);
      setError(err instanceof Error ? err.message : "Failed to load candidates");
    } finally {
      setLoading(false);
    }
  };

  const checkAssessment = async () => {
    if (!driveId) return;
    try {
      const data = await api.getDriveAssessment(driveId);
      setAssessmentExists(true);
      setCurrentAssessmentStart(data.assessment_start || null);
      setCurrentAssessmentEnd(data.assessment_end || null);
      if (data && Array.isArray(data.questions)) {
        setExistingQuestionCount(data.questions.length);
      }
    } catch {
      // 404 means no assessment yet
      setAssessmentExists(false);
      setExistingQuestionCount(0);
      setCurrentAssessmentStart(null);
      setCurrentAssessmentEnd(null);
    }
  };

  const setPresetWindow = (type: "24h" | "48h" | "tomorrow" | "clear") => {
    if (type === "clear") {
      setAssessmentStart("");
      setAssessmentEnd("");
      return;
    }
    const now = new Date();
    if (type === "24h") {
      const end = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      setAssessmentStart(toDatetimeLocal(now.toISOString()));
      setAssessmentEnd(toDatetimeLocal(end.toISOString()));
    } else if (type === "48h") {
      const end = new Date(now.getTime() + 48 * 60 * 60 * 1000);
      setAssessmentStart(toDatetimeLocal(now.toISOString()));
      setAssessmentEnd(toDatetimeLocal(end.toISOString()));
    } else if (type === "tomorrow") {
      const start = new Date(now);
      start.setDate(start.getDate() + 1);
      start.setHours(9, 0, 0, 0);
      const end = new Date(start);
      end.setHours(21, 0, 0, 0); // 9pm
      setAssessmentStart(toDatetimeLocal(start.toISOString()));
      setAssessmentEnd(toDatetimeLocal(end.toISOString()));
    }
  };

  useEffect(() => {
    setNowMs(Date.now());
    loadData();
    checkAssessment();
  }, [driveId]);

  // ── Assessment question helpers ──────────────────────────────────────────────

  const openCreateModal = () => {
    setIsEditMode(false);
    setQuestions([makeBlankQuestion()]);
    setDurationMins(30);
    setAssessmentStart("");
    setAssessmentEnd("");
    setPublishError(null);
    setAiFile(null);
    setAiError(null);
    setAiSuccessMessage(null);
    setAiJobDesc(drive?.description || (drive?.title ? `Role: ${drive.title}` : ""));
    setCreateModalOpen(true);
  };

  const openEditModal = async () => {
    try {
      setLoadingAssessment(true);
      const data = await api.getDriveAssessment(driveId);
      if (data) {
        setDurationMins(data.duration_mins || 30);
        setAssessmentStart(data.assessment_start ? toDatetimeLocal(data.assessment_start) : "");
        setAssessmentEnd(data.assessment_end ? toDatetimeLocal(data.assessment_end) : "");
        if (Array.isArray(data.questions) && data.questions.length > 0) {
          setQuestions(
            data.questions.map((q: RawQuestionInput) => ({
              question: q.question || "",
              options: [
                q.options?.[0] || "",
                q.options?.[1] || "",
                q.options?.[2] || "",
                q.options?.[3] || "",
              ],
              correct_option: typeof q.correct_option === "number" ? q.correct_option : 0,
            }))
          );
        } else {
          setQuestions([makeBlankQuestion()]);
        }
      }
      setIsEditMode(true);
      setPublishError(null);
      setAiFile(null);
      setAiError(null);
      setAiSuccessMessage(null);
      setAiJobDesc(drive?.description || (drive?.title ? `Role: ${drive.title}` : ""));
      setCreateModalOpen(true);
    } catch (err: unknown) {
      console.error("[Edit Assessment Error]", err);
      alert("Failed to load existing assessment.");
    } finally {
      setLoadingAssessment(false);
    }
  };

  useEffect(() => {
    if (assessmentExists !== null && typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("openAssessment") === "true") {
        if (assessmentExists) {
          openEditModal();
        } else {
          openCreateModal();
        }
      }
    }
  }, [assessmentExists]);


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (!["pdf", "csv", "txt"].includes(ext || "")) {
        setAiError("Please select a .csv, .pdf, or .txt file.");
        return;
      }
      setAiFile(file);
      setAiError(null);
      setAiSuccessMessage(null);
    }
  };

  const handleGenerateAiQuestions = async () => {
    if (!aiFile) {
      setAiError("Please select a CSV or PDF file to upload.");
      return;
    }

    setGeneratingAi(true);
    setAiError(null);
    setAiSuccessMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", aiFile);
      formData.append("drive_id", driveId);
      formData.append("num_questions", String(aiNumQuestions));
      if (aiJobDesc.trim()) {
        formData.append("custom_job_description", aiJobDesc.trim());
      }

      const res = await api.generateAssessmentQuestionsFromFile(formData);
      if (res && Array.isArray(res.questions) && res.questions.length > 0) {
        const mapped: MCQQuestion[] = res.questions.map((q: RawQuestionInput) => ({
          question: q.question || "",
          options: [
            q.options?.[0] || "",
            q.options?.[1] || "",
            q.options?.[2] || "",
            q.options?.[3] || "",
          ],
          correct_option: typeof q.correct_option === "number" ? q.correct_option : 0,
        }));

        if (appendMode === "append") {
          setQuestions((prev) => {
            const nonEmpty = prev.filter((p) => p.question.trim() || p.options.some((o) => o.trim()));
            return [...nonEmpty, ...mapped];
          });
          setAiSuccessMessage(`Appended ${mapped.length} AI-generated questions from "${aiFile.name}".`);
        } else {
          setQuestions(mapped);
          setAiSuccessMessage(`Successfully generated ${mapped.length} questions from "${aiFile.name}". Review and edit below before saving.`);
        }
      } else {
        setAiError("AI could not extract questions from this file. Try another file or format.");
      }
    } catch (err: unknown) {
      console.error("[AI Assessment Gen Error]", err);
      setAiError(err instanceof Error ? err.message : "Failed to generate questions with AI.");
    } finally {
      setGeneratingAi(false);
    }
  };

  const addQuestion = () => setQuestions((prev) => [...prev, makeBlankQuestion()]);

  const removeQuestion = (idx: number) =>
    setQuestions((prev) => prev.filter((_, i) => i !== idx));

  const updateQuestion = (idx: number, field: keyof MCQQuestion, value: string | string[] | number) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== idx) return q;
        if (field === "options" && Array.isArray(value)) return { ...q, options: value as [string, string, string, string] };
        return { ...q, [field]: value };
      })
    );
  };

  const updateOption = (qIdx: number, optIdx: number, value: string) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const newOpts = [...q.options] as [string, string, string, string];
        newOpts[optIdx] = value;
        return { ...q, options: newOpts };
      })
    );
  };

  const handlePublish = async () => {
    if (questions.length === 0) {
      setPublishError("Please add at least one question.");
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) {
        setPublishError(`Question ${i + 1} text is required.`);
        return;
      }
      for (let o = 0; o < 4; o++) {
        if (!q.options[o].trim()) {
          setPublishError(`Question ${i + 1}, Option ${String.fromCharCode(65 + o)} is required.`);
          return;
        }
      }
    }

    try {
      setPublishing(true);
      setPublishError(null);

      const payload = {
        drive_id: driveId,
        questions: questions.map((q) => ({
          question: q.question.trim(),
          options: q.options.map((o) => o.trim()),
          correct_option: q.correct_option,
        })),
        duration_mins: durationMins,
        assessment_start: assessmentStart ? new Date(assessmentStart).toISOString() : null,
        assessment_end: assessmentEnd ? new Date(assessmentEnd).toISOString() : null,
      };

      if (isEditMode) {
        await api.updateAssessment(driveId, payload);
      } else {
        await api.createAssessment(payload);
      }

      setAssessmentExists(true);
      setExistingQuestionCount(questions.length);
      setCurrentAssessmentStart(payload.assessment_start);
      setCurrentAssessmentEnd(payload.assessment_end);
      setCreateModalOpen(false);
      dispatchNotificationsUpdated();
    } catch (err: unknown) {
      setPublishError(err instanceof Error ? err.message : "Failed to save assessment.");
    } finally {
      setPublishing(false);
    }
  };

  // ── Render guards ─────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 className="size-8 animate-spin text-[#4F46E5]" />
        <p className="text-sm text-muted-foreground">Loading candidates…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card className="border-rose-200 bg-rose-50">
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <AlertCircle className="size-8 text-rose-500" />
            <p className="text-sm font-medium text-rose-700">{error}</p>
            <Button size="sm" variant="outline" onClick={loadData} className="text-xs mt-2">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const handleStageChange = async (appId: string, newStage: string) => {
    try {
      setUpdatingId(appId);
      await api.updateApplicationStage(appId, newStage);
      setApplications((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, current_stage: newStage } : a))
      );
      dispatchNotificationsUpdated();
    } catch (err: unknown) {
      console.error("[Stage update failed]", err);
      alert(err instanceof Error ? err.message : "Failed to update stage");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemoveCandidate = async (appId: string) => {
    if (!window.confirm("Are you sure you want to remove this candidate from the hiring process?")) return;
    try {
      setUpdatingId(appId);
      await api.removeCandidateFromProcess(appId);
      setApplications((prev) => prev.filter((a) => a.id !== appId));
      dispatchNotificationsUpdated();
    } catch (err: unknown) {
      console.error("[Remove candidate failed]", err);
      alert(err instanceof Error ? err.message : "Failed to remove candidate");
    } finally {
      setUpdatingId(null);
    }
  };

  const sorted = [...applications]
    .filter((a) => stageFilter === "all" || a.current_stage === stageFilter)
    .sort((a, b) => {
      const mult = sortDir === "asc" ? 1 : -1;
      if (sortField === "name") {
        const nameA = a.student?.full_name || "";
        const nameB = b.student?.full_name || "";
        return mult * nameA.localeCompare(nameB);
      }
      if (sortField === "cgpa") {
        const cgpaA = a.student?.cgpa ?? 0;
        const cgpaB = b.student?.cgpa ?? 0;
        return mult * (cgpaA - cgpaB);
      }
      // date
      const dateA = new Date(a.applied_at).getTime();
      const dateB = new Date(b.applied_at).getTime();
      return mult * (dateA - dateB);
    });

  const shortlistedCount = applications.filter((a) => a.current_stage === "shortlisted").length;
  const rejectedCount = applications.filter((a) => a.current_stage === "rejected").length;

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="size-3.5 opacity-40" />;
    return sortDir === "desc" ? (
      <ArrowDown className="size-3.5 text-[#4F46E5]" />
    ) : (
      <ArrowUp className="size-3.5 text-[#4F46E5]" />
    );
  };

  const OPTION_LABELS = ["A", "B", "C", "D"];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Link href="/company/dashboard" className="hover:text-foreground">
              Drives
            </Link>
            <ChevronRight className="size-3" />
            <span className="text-foreground font-medium">{drive?.title || "Drive Candidates"}</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Candidate List</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {applications.length} candidate{applications.length !== 1 ? "s" : ""} applied for this role
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
          {/* Assessment button / chip */}
          {assessmentExists === null ? (
            <div className="w-36 h-8 rounded-lg bg-muted animate-pulse" />
          ) : assessmentExists ? (
            <div className="flex items-center gap-2 flex-wrap">
              {(() => {
                if (!nowMs) return null;
                const startMs = currentAssessmentStart ? new Date(currentAssessmentStart).getTime() : null;
                const endMs = currentAssessmentEnd ? new Date(currentAssessmentEnd).getTime() : null;
                const isLive = (!startMs || nowMs >= startMs) && (!endMs || nowMs <= endMs) && Boolean(startMs || endMs);
                const isUpcoming = startMs && nowMs < startMs;
                const isClosed = endMs && nowMs > endMs;

                if (isLive) {
                  return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700">
                      <span className="size-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                      Exam Live {currentAssessmentEnd ? `(Ends ${formatDateTimeWindow(currentAssessmentEnd)})` : ""}
                    </span>
                  );
                }
                if (isUpcoming) {
                  return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 border border-amber-200 text-amber-800">
                      <Calendar className="size-3.5 text-amber-600" />
                      Scheduled: {formatDateTimeWindow(currentAssessmentStart)}
                    </span>
                  );
                }
                if (isClosed) {
                  return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-50 border border-rose-200 text-rose-700">
                      <Clock className="size-3.5" />
                      Window Closed
                    </span>
                  );
                }
                return null;
              })()}
              <Button
                id="edit-assessment-btn"
                onClick={openEditModal}
                size="sm"
                variant="outline"
                disabled={loadingAssessment}
                className="gap-1.5 border-[#4F46E5]/40 text-[#4F46E5] hover:bg-[#EEF2FF] text-xs font-semibold shadow-sm"
              >
                {loadingAssessment ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <ClipboardCheck className="size-3.5" />
                )}
                Manage Assessment {existingQuestionCount > 0 ? `(${existingQuestionCount} Qs)` : "✓"}
              </Button>
            </div>
          ) : (
            <Button
              id="create-assessment-btn"
              onClick={openCreateModal}
              size="sm"
              className="gap-1.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-semibold shadow-sm"
            >
              <ClipboardCheck className="size-3.5" />
              Create Assessment
            </Button>
          )}

          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg ai-gradient text-white text-xs font-semibold">
            <Sparkles className="size-3.5" />
            Realtime Applications
          </span>
        </div>
      </div>

      {/* Filter / Sort bar */}
      <Card className="card-shadow border-border/60">
        <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Stage filter pills */}
          <div className="flex flex-wrap gap-1.5 flex-1">
            {stageFilterLabels.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setStageFilter(value)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                  stageFilter === value
                    ? "bg-[#4F46E5] text-white"
                    : "bg-muted text-muted-foreground hover:bg-[#EEF2FF] hover:text-[#3730A3]"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <Separator orientation="vertical" className="hidden sm:block h-6" />

          {/* Sort controls */}
          <div className="flex items-center gap-2 shrink-0">
            <SlidersHorizontal className="size-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Sort:</span>
            {(["date", "cgpa", "name"] as SortField[]).map((field) => (
              <button
                key={field}
                onClick={() => toggleSort(field)}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors",
                  sortField === field
                    ? "bg-[#EEF2FF] text-[#3730A3]"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                {field === "date" ? "Date" : field === "cgpa" ? "CGPA" : "Name"}
                {renderSortIcon(field)}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary strip */}
      <div className="flex gap-4 text-xs">
        <span className="text-muted-foreground">{sorted.length} shown</span>
        <span className="text-emerald-600 font-medium">✓ {shortlistedCount} shortlisted</span>
        <span className="text-[#F43F5E] font-medium">✗ {rejectedCount} rejected</span>
        <span className="text-muted-foreground">
          {applications.length - shortlistedCount - rejectedCount} in process
        </span>
      </div>

      {/* Candidate rows */}
      <Card className="card-shadow border-border/60 overflow-hidden">
        {/* Table header */}
        <div className="hidden md:grid grid-cols-[auto_1fr_160px_100px_140px_120px] gap-4 px-5 py-3 bg-muted/50 border-b border-border text-xs tracking-tight font-bold text-muted-foreground uppercase tracking-wider items-center">
          <span className="w-8" />
          <span>Candidate</span>
          <span>College</span>
          <button
            onClick={() => toggleSort("cgpa")}
            className="flex items-center gap-1 hover:text-foreground transition-colors"
          >
            CGPA {renderSortIcon("cgpa")}
          </button>
          <span>Stage</span>
          <span className="text-right">Actions</span>
        </div>

        {/* Empty state */}
        {sorted.length === 0 && (
          <div className="p-12 text-center text-muted-foreground text-sm">
            No candidates found matching the criteria.
          </div>
        )}

        {/* Rows */}
        {sorted.map((app, i) => {
          const student = app.student || {};
          const isShortlisted = app.current_stage === "shortlisted";
          const isRejected = app.current_stage === "rejected";
          const initials = getInitials(student.full_name || "Candidate");

          return (
            <div key={app.id}>
              {i > 0 && <Separator />}
              <div
                onClick={() => router.push(`/company/drives/${driveId}/candidates/${app.id}`)}
                className={cn(
                  "flex flex-col md:grid md:grid-cols-[auto_1fr_160px_100px_140px_120px] gap-4 px-5 py-4 items-center group cursor-pointer transition-colors",
                  isShortlisted
                    ? "bg-[#F0FDF4] hover:bg-[#DCFCE7]"
                    : isRejected
                    ? "bg-[#FFF1F2] hover:bg-[#FFE4E6]"
                    : "hover:bg-accent/30"
                )}
              >
                {/* Rank */}
                <div className="hidden md:flex size-8 rounded-lg bg-muted items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                  {i + 1}
                </div>

                {/* Name / info */}
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="size-9 shrink-0">
                    <AvatarFallback
                      className="text-xs font-bold text-white"
                      style={{
                        background: `hsl(${(app.id.charCodeAt(0) * 37) % 360}, 65%, 50%)`,
                      }}
                    >
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-foreground">
                        {student.full_name || "Unknown Candidate"}
                      </p>
                      <StageBadge stage={app.current_stage} />
                      {Boolean(app.has_proctor_violations || ((app.proctor_flags_count as number) || 0) > 0) && (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700 border border-rose-200"
                          title="Proctoring violation or tab switch detected"
                        >
                          <ShieldAlert className="size-3 text-rose-600" />
                          Cheating Flagged ({Number(app.proctor_flags_count || 1)})
                        </span>
                      )}
                      {app.offer_status === "rejected" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          Offer Declined
                        </span>
                      )}
                      {app.offer_status === "accepted" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          ✓ Offer Accepted
                        </span>
                      )}
                    </div>
                    <p className="text-xs tracking-tight text-muted-foreground mt-0.5">
                      {student.branch || "Branch N/A"} · Applied {formatDate(app.applied_at)}
                    </p>
                  </div>
                </div>

                {/* College */}
                <p className="hidden md:block text-xs text-muted-foreground truncate">
                  {student.college || "—"}
                </p>

                {/* CGPA */}
                <p className="hidden md:block text-sm font-semibold text-foreground">
                  {student.cgpa !== null && student.cgpa !== undefined ? `${student.cgpa}` : "—"}
                </p>

                {/* Stage */}
                <div className="hidden md:block">
                  <StageBadge stage={app.current_stage} />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-1.5">
                  {app.offer_status === "rejected" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveCandidate(app.id);
                      }}
                      disabled={updatingId === app.id}
                      title="Remove Candidate from Process"
                      className="size-8 rounded-lg flex items-center justify-center bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors border border-rose-200"
                    >
                      <UserMinus className="size-4" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStageChange(app.id, isShortlisted ? "applied" : "shortlisted");
                    }}
                    disabled={updatingId === app.id}
                    title={isShortlisted ? "Un-shortlist" : "Shortlist"}
                    className={cn(
                      "size-8 rounded-lg flex items-center justify-center transition-colors",
                      isShortlisted
                        ? "bg-emerald-500 text-white"
                        : "bg-muted text-muted-foreground hover:bg-[#D1FAE5] hover:text-emerald-700"
                    )}
                  >
                    <UserCheck className="size-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStageChange(app.id, isRejected ? "applied" : "rejected");
                    }}
                    disabled={updatingId === app.id}
                    title={isRejected ? "Un-reject" : "Reject"}
                    className={cn(
                      "size-8 rounded-lg flex items-center justify-center transition-colors",
                      isRejected
                        ? "bg-[#F43F5E] text-white"
                        : "bg-muted text-muted-foreground hover:bg-[#FFE4E6] hover:text-[#F43F5E]"
                    )}
                  >
                    <UserX className="size-4" />
                  </button>
                  <ChevronRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </div>
          );
        })}
      </Card>

      {/* ── Create / Manage Assessment Modal ── */}
      <Dialog open={createModalOpen} onOpenChange={(open) => !publishing && !generatingAi && setCreateModalOpen(open)}>
        <DialogContent className="sm:max-w-3xl max-h-[92vh] overflow-y-auto p-6 gap-6">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2 text-lg font-bold">
                <ClipboardCheck className="size-5 text-[#4F46E5]" />
                {isEditMode ? "Manage & Edit Assessment" : "Create Assessment"}
              </DialogTitle>
              {assessmentExists && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Published Assessment
                </span>
              )}
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Configure assessment for <strong className="text-foreground">{drive?.title}</strong>. Upload a PDF or CSV to let AI generate aligned questions, or build manually.
            </DialogDescription>
          </DialogHeader>

          {/* ── AI Question Generator Section ── */}
          <div className="rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50/70 via-purple-50/40 to-white p-4 sm:p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="size-7 rounded-lg bg-[#4F46E5] flex items-center justify-center text-white shadow-sm">
                  <Sparkles className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    AI Question Generator
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700">
                      Auto-Extract
                    </span>
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Upload a CSV or PDF file. AI will extract and formulate MCQs aligned with the Job Description.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowJdContext(!showJdContext)}
                className="text-[11px] font-medium text-[#4F46E5] hover:underline flex items-center gap-1 shrink-0"
              >
                <HelpCircle className="size-3.5" />
                {showJdContext ? "Hide JD context" : "Customize JD context"}
              </button>
            </div>

            {/* Optional JD context edit */}
            {showJdContext && (
              <div className="space-y-1.5 p-3 rounded-lg bg-white/80 border border-indigo-100">
                <Label className="text-[11px] font-semibold text-foreground">
                  Job Description &amp; Custom Assessment Prompt
                </Label>
                <textarea
                  value={aiJobDesc}
                  onChange={(e) => setAiJobDesc(e.target.value)}
                  placeholder="Role description, required skills, specific topics to emphasize (e.g. SQL joins, REST APIs, Python OOP)..."
                  rows={3}
                  className="w-full rounded-md border border-input bg-white px-3 py-2 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none"
                />
              </div>
            )}

            {/* Upload Area & Configuration */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              {/* File Dropzone / Picker */}
              <div className="sm:col-span-7">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.pdf,.txt"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {!aiFile ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-white/60 hover:bg-white rounded-lg p-3 text-center cursor-pointer transition-colors flex flex-col items-center justify-center gap-1.5"
                  >
                    <Upload className="size-5 text-[#4F46E5]" />
                    <div className="text-xs font-medium text-foreground">
                      Click to upload <span className="text-[#4F46E5] font-bold">CSV</span> or <span className="text-[#4F46E5] font-bold">PDF</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Question bank, syllabus, or exam notes (up to 10MB)
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white border border-indigo-200">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      {aiFile.name.endsWith(".csv") ? (
                        <FileSpreadsheet className="size-6 text-emerald-600 shrink-0" />
                      ) : (
                        <FileText className="size-6 text-rose-600 shrink-0" />
                      )}
                      <div className="truncate">
                        <p className="text-xs font-semibold text-foreground truncate">{aiFile.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {(aiFile.size / 1024).toFixed(1)} KB • Ready for AI parsing
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setAiFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="size-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-rose-500 hover:bg-rose-50 transition-colors"
                      title="Remove file"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Number of Questions & Mode */}
              <div className="sm:col-span-5 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">Number of Qs</Label>
                  <div className="flex items-center gap-1">
                    {[5, 10, 15, 20].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setAiNumQuestions(num)}
                        className={cn(
                          "px-1.5 py-0.5 text-[10px] rounded font-semibold transition-colors",
                          aiNumQuestions === num
                            ? "bg-[#4F46E5] text-white"
                            : "bg-white text-muted-foreground hover:bg-muted border border-border"
                        )}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={50}
                    value={aiNumQuestions}
                    onChange={(e) => setAiNumQuestions(Math.max(1, Math.min(50, parseInt(e.target.value) || 10)))}
                    className="h-8 text-xs bg-white"
                  />
                  <select
                    value={appendMode}
                    onChange={(e) => setAppendMode(e.target.value as "replace" | "append")}
                    className="h-8 px-2 rounded-md border border-input bg-white text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="replace">Replace all</option>
                    <option value="append">Append</option>
                  </select>
                </div>
              </div>
            </div>

            {/* AI Generator Action Button */}
            <div className="flex items-center justify-between pt-1">
              <p className="text-[11px] text-muted-foreground">
                AI extracts answers or calculates the most accurate option.
              </p>
              <Button
                type="button"
                onClick={handleGenerateAiQuestions}
                disabled={generatingAi || !aiFile}
                size="sm"
                className="brand-gradient text-white text-xs font-bold gap-1.5 shadow-sm hover:opacity-90 disabled:opacity-50"
              >
                {generatingAi ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    Analyzing document &amp; formulating…
                  </>
                ) : (
                  <>
                    <Sparkles className="size-3.5" />
                    Generate Questions with AI
                  </>
                )}
              </Button>
            </div>

            {/* AI Success / Error feedback */}
            {aiSuccessMessage && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
                <Check className="size-4 text-emerald-600 shrink-0" />
                <span>{aiSuccessMessage}</span>
              </div>
            )}
            {aiError && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                <AlertCircle className="size-4 shrink-0" />
                <span>{aiError}</span>
              </div>
            )}
          </div>

          {/* ── Online Exam Live Window & Timing ── */}
          <div className="p-4 rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50/70 via-white to-indigo-50/40 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-[#4F46E5]/10 text-[#4F46E5] flex items-center justify-center shrink-0">
                  <Calendar className="size-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                    Online Exam Live Window &amp; Deadline
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-[#4F46E5]">
                      Shortlisted Candidates Only
                    </span>
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    Candidates only see and take this assessment once shortlisted, and strictly between the start &amp; deadline window.
                  </p>
                </div>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPresetWindow("24h")}
                  className="h-6 px-2 text-[10px] font-medium"
                >
                  Live 24h
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPresetWindow("48h")}
                  className="h-6 px-2 text-[10px] font-medium"
                >
                  Live 48h
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPresetWindow("tomorrow")}
                  className="h-6 px-2 text-[10px] font-medium"
                >
                  Tomorrow
                </Button>
                {(assessmentStart || assessmentEnd) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setPresetWindow("clear")}
                    className="h-6 px-2 text-[10px] text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                  >
                    Clear Window
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Window Start */}
              <div className="space-y-1">
                <Label htmlFor="assessment-start" className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                  <Clock className="size-3 text-[#4F46E5]" /> Exam Opens (Goes Live)
                </Label>
                <Input
                  id="assessment-start"
                  type="datetime-local"
                  value={assessmentStart}
                  onChange={(e) => setAssessmentStart(e.target.value)}
                  className="h-8 text-xs bg-white"
                />
              </div>

              {/* Window End / Deadline */}
              <div className="space-y-1">
                <Label htmlFor="assessment-end" className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                  <Timer className="size-3 text-rose-500" /> Exam Closes (Strict Deadline)
                </Label>
                <Input
                  id="assessment-end"
                  type="datetime-local"
                  value={assessmentEnd}
                  onChange={(e) => setAssessmentEnd(e.target.value)}
                  className="h-8 text-xs bg-white"
                />
              </div>

              {/* Duration in Minutes */}
              <div className="space-y-1">
                <Label htmlFor="assessment-duration" className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                  Duration (per candidate attempt)
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="assessment-duration"
                    type="number"
                    min={5}
                    max={180}
                    value={durationMins}
                    onChange={(e) => setDurationMins(Math.max(5, parseInt(e.target.value) || 30))}
                    className="h-8 text-xs bg-white w-24"
                  />
                  <span className="text-xs text-muted-foreground">mins</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-indigo-100/60">
              <span className="flex items-center gap-1">
                Total Questions: <strong className="text-foreground">{questions.length}</strong>
              </span>
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <Check className="size-3" /> Anti-cheat proctoring active
              </span>
            </div>
          </div>

          <Separator />

          {/* ── Questions List / Editor ── */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">
                Assessment Questions ({questions.length})
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Select the radio button next to the correct answer.
              </p>
            </div>

            <div className="space-y-4">
              {questions.map((q, qIdx) => (
                <div
                  key={qIdx}
                  className="p-4 rounded-xl border border-border bg-muted/20 space-y-3 relative group transition-all hover:border-indigo-200"
                >
                  {/* Question header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="size-6 rounded-full bg-[#4F46E5]/10 text-[#4F46E5] text-xs font-bold flex items-center justify-center">
                        {qIdx + 1}
                      </span>
                      <span className="text-xs font-bold text-foreground">Question {qIdx + 1}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Correct: Option {OPTION_LABELS[q.correct_option]}
                      </span>
                    </div>
                    {questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeQuestion(qIdx)}
                        disabled={publishing || generatingAi}
                        className="size-6 rounded flex items-center justify-center text-muted-foreground hover:text-rose-500 hover:bg-rose-50 transition-colors"
                        title="Remove question"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Question text */}
                  <div className="space-y-1.5">
                    <Label className="text-xs">Question text *</Label>
                    <textarea
                      id={`question-${qIdx}-text`}
                      value={q.question}
                      onChange={(e) => updateQuestion(qIdx, "question", e.target.value)}
                      placeholder="Enter question statement here…"
                      rows={2}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none"
                    />
                  </div>

                  {/* Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {OPTION_LABELS.map((label, oIdx) => {
                      const isCorrect = q.correct_option === oIdx;
                      return (
                        <div
                          key={oIdx}
                          className={cn(
                            "flex items-center gap-2 p-1.5 rounded-lg border transition-colors",
                            isCorrect
                              ? "bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-300/50"
                              : "bg-background border-border/80"
                          )}
                        >
                          <input
                            type="radio"
                            name={`q-${qIdx}-correct`}
                            id={`q-${qIdx}-opt-${oIdx}`}
                            checked={isCorrect}
                            onChange={() => updateQuestion(qIdx, "correct_option", oIdx)}
                            className="accent-emerald-600 size-4 shrink-0 cursor-pointer ml-1"
                            title="Mark as correct option"
                          />
                          <span
                            className={cn(
                              "text-xs font-bold w-4 shrink-0 text-center",
                              isCorrect ? "text-emerald-700" : "text-muted-foreground"
                            )}
                          >
                            {label}
                          </span>
                          <Input
                            value={q.options[oIdx]}
                            onChange={(e) => updateOption(qIdx, oIdx, e.target.value)}
                            placeholder={`Option ${label}`}
                            className="h-8 text-xs flex-1 bg-transparent border-0 focus-visible:ring-0 shadow-none px-1"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Add Question Button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addQuestion}
              disabled={publishing || generatingAi}
              className="gap-1.5 text-xs border-dashed border-[#4F46E5]/40 text-[#4F46E5] hover:bg-[#EEF2FF] w-full py-2.5"
            >
              <Plus className="size-3.5" /> Add Question Manually
            </Button>
          </div>

          {/* Error display */}
          {publishError && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <p className="text-xs">{publishError}</p>
              <button type="button" onClick={() => setPublishError(null)} className="ml-auto shrink-0">
                <X className="size-3.5" />
              </button>
            </div>
          )}

          <DialogFooter className="gap-2 sm:justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCreateModalOpen(false)}
              disabled={publishing || generatingAi}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              id="publish-assessment-btn"
              onClick={handlePublish}
              disabled={publishing || generatingAi}
              size="sm"
              className="bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-semibold gap-1.5"
            >
              {publishing ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" /> Saving…
                </>
              ) : isEditMode ? (
                <>
                  <ClipboardCheck className="size-3.5" /> Save Changes
                </>
              ) : (
                <>
                  <ClipboardCheck className="size-3.5" /> Publish Assessment
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

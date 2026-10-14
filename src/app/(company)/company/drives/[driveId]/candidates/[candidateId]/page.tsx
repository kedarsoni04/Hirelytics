"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ChevronLeft,
  Download,
  CheckCircle2,
  XCircle,
  Sparkles,
  FileText,
  ClipboardCheck,
  Video,
  MessageSquare,
  ChevronRight,
  TrendingUp,
  Loader2,
  AlertCircle,
  RefreshCw,
  Terminal,
  ShieldAlert,
  ShieldCheck,
  Bot,
  AlertTriangle,
  Trophy,
  UserCheck,
  UserX,
  HelpCircle,
  Timer,
  Clock,
  ChevronDown,
  ChevronUp,
  Quote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { CircularProgress } from "@/components/ui/circular-progress";
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

function formatDateTime(iso: string | null | undefined) {
  if (!iso) return "N/A";
  try {
    return new Date(iso).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

type ApplicationDetails = {
  id: string;
  drive_id: string;
  student_id: string;
  current_stage: string;
  applied_at: string;
  offer_status?: string;
  offer_letter_url?: string;
  offer_responded_at?: string;
  student?: {
    id?: string;
    full_name?: string;
    email?: string;
    college?: string;
    branch?: string;
    cgpa?: number;
    skills?: string[];
    resume_url?: string;
    linkedin_url?: string;
    github_url?: string;
    portfolio_url?: string;
  };
  drive?: {
    id?: string;
    title?: string;
    company_name?: string;
    package?: string;
    location?: string;
  };
  resume_match_score?: number;
  assessment_score?: number;
  score?: number;
  [key: string]: unknown;
};

type ScorecardData = {
  id?: string;
  application_id?: string;
  overall_score?: number;
  overall_ai_score?: number;
  resume_match_score?: number;
  assessment_score?: number;
  communication_score?: number;
  technical_interview_score?: number;
  recommendation?: string;
  summary?: string;
  ai_summary?: string;
  ai_insights?: string[];
  strengths?: string[];
  weaknesses?: string[];
  technical_skills_score?: number;
  problem_solving_score?: number;
  cultural_fit_score?: number;
  breakdown?: Record<string, unknown>;
  [key: string]: unknown;
};

type SubmissionData = {
  id?: string;
  score?: number;
  passed?: boolean;
  proctor_flags?: unknown[];
  created_at?: string;
  submitted_at?: string;
  [key: string]: unknown;
};

type InterviewAnswer = {
  question_id?: string | number;
  category?: string;
  transcript?: string;
  is_follow_up?: boolean;
  delivery_metrics?: {
    wpm?: number;
    longest_pause_sec?: number;
    filler_count?: number;
    filler_words_approx?: number;
    word_count?: number;
    duration_sec?: number;
    response_latency_ms?: number;
  };
  evaluation?: {
    rubric_score?: number;
    communication_score?: number;
    key_points_covered?: string[];
    key_points_missed?: string[];
    evidence_quote?: string;
    follow_up_question?: string | null;
    needs_follow_up?: boolean;
    skills_demonstrated?: string[];
    skills_missing?: string[];
  };
  integrity_events?: { type?: string; timestamp?: string }[];
};

type InterviewDetails = {
  id?: string;
  application_id?: string;
  questions?: (string | { id?: string | number; question?: string; text?: string; category?: string; is_follow_up?: boolean; parent_id?: string | number | null })[];
  answers?: InterviewAnswer[];
  integrity_flags?: {
    tab_switches?: number;
    focus_losses?: number;
    fullscreen_exits?: number;
    total_events?: number;
  };
  transcript?: string;
  proctor_flags?: { type?: string; timestamp?: string; details?: string }[];
  sentiment_data?: {
    skills_demonstrated?: string[];
    skills_missing?: string[];
    skills_expected?: string[];
    confidence_score?: number;
    technical_score?: number;
    filler_word_count?: number;
    tone?: string;
    keyword_matches?: string[];
    [key: string]: unknown;
  };
  completed_at?: string | null;
  scheduled_at?: string | null;
  [key: string]: unknown;
};

function parseInterviewQA(questions: unknown[] | undefined, transcript: string | null | undefined) {
  if (!transcript) return [];
  const qaList: { index: number; question: string; answer: string; category?: string }[] = [];
  const parts = transcript.split(/Question \d+:/);
  for (let i = 1; i < parts.length; i++) {
    const raw = parts[i];
    const [qPart, aPart] = raw.split(/\nAnswer:/);
    const qObj = questions && (questions[i - 1] as Record<string, unknown>);
    const cat = typeof qObj === "object" ? String(qObj?.category || "") : undefined;
    const qTitle = (typeof qObj === "object" ? String(qObj?.question || qObj?.text || "") : String(qObj || "")) || qPart.trim();
    const ans = (aPart ? aPart.trim() : raw.trim()) || "No response recorded.";
    qaList.push({
      index: i,
      question: qTitle,
      answer: ans,
      category: cat,
    });
  }
  if (qaList.length === 0 && questions && questions.length > 0) {
    return questions.map((q, idx) => ({
      index: idx + 1,
      question: typeof q === "string" ? q : String((q as Record<string, unknown>)?.question || (q as Record<string, unknown>)?.text || `Question ${idx + 1}`),
      answer: transcript || "No recorded response.",
      category: typeof q === "object" ? String((q as Record<string, unknown>)?.category || "") : undefined,
    }));
  }
  return qaList;
}

export default function CandidateScorecardPage() {
  const params = useParams();
  const driveId = params?.driveId as string;
  const candidateId = params?.candidateId as string; // this is application_id

  const [application, setApplication] = useState<ApplicationDetails | null>(null);
  const [scorecard, setScorecard] = useState<ScorecardData | null>(null);
  const [submission, setSubmission] = useState<SubmissionData | null>(null); // assessment submission
  const [interview, setInterview] = useState<InterviewDetails | null>(null);
  const [interviewExists, setInterviewExists] = useState<boolean | null>(null); // null = checking
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [generating, setGenerating] = useState(false);
  const [schedulingInterview, setSchedulingInterview] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionMessageType, setActionMessageType] = useState<"error" | "success">("error");
  const [interviewSuccessMsg, setInterviewSuccessMsg] = useState<string | null>(null);
  const [expandedTranscripts, setExpandedTranscripts] = useState<Record<string | number, boolean>>({});

  const toggleTranscript = (idx: string | number) => {
    setExpandedTranscripts((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const loadData = async () => {
    if (!candidateId) return;
    try {
      setLoading(true);
      setError(null);
      const appData = await api.getApplication(candidateId);
      setApplication(appData);

      // Fetch scorecard (optional)
      try {
        const scData = await api.getScorecard(candidateId);
        setScorecard(scData);
      } catch {
        setScorecard(null);
      }

      // Fetch assessment submission (optional)
      try {
        const subData = await api.getAssessmentSubmission(candidateId);
        setSubmission(subData);
      } catch {
        setSubmission(null);
      }

      // Fetch interview data
      try {
        const intData = await api.getApplicationInterview(candidateId);
        setInterview(intData);
        setInterviewExists(true);
      } catch {
        setInterview(null);
        setInterviewExists(false);
      }
    } catch (err: unknown) {
      console.error("[Candidate Scorecard] Load error:", err);
      setError(err instanceof Error ? err.message : "Failed to load candidate application");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [candidateId]);

  const handleStageAction = async (newStage: string) => {
    try {
      setActionLoading(true);
      setActionMessage(null);
      await api.updateApplicationStage(candidateId, newStage);
      const updatedApp = await api.getApplication(candidateId);
      setApplication(updatedApp);
      dispatchNotificationsUpdated();
      if (newStage === "hired") {
        setActionMessage("Candidate hired successfully! Official Offer Letter PDF was generated and sent to candidate's email.");
        setActionMessageType("success");
      } else if (newStage === "offered") {
        setActionMessage("Offer extended to candidate. They can now accept or reject it in their portal.");
        setActionMessageType("success");
      }
    } catch (err: unknown) {
      console.error("[Candidate Action] Error:", err);
      setActionMessage(err instanceof Error ? err.message : "Failed to update candidate stage");
      setActionMessageType("error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveCandidate = async () => {
    if (!confirm("Are you sure you want to remove this candidate from further recruitment process?")) return;
    try {
      setActionLoading(true);
      setActionMessage(null);
      await api.removeCandidateFromProcess(candidateId);
      const updatedApp = await api.getApplication(candidateId);
      setApplication(updatedApp);
      dispatchNotificationsUpdated();
      setActionMessage("Candidate removed from further recruitment process.");
      setActionMessageType("success");
    } catch (err: unknown) {
      console.error("[Remove Candidate] Error:", err);
      setActionMessage(err instanceof Error ? err.message : "Failed to remove candidate");
      setActionMessageType("error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerateScorecard = async () => {
    try {
      setGenerating(true);
      setActionMessage(null);
      const sc = await api.generateScorecard(candidateId);
      setScorecard(sc);
      // Reload application to get any updated stage
      const updatedApp = await api.getApplication(candidateId);
      setApplication(updatedApp);
    } catch (err: unknown) {
      console.error("[Generate Scorecard] Error:", err);
      setActionMessage(err instanceof Error ? err.message : "Failed to generate scorecard. Complete Assessment & Interview first.");
      setActionMessageType("error");
    } finally {
      setGenerating(false);
    }
  };

  const handleScheduleInterview = async () => {
    try {
      setSchedulingInterview(true);
      setActionMessage(null);
      setInterviewSuccessMsg(null);
      // POST /interviews — backend auto-generates questions via Gemini
      await api.createInterview({ application_id: candidateId, questions: [] });
      setInterviewExists(true);
      setInterviewSuccessMsg("Interview scheduled — candidate will be notified.");
      // Refresh app stage
      const updatedApp = await api.getApplication(candidateId);
      setApplication(updatedApp);
      dispatchNotificationsUpdated();
    } catch (err: unknown) {
      console.error("[Schedule Interview] Error:", err);
      setActionMessage(err instanceof Error ? err.message : "Failed to schedule interview. Please try again.");
      setActionMessageType("error");
    } finally {
      setSchedulingInterview(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 className="size-8 animate-spin text-[#4F46E5]" />
        <p className="text-sm text-muted-foreground">Loading candidate profile & scorecard…</p>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card className="border-rose-200 bg-rose-50">
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <AlertCircle className="size-8 text-rose-500" />
            <p className="text-sm font-medium text-rose-700">{error ?? "Candidate application not found"}</p>
            <Link href={`/company/drives/${driveId}/candidates`}>
              <Button size="sm" variant="outline" className="text-xs mt-2">
                <ChevronLeft className="size-3.5 mr-1" /> Back to Candidates
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const student = application.student || {};
  const drive = application.drive || {};
  const stage = application.current_stage || "applied";
  const cfg = stageConfig[stage] || { label: stage, bg: "#F1F5F9", color: "#475569" };
  const initials = getInitials(student.full_name || "Candidate");

  const overallScore = scorecard?.overall_ai_score ?? null;
  const resumeScore = scorecard?.resume_match_score ?? null;
  const assessmentScore = scorecard?.assessment_score ?? null;
  const commScore = scorecard?.communication_score ?? null;
  const techScore = scorecard?.technical_interview_score ?? null;
  const insights: string[] = scorecard?.ai_insights || [];

  // Interview button logic
  const canScheduleInterview =
    stage === "assessment" || stage === "ai_interview" || submission !== null;
  const interviewButtonDisabled =
    schedulingInterview || interviewExists === null || interviewExists === true;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* ── Breadcrumb & Back ── */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link
          href={`/company/drives/${driveId}/candidates`}
          className="hover:text-foreground hover:underline transition-colors flex items-center gap-1"
        >
          <ChevronLeft className="size-3" /> Back to Candidates
        </Link>
        <span className="text-border">|</span>
        <span>{drive.title || "Drive"}</span>
        <ChevronRight className="size-3" />
        <span className="font-medium text-foreground">{student.full_name || "Candidate"}</span>
      </div>

      {/* Action message banner */}
      {actionMessage && (
        <div
          className={cn(
            "p-3 border text-xs rounded-xl flex items-center justify-between",
            actionMessageType === "error"
              ? "bg-rose-50 border-rose-200 text-rose-700"
              : "bg-emerald-50 border-emerald-200 text-emerald-700"
          )}
        >
          <span>{actionMessage}</span>
          <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setActionMessage(null)}>
            Dismiss
          </Button>
        </div>
      )}

      {/* Interview success banner */}
      {interviewSuccessMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 shrink-0" />
            <span>{interviewSuccessMsg}</span>
          </div>
          <Button size="sm" variant="ghost" className="h-6 text-xs shrink-0" onClick={() => setInterviewSuccessMsg(null)}>
            Dismiss
          </Button>
        </div>
      )}

      {/* ── Header Card ── */}
      <Card className="card-shadow border-border/60">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex items-center gap-5">
              <Avatar className="size-20 shrink-0">
                <AvatarFallback
                  className="text-2xl font-bold text-white shadow-inner"
                  style={{
                    background: `hsl(${(application.id.charCodeAt(0) * 37) % 360}, 65%, 50%)`,
                  }}
                >
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-bold text-foreground">
                    {student.full_name || "Unknown Candidate"}
                  </h1>
                  <span
                    className="px-2.5 py-1 rounded-full text-xs tracking-tight font-bold"
                    style={{ backgroundColor: cfg.bg, color: cfg.color }}
                  >
                    {cfg.label}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {student.college || "College N/A"} · {student.branch || "Branch N/A"} · Applied {formatDate(application.applied_at)}
                </p>
                <div className="flex items-center gap-4 mt-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-muted text-muted-foreground text-xs font-semibold">
                    CGPA: {student.cgpa !== null && student.cgpa !== undefined ? `${student.cgpa} / 10` : "N/A"}
                  </span>
                  {student.resume_url ? (
                    <a
                      href={student.resume_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={`${(student.full_name || "candidate").replace(/[^a-zA-Z0-9_-]/g, "_")}_resume.pdf`}
                    >
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5 border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                        <Download className="size-3" /> Download Resume
                      </Button>
                    </a>
                  ) : (
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5 opacity-40 cursor-not-allowed" disabled>
                      <Download className="size-3" /> No Resume Uploaded
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-col gap-2 shrink-0 md:w-64">
              {stage === "hired" ? (
                <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 text-center space-y-2">
                  <div className="flex items-center justify-center gap-1.5 text-teal-800 font-bold text-xs">
                    <UserCheck className="size-4 text-teal-600" /> Candidate Hired
                  </div>
                  <p className="text-[11px] text-teal-700">Official hire confirmed & recorded.</p>
                  {application.offer_letter_url && (
                    <a
                      href={application.offer_letter_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <Button size="sm" className="w-full h-7 text-xs bg-teal-600 hover:bg-teal-700 text-white gap-1.5 shadow-sm">
                        <Download className="size-3" /> Download Offer Letter (PDF)
                      </Button>
                    </a>
                  )}
                </div>
              ) : stage === "offered" ? (
                <div className="p-3.5 rounded-xl border space-y-2 text-center bg-white shadow-sm">
                  {application.offer_status === "accepted" ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-center gap-1.5 text-emerald-700 font-bold text-xs bg-emerald-50 py-1.5 px-2 rounded-lg border border-emerald-200">
                        <CheckCircle2 className="size-4 text-emerald-600" /> Candidate Accepted Offer!
                      </div>
                      <p className="text-[11px] text-muted-foreground">Click below to finalize hiring and issue the PDF offer letter.</p>
                      <Button
                        size="sm"
                        onClick={() => handleStageAction("hired")}
                        disabled={actionLoading}
                        className="w-full brand-gradient text-white font-semibold text-xs h-8 shadow-sm gap-1.5"
                      >
                        {actionLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Trophy className="size-3.5" />}
                        Hire & Issue Offer Letter
                      </Button>
                    </div>
                  ) : application.offer_status === "rejected" ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-center gap-1.5 text-rose-700 font-bold text-xs bg-rose-50 py-1.5 px-2 rounded-lg border border-rose-200">
                        <XCircle className="size-4 text-rose-600" /> Candidate Rejected Offer
                      </div>
                      <p className="text-[11px] text-rose-600">Candidate chose to decline the job offer.</p>
                      <Button
                        size="sm"
                        onClick={handleRemoveCandidate}
                        disabled={actionLoading}
                        variant="destructive"
                        className="w-full text-xs h-8 gap-1.5 shadow-sm"
                      >
                        {actionLoading ? <Loader2 className="size-3.5 animate-spin" /> : <UserX className="size-3.5" />}
                        Remove Candidate from Process
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-center gap-1.5 text-amber-700 font-bold text-xs bg-amber-50 py-1.5 px-2 rounded-lg border border-amber-200">
                        <Timer className="size-4 text-amber-600" /> Offer Extended (Pending)
                      </div>
                      <p className="text-[10px] text-muted-foreground">Awaiting candidate acceptance in student portal.</p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStageAction("hired")}
                        disabled={actionLoading}
                        className="w-full text-xs h-7 text-emerald-700 border-emerald-300 hover:bg-emerald-50 gap-1.5"
                      >
                        Force Hire & Issue Letter
                      </Button>
                    </div>
                  )}
                </div>
              ) : stage === "shortlisted" ? (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                  <div className="flex items-center justify-center gap-1 text-emerald-800 font-bold text-xs">
                    <CheckCircle2 className="size-4 text-emerald-600" /> Candidate Shortlisted
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleStageAction("offered")}
                    disabled={actionLoading}
                    className="w-full bg-[#10B981] hover:bg-[#059669] text-white font-semibold text-xs h-8 shadow-sm gap-1.5"
                  >
                    <Trophy className="size-3.5" /> Extend Job Offer
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleStageAction("applied")}
                    disabled={actionLoading}
                    className="w-full h-6 text-[11px] text-muted-foreground hover:text-foreground"
                  >
                    Undo Shortlist
                  </Button>
                </div>
              ) : stage === "rejected" ? (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-center">
                  <XCircle className="size-5 text-rose-600 mx-auto mb-1" />
                  <p className="text-xs font-bold text-rose-800">Candidate Concluded / Rejected</p>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleStageAction("applied")}
                    disabled={actionLoading}
                    className="w-full mt-1 h-6 text-xs tracking-tight text-rose-700"
                  >
                    Re-open Candidate
                  </Button>
                </div>
              ) : (
                <>
                  <Button
                    onClick={() => handleStageAction("shortlisted")}
                    disabled={actionLoading}
                    className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm"
                  >
                    {actionLoading ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                    Shortlist Candidate
                  </Button>
                  <Button
                    onClick={() => handleStageAction("offered")}
                    disabled={actionLoading}
                    className="w-full gap-2 bg-[#10B981] hover:bg-[#059669] text-white font-semibold shadow-sm text-xs"
                  >
                    <Trophy className="size-3.5" /> Extend Job Offer
                  </Button>
                  <Button
                    onClick={() => handleStageAction("rejected")}
                    disabled={actionLoading}
                    variant="outline"
                    className="w-full gap-2 text-[#F43F5E] hover:bg-[#FFE4E6] hover:text-[#E11D48] border-[#F43F5E]/30 text-xs"
                  >
                    <XCircle className="size-4" /> Reject Candidate
                  </Button>
                </>
              )}

              {/* ── Schedule AI Interview Button ── */}
              <Separator className="my-1" />

              {interviewExists === null ? (
                // Still checking
                <Button disabled size="sm" className="w-full text-xs gap-1.5 opacity-60">
                  <Loader2 className="size-3.5 animate-spin" /> Checking interview…
                </Button>
              ) : interviewExists ? (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#EEF2FF] border border-[#C7D2FE]">
                  <Bot className="size-4 text-[#4F46E5] shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-[#3730A3]">Interview Scheduled ✓</p>
                    <p className="text-[10px] text-[#6366F1]">Candidate can now take the AI interview.</p>
                  </div>
                </div>
              ) : canScheduleInterview ? (
                <Button
                  id="schedule-ai-interview-btn"
                  onClick={handleScheduleInterview}
                  disabled={interviewButtonDisabled}
                  size="sm"
                  className="w-full gap-1.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-semibold"
                >
                  {schedulingInterview ? (
                    <><Loader2 className="size-3.5 animate-spin" /> Generating AI questions…</>
                  ) : (
                    <><Bot className="size-3.5" /> Schedule AI Interview</>
                  )}
                </Button>
              ) : (
                <div className="p-2.5 rounded-xl bg-muted/60 border border-border text-center">
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    AI Interview unlocks once candidate completes the assessment.
                  </p>
                </div>
              )}

              {/* Generate Scorecard Button */}
              {!scorecard && (
                <Button
                  onClick={handleGenerateScorecard}
                  disabled={generating}
                  className="w-full gap-1.5 brand-gradient text-white text-xs font-semibold mt-1"
                >
                  {generating ? (
                    <><Loader2 className="size-3.5 animate-spin" /> Generating...</>
                  ) : (
                    <><Sparkles className="size-3.5" /> Generate Scorecard</>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Assessment Submission Card ── */}
      {submission && (
        <Card className="card-shadow border-border/60">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <ClipboardCheck className="size-4 text-[#059669]" />
              <h3 className="text-sm font-bold text-foreground">Assessment Submission</h3>
              <span className="ml-auto text-xs text-muted-foreground">
                Submitted {formatDateTime(submission.submitted_at)}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {/* Score */}
              <div className="flex items-center gap-4">
                <div className="size-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col items-center justify-center shrink-0">
                  <span className="text-xl font-bold text-emerald-700">
                    {submission.score !== null && submission.score !== undefined
                      ? `${Math.round(submission.score)}%`
                      : "—"}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Score</p>
                  <p className="text-xs text-muted-foreground">MCQ assessment auto-graded</p>
                </div>
              </div>

              {/* Proctor Flags */}
              {submission.proctor_flags && submission.proctor_flags.length > 0 ? (
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 mb-2 text-amber-700">
                    <ShieldAlert className="size-3.5" />
                    <span className="text-xs font-bold">
                      {submission.proctor_flags.length} Proctor Flag{submission.proctor_flags.length > 1 ? "s" : ""} Detected
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {submission.proctor_flags.map((flag: unknown, idx: number) => {
                      const label = typeof flag === "string" 
                        ? flag 
                        : (flag && typeof flag === "object" && "type" in flag 
                            ? String((flag as Record<string, unknown>).type) 
                            : JSON.stringify(flag));
                      return (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-medium"
                        >
                          {label}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-emerald-600">
                  <CheckCircle2 className="size-3.5" />
                  <span className="text-xs font-medium">No proctor flags — clean submission</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Anti-Cheating & Proctoring Report (Requirement 3) ── */}
      {(() => {
        const assessFlags = (submission?.proctor_flags || []) as Record<string, unknown>[];
        const interviewFlags = (interview?.proctor_flags || []) as Record<string, unknown>[];
        const totalFlags = assessFlags.length + interviewFlags.length;
        const hasTabSwitch = interviewFlags.some(
          (f) => typeof f === "object" && f && (f.type === "tab_switch" || f.type === "window_blur")
        );

        if (totalFlags > 0) {
          return (
            <Card className="border-rose-300 bg-rose-50/70 card-shadow">
              <CardContent className="p-6">
                <div className="flex flex-wrap items-center gap-2 mb-3 text-rose-800">
                  <ShieldAlert className="size-5 text-rose-600 shrink-0" />
                  <h3 className="text-sm font-bold">Anti-Cheating Violations Detected ({totalFlags})</h3>
                  {hasTabSwitch && (
                    <span className="ml-auto px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-200 text-rose-800 border border-rose-300">
                      Interview Terminated on Tab Switch
                    </span>
                  )}
                </div>
                <p className="text-xs text-rose-700 mb-4 font-medium leading-relaxed">
                  Candidate triggered anti-cheating alerts during the hiring evaluation. Detailed incident breakdown:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {interviewFlags.length > 0 && (
                    <div className="p-4 rounded-xl bg-white border border-rose-200 space-y-2.5">
                      <p className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                        <Video className="size-3.5 text-rose-600" /> AI Video Interview ({interviewFlags.length} incidents)
                      </p>
                      <div className="space-y-2">
                        {interviewFlags.map((flag, idx) => (
                          <div key={idx} className="p-2.5 rounded-lg bg-rose-50/80 border border-rose-100 text-xs">
                            <span className="font-bold text-rose-900 uppercase tracking-wider text-[10px] block">
                              {String(flag.type || "Violation").replace(/_/g, " ")}
                            </span>
                            <span className="text-rose-800 text-[11px] block mt-0.5">
                              {String(flag.details || "Anti-cheating violation recorded.")}
                            </span>
                            {!!flag.timestamp && (
                              <span className="text-muted-foreground block text-[10px] mt-1">
                                {formatDateTime(String(flag.timestamp))}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {assessFlags.length > 0 && (
                    <div className="p-4 rounded-xl bg-white border border-rose-200 space-y-2.5">
                      <p className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                        <ClipboardCheck className="size-3.5 text-rose-600" /> Assessment ({assessFlags.length} incidents)
                      </p>
                      <div className="space-y-2">
                        {assessFlags.map((flag, idx) => {
                          const label = typeof flag === "string" ? flag : String(flag?.details || flag?.type || "Flag");
                          return (
                            <div key={idx} className="p-2.5 rounded-lg bg-rose-50/80 border border-rose-100 text-xs">
                              <span className="font-semibold text-rose-800 text-[11px] block">{label}</span>
                              {!!flag?.timestamp && (
                                <span className="text-muted-foreground block text-[10px] mt-1">
                                  {formatDateTime(String(flag.timestamp))}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        }

        if (submission || interview?.completed_at) {
          return (
            <Card className="border-emerald-200 bg-emerald-50/50">
              <CardContent className="p-4 flex items-center gap-3">
                <ShieldCheck className="size-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-emerald-900">Anti-Cheating Proctoring: Clean Session</p>
                  <p className="text-[11px] text-emerald-700">
                    No tab switches, window blurs, or unauthorized shortcut keys were detected during the assessment or AI interview.
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        }
        return null;
      })()}

      {/* ── Main AI Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Overall Score & Insights */}
        <div className="lg:col-span-1 space-y-6">
          {/* Overall Score */}
          <Card className="card-shadow border-border/60 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#8B5CF6]/5 rounded-bl-full blur-2xl" />
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="flex items-center gap-1.5 mb-4 text-[#5B21B6] font-bold text-sm bg-[#EDE9FE] px-3 py-1 rounded-full">
                <Sparkles className="size-4" /> Overall AI Score
              </div>
              {overallScore !== null ? (
                <>
                  <CircularProgress value={Math.round(overallScore)} size={140} strokeWidth={12} />
                  <p className="text-xs text-muted-foreground mt-5 leading-relaxed">
                    {scorecard?.ai_summary || "Scorecard generated from assessment & interview performance."}
                  </p>
                </>
              ) : (
                <div className="py-8 text-center space-y-3">
                  <p className="text-xs text-muted-foreground">Scorecard not yet generated for this candidate.</p>
                  <Button
                    size="sm"
                    onClick={handleGenerateScorecard}
                    disabled={generating}
                    className="brand-gradient text-white text-xs gap-1.5"
                  >
                    {generating ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
                    Generate Now
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Insights */}
          {insights.length > 0 && (
            <Card className="card-shadow border-border/60">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Video className="size-4 text-[#5B21B6]" />
                  <h3 className="text-sm font-bold text-foreground">AI Evaluation Insights</h3>
                </div>
                <ul className="space-y-3">
                  {insights.map((insight, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span className="size-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                      <p className="text-xs text-muted-foreground leading-relaxed">{insight}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Detailed Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">Evaluation Breakdown</h2>
            {scorecard && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleGenerateScorecard}
                disabled={generating}
                className="text-xs gap-1 text-muted-foreground"
              >
                <RefreshCw className={cn("size-3", generating && "animate-spin")} /> Re-evaluate
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Resume Match */}
            <Card className="border-border/60 bg-muted/20">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <FileText className="size-4 text-[#4F46E5]" /> Resume Match
                  </div>
                  <span className="text-lg font-bold text-[#4F46E5]">
                    {resumeScore !== null ? `${Math.round(resumeScore)}%` : "—"}
                  </span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#4F46E5] rounded-full transition-all"
                    style={{ width: `${resumeScore ?? 0}%` }}
                  />
                </div>
                <p className="text-xs tracking-tight text-muted-foreground mt-2">
                  Alignment with drive eligibility & criteria.
                </p>
              </CardContent>
            </Card>

            {/* Assessment Score */}
            <Card className="border-border/60 bg-muted/20">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <ClipboardCheck className="size-4 text-[#059669]" /> Assessment
                  </div>
                  <span className="text-lg font-bold text-[#059669]">
                    {assessmentScore !== null ? `${Math.round(assessmentScore)}%` : "—"}
                  </span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#10B981] rounded-full transition-all"
                    style={{ width: `${assessmentScore ?? 0}%` }}
                  />
                </div>
                <p className="text-xs tracking-tight text-muted-foreground mt-2">
                  Technical & aptitude assessment score.
                </p>
              </CardContent>
            </Card>

            {/* Communication Score (Soft Skills) */}
            <Card className="border-border/60 bg-muted/20">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <MessageSquare className="size-4 text-[#D97706]" /> Soft Skills
                  </div>
                  <span className="text-lg font-bold text-[#D97706]">
                    {commScore !== null ? `${Math.round(commScore)}%` : "—"}
                  </span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#F59E0B] rounded-full transition-all"
                    style={{ width: `${commScore ?? 0}%` }}
                  />
                </div>
                <p className="text-xs tracking-tight text-muted-foreground mt-2">
                  AI behavioral & communication evaluation.
                </p>
              </CardContent>
            </Card>

            {/* Technical Interview Score */}
            <Card className="border-border/60 bg-muted/20">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Terminal className="size-4 text-[#0284C7]" /> Technical Interview
                  </div>
                  <span className="text-lg font-bold text-[#0284C7]">
                    {techScore !== null ? `${Math.round(techScore)}%` : "—"}
                  </span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#0EA5E9] rounded-full transition-all"
                    style={{ width: `${techScore ?? 0}%` }}
                  />
                </div>
                <p className="text-xs tracking-tight text-muted-foreground mt-2">
                  AI technical depth & reasoning evaluation.
                </p>
              </CardContent>
            </Card>

            {/* Candidate Skills */}
            <Card className="border-border/60 bg-muted/20">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <TrendingUp className="size-4 text-[#9D174D]" /> Verified Skills
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {student.skills && student.skills.length > 0 ? (
                    student.skills.map((skill: string) => (
                      <span
                        key={skill}
                        className="text-xs font-medium bg-pink-100 text-pink-800 px-2 py-0.5 rounded-md"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground italic">No skills listed</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── Interview Evidence Section (Under 4 Pillar Cards) ── */}
          <Card className="card-shadow border-border/60">
            <CardContent className="p-6 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-4">
                <div className="flex items-center gap-2">
                  <Video className="size-5 text-[#7C3AED]" />
                  <div>
                    <h3 className="text-base font-bold text-foreground">Interview Evidence</h3>
                    <p className="text-xs text-muted-foreground">
                      Structured AI evaluation, rubric scoring, delivery metrics, and session signals.
                    </p>
                  </div>
                </div>
                {interview?.completed_at ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="size-3.5" /> Completed {formatDateTime(interview.completed_at)}
                  </span>
                ) : interviewExists ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    <Clock className="size-3.5" /> Scheduled / In Progress
                  </span>
                ) : null}
              </div>

              {/* Guard for null or pending interview data */}
              {!interview || (!interview.answers?.length && !interview.transcript) ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
                  <Bot className="size-8 text-muted-foreground mx-auto" />
                  <p className="text-xs font-medium text-foreground">No interview evaluation available yet</p>
                  <p className="text-[11px] text-muted-foreground">
                    Candidate has not completed their AI interview. Responses, rubrics, and delivery signals will display here upon completion.
                  </p>
                </div>
              ) : !interview.answers || interview.answers.length === 0 ? (
                /* Guard for Legacy Interview without rubric fields */
                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
                    <span className="font-bold">Legacy Interview Record:</span> Detailed rubric scoring and per-question delivery metrics were not recorded for this earlier session.
                  </div>
                  <div className="p-4 rounded-xl border bg-slate-50 space-y-2">
                    <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">Candidate Transcript</p>
                    <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                      {interview.transcript || "No transcript recorded."}
                    </p>
                  </div>
                </div>
              ) : (
                /* Full Structured Interview Evidence */
                <div className="space-y-6">
                  {/* Integrity Panel */}
                  {(() => {
                    const flags = interview.integrity_flags || {};
                    let tabSwitches = Number(flags.tab_switches || 0);
                    let focusLosses = Number(flags.focus_losses || 0);
                    let fullscreenExits = Number(flags.fullscreen_exits || 0);

                    // Check answer-level events if total flags are 0
                    if (tabSwitches === 0 && focusLosses === 0 && fullscreenExits === 0) {
                      for (const a of interview.answers) {
                        for (const ev of (a.integrity_events || [])) {
                          if (ev.type === "tab_switch" || ev.type === "visibility_hidden") tabSwitches++;
                          else if (ev.type === "window_blur" || ev.type === "blur") focusLosses++;
                          else if (ev.type === "fullscreen_exit") fullscreenExits++;
                        }
                      }
                    }

                    return (
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                            <ShieldAlert className="size-4 text-amber-500" />
                            <span>Integrity Monitoring Signals</span>
                          </div>
                          <span className="text-[11px] font-medium text-muted-foreground italic">
                            signals for human review, not proof of misconduct
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-3 pt-1">
                          <div className="p-3 rounded-lg bg-white border border-slate-200 text-center">
                            <span className="text-lg font-bold text-slate-900 block font-mono">{tabSwitches}</span>
                            <span className="text-[10px] uppercase font-semibold text-muted-foreground">Tab Switches</span>
                          </div>
                          <div className="p-3 rounded-lg bg-white border border-slate-200 text-center">
                            <span className="text-lg font-bold text-slate-900 block font-mono">{focusLosses}</span>
                            <span className="text-[10px] uppercase font-semibold text-muted-foreground">Focus Losses</span>
                          </div>
                          <div className="p-3 rounded-lg bg-white border border-slate-200 text-center">
                            <span className="text-lg font-bold text-slate-900 block font-mono">{fullscreenExits}</span>
                            <span className="text-[10px] uppercase font-semibold text-muted-foreground">Fullscreen Exits</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Skills Demonstrated vs Not Demonstrated */}
                  {(() => {
                    const sentiment = interview.sentiment_data || {};
                    const demonstratedSet = new Set<string>(sentiment.skills_demonstrated || []);
                    const missingSet = new Set<string>(sentiment.skills_missing || []);

                    // Collect from answers if not in sentiment_data
                    for (const a of interview.answers) {
                      for (const s of (a.evaluation?.skills_demonstrated || [])) demonstratedSet.add(s);
                      for (const s of (a.evaluation?.skills_missing || [])) missingSet.add(s);
                    }

                    const demonstratedList = Array.from(demonstratedSet);
                    const missingList = Array.from(missingSet);

                    if (demonstratedList.length === 0 && missingList.length === 0) return null;

                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                        {/* Demonstrated */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 uppercase tracking-wider">
                            <CheckCircle2 className="size-3.5 text-emerald-600" />
                            <span>Skills Demonstrated ({demonstratedList.length})</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {demonstratedList.length > 0 ? (
                              demonstratedList.map((skill, i) => (
                                <span
                                  key={i}
                                  className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200"
                                >
                                  {skill}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground italic">None recorded</span>
                            )}
                          </div>
                        </div>

                        {/* Not Demonstrated */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800 uppercase tracking-wider">
                            <XCircle className="size-3.5 text-rose-600" />
                            <span>Skills Not Demonstrated ({missingList.length})</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {missingList.length > 0 ? (
                              missingList.map((skill, i) => (
                                <span
                                  key={i}
                                  className="px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200"
                                >
                                  {skill}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground italic">None missed</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Per Answered Question Cards */}
                  <div className="space-y-5">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Question-by-Question Evaluation ({interview.answers.length})
                    </h4>

                    {interview.answers.map((ans, idx) => {
                      const qObj = (interview.questions || []).find((q) => {
                        if (typeof q === "object" && q) {
                          return String(q.id) === String(ans.question_id);
                        }
                        return false;
                      });

                      const questionText =
                        (typeof qObj === "object" && qObj ? qObj.question || qObj.text : typeof qObj === "string" ? qObj : null) ||
                        `Question ${idx + 1}`;
                      const category =
                        ans.category ||
                        (typeof qObj === "object" && qObj ? qObj.category : "technical") ||
                        "technical";
                      const isFollowUp =
                        Boolean(ans.is_follow_up) ||
                        (typeof qObj === "object" && qObj ? Boolean(qObj.is_follow_up || qObj.parent_id) : false);

                      const evalData = ans.evaluation;
                      const dm = ans.delivery_metrics;
                      const isExpanded = Boolean(expandedTranscripts[idx]);

                      return (
                        <div
                          key={idx}
                          className="p-5 rounded-xl border border-border/80 bg-slate-50/60 space-y-4 hover:border-indigo-200 transition-colors"
                        >
                          {/* Header: Category chip, follow-up marker, rubric score */}
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800">
                                {category.replace(/_/g, " ")}
                              </span>
                              {isFollowUp && (
                                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                                  <Sparkles className="size-3 text-amber-600" /> Follow-up Question
                                </span>
                              )}
                            </div>

                            {evalData?.rubric_score !== undefined && evalData.rubric_score !== null && (
                              <span className="px-2.5 py-1 rounded-lg text-xs font-bold font-mono bg-violet-100 text-violet-800 border border-violet-200">
                                Rubric Score: {Math.round(evalData.rubric_score)}/100
                              </span>
                            )}
                          </div>

                          {/* Question Text */}
                          <p className="text-sm font-bold text-gray-900 leading-snug">
                            {questionText}
                          </p>

                          {/* Collapsible Transcript */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                <MessageSquare className="size-3 text-indigo-500" /> Candidate Response
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleTranscript(idx)}
                                className="h-6 text-xs text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 p-1 px-2 font-medium gap-1"
                              >
                                {isExpanded ? (
                                  <>
                                    <ChevronUp className="size-3" /> Collapse Transcript
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="size-3" /> View Full Transcript
                                  </>
                                )}
                              </Button>
                            </div>

                            {isExpanded ? (
                              <div className="p-3.5 rounded-lg bg-white border border-gray-200 text-xs text-gray-800 leading-relaxed whitespace-pre-wrap font-sans">
                                {ans.transcript || "No transcript recorded."}
                              </div>
                            ) : (
                              <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed bg-white/60 p-2.5 rounded-lg border border-slate-200/60 italic">
                                “{ans.transcript ? ans.transcript.slice(0, 180) + (ans.transcript.length > 180 ? "..." : "") : "No transcript recorded."}”
                              </p>
                            )}
                          </div>

                          {/* Evidence Quote Callout */}
                          {evalData?.evidence_quote && (
                            <div className="p-3 rounded-lg bg-indigo-50/80 border-l-4 border-indigo-500 text-xs text-indigo-950 flex items-start gap-2.5">
                              <Quote className="size-4 text-indigo-500 shrink-0 mt-0.5" />
                              <div className="space-y-0.5">
                                <span className="font-semibold text-[10px] uppercase tracking-wider text-indigo-700 block">
                                  Evidence Quote
                                </span>
                                <p className="italic leading-relaxed">
                                  “{evalData.evidence_quote}”
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Key Points Covered & Missed */}
                          {evalData && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                              {/* Key points covered */}
                              <div className="p-3 rounded-lg bg-white border border-emerald-100 text-xs space-y-1.5">
                                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                                  <CheckCircle2 className="size-3 text-emerald-600" /> Key Points Covered ({evalData.key_points_covered?.length || 0})
                                </span>
                                {evalData.key_points_covered && evalData.key_points_covered.length > 0 ? (
                                  <ul className="space-y-1">
                                    {evalData.key_points_covered.map((pt, i) => (
                                      <li key={i} className="text-emerald-950 text-[11px] flex items-start gap-1.5 leading-snug">
                                        <span className="size-1 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                                        <span>{pt}</span>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="text-[11px] text-muted-foreground italic">None identified</p>
                                )}
                              </div>

                              {/* Key points missed */}
                              <div className="p-3 rounded-lg bg-white border border-rose-100 text-xs space-y-1.5">
                                <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1">
                                  <XCircle className="size-3 text-rose-600" /> Key Points Missed ({evalData.key_points_missed?.length || 0})
                                </span>
                                {evalData.key_points_missed && evalData.key_points_missed.length > 0 ? (
                                  <ul className="space-y-1">
                                    {evalData.key_points_missed.map((pt, i) => (
                                      <li key={i} className="text-rose-950 text-[11px] flex items-start gap-1.5 leading-snug">
                                        <span className="size-1 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                                        <span>{pt}</span>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="text-[11px] text-muted-foreground italic">None missed</p>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Delivery Chips per Answer */}
                          {dm && (
                            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/80 text-xs">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                Delivery:
                              </span>
                              <span className="px-2.5 py-0.5 rounded-full bg-white text-slate-800 text-[11px] font-medium border border-slate-200">
                                {Math.round(dm.wpm || 0)} WPM
                              </span>
                              <span className="px-2.5 py-0.5 rounded-full bg-white text-slate-800 text-[11px] font-medium border border-slate-200">
                                {Number(dm.longest_pause_sec || 0).toFixed(1)}s longest pause
                              </span>
                              <span className="px-2.5 py-0.5 rounded-full bg-white text-slate-800 text-[11px] font-medium border border-slate-200">
                                ~{dm.filler_count ?? dm.filler_words_approx ?? 0} fillers
                              </span>
                              <span className="text-[10px] text-muted-foreground italic">
                                informational, lightly weighted
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

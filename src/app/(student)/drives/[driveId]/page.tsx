"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  MapPin,
  Clock,
  Briefcase,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Circle,
  ArrowLeft,
  Building2,
  GraduationCap,
  IndianRupee,
  CalendarDays,
  Shield,
  Loader2,
  AlertCircle,
  XCircle,
  FileText,
  Video,
  Upload,
  LockKeyhole,
  Timer,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api";
import { dispatchNotificationsUpdated } from "@/lib/use-unread-count";
import { dispatchApplicationsUpdated } from "@/lib/use-nav-counts";

// ── Types ─────────────────────────────────────────────────────────────────────

type Drive = {
  id: string;
  company_id: string;
  title: string;
  description: string | null;
  package: string | null;
  location: string | null;
  min_cgpa: number | null;
  eligible_branches: string[];
  max_backlogs: number;
  selection_stages: string[];
  status: string;
  deadline: string | null;
  created_at: string;
};

type Application = {
  id: string;
  drive_id: string;
  drive?: { id: string };
  has_interview?: boolean;
  interview_completed?: boolean;
  interview_scheduled_at?: string | null;
  [key: string]: unknown;
};

type Assessment = {
  questions: unknown[];
  duration_mins: number;
  assessment_start?: string | null;
  assessment_end?: string | null;
  [key: string]: unknown;
};

type Submission = {
  score: number | null;
  [key: string]: unknown;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDeadline(iso: string | null) {
  if (!iso) return "Open";
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

function daysLeft(iso: string | null) {
  if (!iso) return null;
  const diff = Math.ceil(
    (new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  return diff > 0 ? diff : null;
}

const STAGE_LABELS: Record<string, { label: string; sublabel: string }> = {
  resume: { label: "Resume Screening", sublabel: "AI-powered screening of your resume" },
  assessment: { label: "Online Assessment", sublabel: "Aptitude/coding test" },
  ai_interview: { label: "AI Video Interview", sublabel: "Async video interview evaluated by AI" },
  hr_round: { label: "HR Round", sublabel: "Live interview with recruiter" },
  hr: { label: "HR Round", sublabel: "Live interview with recruiter" },
};

function StepIcon({ status }: { status: string }) {
  if (status === "completed")
    return <CheckCircle2 className="size-5 text-[#4F46E5]" />;
  if (status === "active")
    return (
      <div className="size-5 rounded-full border-2 border-[#4F46E5] flex items-center justify-center bg-[#EEF2FF]">
        <div className="size-2 rounded-full bg-[#4F46E5]" />
      </div>
    );
  return <Circle className="size-5 text-muted-foreground/40" />;
}

function companyDisplay(drive: Drive) {
  const palette = [
    "#4F46E5", "#0EA5E9", "#10B981", "#F59E0B", "#EF4444",
    "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16", "#F97316",
  ];
  const idx = drive.company_id.charCodeAt(0) % palette.length;
  return {
    initials: (drive.title.substring(0, 2) || "??").toUpperCase(),
    color: palette[idx],
  };
}

// ── Page ─────────────────────────────────────────────────────────────────────

/** Returns a human-friendly label for the assessment window relative to now. */
function assessmentWindowStatus(assessment: Assessment | null): "not_set" | "upcoming" | "open" | "closed" {
  if (!assessment) return "not_set";
  const now = Date.now();
  const start = assessment.assessment_start ? new Date(assessment.assessment_start).getTime() : null;
  const end = assessment.assessment_end ? new Date(assessment.assessment_end).getTime() : null;

  if (!start && !end) return "open"; // no time restriction set
  if (start && now < start) return "upcoming";
  if (end && now > end) return "closed";
  return "open";
}

function formatWindowDate(iso: string | null | undefined) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function DriveDetailPage() {
  const params = useParams();
  const driveId = params?.driveId as string;

  const [drive, setDrive] = useState<Drive | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applySuccess, setApplySuccess] = useState(false);
  const [existingApp, setExistingApp] = useState<Application | null>(null);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [studentResumeUrl, setStudentResumeUrl] = useState<string | null>(null);
  /** "upcoming" = window not opened yet, "closed" = window ended */
  const [assessmentWindowBlock, setAssessmentWindowBlock] = useState<"upcoming" | "closed" | null>(null);

  const resumeInputRef = useRef<HTMLInputElement>(null);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeUploadError, setResumeUploadError] = useState<string | null>(null);
  const [resumeUploadSuccess, setResumeUploadSuccess] = useState<string | null>(null);

  const handleResumeFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setResumeUploadError("Only PDF files are accepted.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setResumeUploadError("File too large. Maximum size is 5 MB.");
      return;
    }

    setResumeUploadError(null);
    setResumeUploadSuccess(null);
    setResumeUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const updated = await api.uploadResume(formData);
      setStudentResumeUrl(updated.resume_url);
      setResumeUploadSuccess("Resume attached successfully for screening!");
      setApplyError(null);
      setTimeout(() => setResumeUploadSuccess(null), 4000);
    } catch (err: unknown) {
      setResumeUploadError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setResumeUploading(false);
      if (resumeInputRef.current) resumeInputRef.current.value = "";
    }
  };

  useEffect(() => {
    if (!driveId) return;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getDrive(driveId);
        setDrive(data);

        // Fetch student profile to check for resume
        try {
          const me = await api.getMe();
          setStudentResumeUrl(me?.student_profile?.resume_url ?? null);
        } catch {
          // ignore — not logged in or not a student
        }

        // Check if student already applied
        try {
          const myApps = await api.getMyApplications();
          const match = myApps.find((a: Application) => a.drive_id === driveId || a.drive?.id === driveId);
          if (match) {
            setExistingApp(match);
            try {
              const sub = await api.getAssessmentSubmission(match.id);
              if (sub) setSubmission(sub);
            } catch {
              // Not submitted yet
            }
          }
        } catch (e) {
          console.error("Could not fetch my applications:", e);
        }

        // Check if drive has an assessment
        // NOTE: the backend will return 403 if the window hasn't opened yet;
        // we catch that and store null so the UI can show the upcoming state.
        try {
          const assess = await api.getDriveAssessment(driveId);
          if (assess && assess.questions && assess.questions.length > 0) {
            setAssessment(assess);
          }
        } catch (assessErr: unknown) {
          // Check if backend told us the window isn't open yet or is closed (403)
          const msg = assessErr instanceof Error ? assessErr.message : "";
          if (msg.toLowerCase().includes("has not opened yet") || msg.toLowerCase().includes("not opened")) {
            setAssessmentWindowBlock("upcoming");
          } else if (msg.toLowerCase().includes("window has closed") || msg.toLowerCase().includes("deadline")) {
            setAssessmentWindowBlock("closed");
          }
          // otherwise: no assessment configured for this drive yet
        }
      } catch (err: unknown) {
        console.error("[Drive Detail] API error:", err);
        setError(err instanceof Error ? err.message : "Drive not found");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [driveId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 className="size-8 animate-spin text-[#4F46E5]" />
        <p className="text-sm text-muted-foreground">Loading drive details…</p>
      </div>
    );
  }

  const handleApply = async () => {
    if (!drive) return;

    // Strict guard: resume is mandatory for the first stage (resume screening)
    if (!studentResumeUrl) {
      setApplyError(
        "A resume is required to apply. Resume screening is the first stage of the selection process."
      );
      return;
    }

    try {
      setApplying(true);
      setApplyError(null);
      const newApp = await api.applyToDrive(drive.id, studentResumeUrl);
      setApplySuccess(true);
      setExistingApp(newApp);
      dispatchNotificationsUpdated();
      dispatchApplicationsUpdated();
    } catch (err: unknown) {
      console.error("[Drive Detail] Apply error:", err);
      setApplyError(err instanceof Error ? err.message : "Failed to apply");
    } finally {
      setApplying(false);
    }
  };

  if (error || !drive) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card className="border-rose-200 bg-rose-50">
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <AlertCircle className="size-8 text-rose-500" />
            <p className="text-sm font-medium text-rose-700">{error ?? "Drive not found"}</p>
            <Link href="/drives">
              <Button size="sm" variant="outline" className="text-xs mt-2">
                <ArrowLeft className="size-3.5 mr-1.5" />
                Back to Browse Drives
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { initials, color } = companyDisplay(drive);
  const left = daysLeft(drive.deadline);

  const descriptionBlocks = (drive.description ?? "").split("\n\n").filter(Boolean);

  const stages = (drive.selection_stages ?? []).map((s, i) => ({
    id: s,
    ...(STAGE_LABELS[s] ?? { label: s, sublabel: "" }),
    status: i === 0 ? "active" : "pending",
  }));

  return (
    <div className="min-h-screen bg-background">

      {/* ── Breadcrumb ── */}
      <div className="px-6 pt-5 pb-0">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground max-w-7xl mx-auto">
          <Link href="/dashboard" className="hover:text-foreground transition-colors">
            Dashboard
          </Link>
          <ChevronRight className="size-3" />
          <Link href="/drives" className="hover:text-foreground transition-colors">
            Browse Drives
          </Link>
          <ChevronRight className="size-3" />
          <span className="text-foreground font-medium truncate">{drive.title}</span>
        </div>
      </div>

      {/* ── Header ── */}
      <div className="px-6 pt-4 pb-6 border-b border-border bg-white sticky top-14 z-10">
        <div className="max-w-7xl mx-auto">
          <Link
            href="/drives"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="size-3.5" /> Back to Drives
          </Link>

          <div className="flex flex-col md:flex-row md:items-start gap-4">
            {/* Company logo */}
            <div
              className="size-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold shrink-0 shadow-sm"
              style={{ backgroundColor: color }}
            >
              {initials}
            </div>

            {/* Meta */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-xl font-bold text-foreground">{drive.title}</h1>
                <span
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium"
                  style={{ backgroundColor: "#D1FAE5", color: "#065F46" }}
                >
                  <span className="size-1.5 rounded-full bg-[#10B981] animate-pulse" />
                  Live
                </span>
              </div>
              <p className="text-sm font-semibold text-foreground">Campus Drive</p>

              <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
                {drive.location && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="size-3.5 shrink-0" /> {drive.location}
                  </span>
                )}
                {drive.package && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <IndianRupee className="size-3.5 shrink-0" /> {drive.package}
                  </span>
                )}
                {drive.deadline && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CalendarDays className="size-3.5 shrink-0" /> Closes {formatDeadline(drive.deadline)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main + Sidebar ── */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex flex-col-reverse lg:flex-row gap-6">

          {/* ── Left: main content ── */}
          <div className="flex-1 min-w-0 space-y-6">

            {/* Eligibility */}
            <Card className="card-shadow border-border/60">
              <CardContent className="p-5">
                <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Shield className="size-4 text-[#4F46E5]" /> Eligibility Criteria
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* CGPA */}
                  {drive.min_cgpa !== null && drive.min_cgpa !== undefined && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                        <GraduationCap className="size-3.5" /> Minimum CGPA
                      </p>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EEF2FF] text-[#3730A3] text-sm font-bold">
                        {drive.min_cgpa} / 10
                      </span>
                    </div>
                  )}

                  {/* Backlogs */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      Backlogs Allowed
                    </p>
                    {drive.max_backlogs > 0 ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D1FAE5] text-[#065F46] text-xs font-medium">
                        <CheckCircle2 className="size-3.5" /> Up to {drive.max_backlogs}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FFE4E6] text-[#9F1239] text-xs font-medium">
                        <XCircle className="size-3.5" /> No active backlogs
                      </span>
                    )}
                  </div>

                  {/* Eligible branches */}
                  {drive.eligible_branches.length > 0 && (
                    <div className="sm:col-span-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                        <Building2 className="size-3.5" /> Eligible Branches
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {drive.eligible_branches.map((b) => (
                          <span
                            key={b}
                            className="px-3 py-1.5 rounded-lg bg-accent text-accent-foreground text-xs font-medium border border-border"
                          >
                            {b}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Job description */}
            {drive.description && (
              <Card className="card-shadow border-border/60">
                <CardContent className="p-5">
                  <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Briefcase className="size-4 text-[#4F46E5]" /> Job Description
                  </h2>
                  <div className="prose prose-sm max-w-none text-foreground">
                    {descriptionBlocks.length > 0 ? (
                      descriptionBlocks.map((block, i) => {
                        if (block.startsWith("## ")) {
                          return (
                            <h3
                              key={i}
                              className="text-sm font-semibold text-foreground mt-4 mb-2 first:mt-0"
                            >
                              {block.replace("## ", "")}
                            </h3>
                          );
                        }
                        if (block.startsWith("- ")) {
                          return (
                            <ul key={i} className="list-none space-y-1.5 mb-3">
                              {block
                                .split("\n")
                                .filter((l) => l.startsWith("- "))
                                .map((line, j) => (
                                  <li
                                    key={j}
                                    className="flex items-start gap-2 text-xs text-muted-foreground"
                                  >
                                    <span className="size-1.5 rounded-full bg-[#4F46E5] mt-1.5 shrink-0" />
                                    {line.replace("- ", "")}
                                  </li>
                                ))}
                            </ul>
                          );
                        }
                        return (
                          <p
                            key={i}
                            className="text-xs text-muted-foreground leading-relaxed mb-3"
                          >
                            {block.trim()}
                          </p>
                        );
                      })
                    ) : (
                      <p className="text-xs text-muted-foreground italic">
                        No description provided.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Selection process stepper */}
            {stages.length > 0 && (
              <Card className="card-shadow border-border/60">
                <CardContent className="p-5">
                  <h2 className="text-base font-semibold text-foreground mb-5 flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-[#4F46E5]" /> Selection Process
                  </h2>
                  <div className="space-y-0">
                    {stages.map((step, i) => {
                      const isLast = i === stages.length - 1;
                      const isActive = step.status === "active";
                      return (
                        <div key={step.id} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <StepIcon status={step.status} />
                            {!isLast && (
                              <div
                                className="w-0.5 flex-1 my-1 bg-border"
                                style={{ minHeight: 32 }}
                              />
                            )}
                          </div>
                          <div className={`pb-5 flex-1 min-w-0 ${isLast ? "pb-0" : ""}`}>
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p
                                  className={`text-sm font-medium ${
                                    isActive ? "text-[#4F46E5]" : "text-muted-foreground"
                                  }`}
                                >
                                  {step.label}
                                </p>
                                {step.sublabel && (
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {step.sublabel}
                                  </p>
                                )}
                              </div>
                              {isActive && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#EEF2FF] text-[#3730A3] shrink-0">
                                  First stage
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* ── Right: sticky apply card ── */}
          <aside className="w-full lg:w-72 shrink-0">
            <div className="sticky top-36">
              <Card className="card-shadow border-border/60">
                <CardContent className="p-5 space-y-4">
                  <div>
                    <p className="text-lg font-bold text-foreground">
                      {drive.package ?? "Package TBD"}
                    </p>
                    <p className="text-xs text-muted-foreground">Campus Drive</p>
                  </div>

                  <Separator />

                  <div className="space-y-2.5">
                    {drive.deadline && (
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Deadline</span>
                        <span className="font-medium text-rose-500">
                          {formatDeadline(drive.deadline)}
                        </span>
                      </div>
                    )}
                    {drive.min_cgpa !== null && drive.min_cgpa !== undefined && (
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Min CGPA</span>
                        <span className="font-medium text-foreground">{drive.min_cgpa}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Max Backlogs</span>
                      <span className="font-medium text-foreground">{drive.max_backlogs}</span>
                    </div>
                  </div>

                  <Separator />

                  {applyError && (
                    <div className="text-xs text-rose-500 bg-rose-50 p-2 rounded-md">
                      {applyError}
                    </div>
                  )}

                  {existingApp || applySuccess ? (
                    <div className="space-y-3">
                      <div className="text-sm font-semibold text-[#065F46] bg-[#D1FAE5] p-3 rounded-lg text-center flex items-center justify-center gap-2">
                        <CheckCircle2 className="size-4" /> Application Submitted ✓
                      </div>

                      {/* AI Video Interview Section if scheduled */}
                      {Boolean(existingApp?.has_interview) && (
                        existingApp?.interview_completed ? (
                          <div className="p-3.5 rounded-xl bg-violet-50 border border-violet-200 text-center space-y-1.5">
                            <p className="text-xs font-bold text-violet-800 flex items-center justify-center gap-1.5">
                              <CheckCircle2 className="size-4 text-violet-600" />
                              AI Video Interview Completed ✓
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              Interview responses submitted for AI evaluation.
                            </p>
                          </div>
                        ) : (
                          <div className="p-3.5 rounded-xl bg-[#EDE9FE] border border-[#DDD6FE] space-y-2.5 text-center">
                            <div>
                              <p className="text-xs font-bold text-[#5B21B6] flex items-center justify-center gap-1.5">
                                <Sparkles className="size-3.5 text-purple-600" /> AI Video Interview Scheduled
                              </p>
                              {existingApp?.interview_scheduled_at && (
                                <p className="text-[11px] text-purple-700 font-medium mt-1">
                                  {new Date(existingApp.interview_scheduled_at as string).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    hour: "numeric",
                                    minute: "numeric",
                                  })}
                                </p>
                              )}
                            </div>
                            <Link href={`/interview/${existingApp?.id}`}>
                              <Button className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold text-xs shadow-sm gap-1.5 animate-pulse">
                                <Video className="size-3.5" /> Start AI Interview Now
                              </Button>
                            </Link>
                          </div>
                        )
                      )}

                      {/* Assessment block — time-gated */}
                      {(() => {
                        const winStatus = assessmentWindowBlock ?? assessmentWindowStatus(assessment);
                        if (submission) {
                          return (
                            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                              <p className="text-xs font-bold text-emerald-800 flex items-center justify-center gap-1.5">
                                <CheckCircle2 className="size-4 text-emerald-600" />
                                Assessment Completed ({Math.round(submission.score ?? 0)}%)
                              </p>
                              <Link href={`/assessment/${existingApp?.id || driveId}`}>
                                <Button variant="outline" size="sm" className="w-full text-xs h-8">
                                  View Result
                                </Button>
                              </Link>
                            </div>
                          );
                        }
                        if (winStatus === "upcoming") {
                          return (
                            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 space-y-1.5 text-center">
                              <p className="text-xs font-bold text-amber-800 flex items-center justify-center gap-1.5">
                                <Timer className="size-3.5 text-amber-600" /> Assessment Not Yet Open
                              </p>
                              {assessment?.assessment_start && (
                                <p className="text-[11px] text-amber-700">
                                  Opens on {formatWindowDate(assessment.assessment_start as string | null)}
                                </p>
                              )}
                              <p className="text-[10px] text-muted-foreground">
                                The assessment window opens after the registration deadline ends.
                              </p>
                            </div>
                          );
                        }
                        if (winStatus === "closed") {
                          return (
                            <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 text-center space-y-1">
                              <p className="text-xs font-bold text-slate-600 flex items-center justify-center gap-1.5">
                                <LockKeyhole className="size-3.5" /> Assessment Window Closed
                              </p>
                              {assessment?.assessment_end && (
                                <p className="text-[11px] text-muted-foreground">
                                  Closed on {formatWindowDate(assessment.assessment_end as string | null)}
                                </p>
                              )}
                            </div>
                          );
                        }
                        if (winStatus === "open" && assessment) {
                          return (
                            <div className="p-3.5 rounded-xl bg-[#EEF2FF] border border-[#C7D2FE] space-y-2.5 text-center">
                              <div>
                                <p className="text-xs font-bold text-[#3730A3]">
                                  Technical Assessment Live
                                </p>
                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                  {assessment.questions?.length ?? 0} questions · {assessment.duration_mins} mins
                                </p>
                                {assessment.assessment_end && (
                                  <p className="text-[10px] text-rose-500 font-medium mt-0.5">
                                    Closes {formatWindowDate(assessment.assessment_end as string | null)}
                                  </p>
                                )}
                              </div>
                              <Link href={`/assessment/${existingApp?.id || driveId}`}>
                                <Button className="w-full brand-gradient text-white font-semibold text-xs shadow-sm gap-1.5 animate-pulse">
                                  <FileText className="size-3.5" /> Take Assessment Now
                                </Button>
                              </Link>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Hidden File Input for in-place resume upload */}
                      <input
                        ref={resumeInputRef}
                        type="file"
                        accept=".pdf,application/pdf"
                        className="hidden"
                        onChange={handleResumeFileChange}
                      />

                      {/* Resume screening stage requirement card */}
                      <div className="p-3.5 rounded-xl border border-indigo-100 bg-gradient-to-b from-indigo-50/50 to-card space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                            <FileText className="size-3.5 text-[#4F46E5]" />
                            Stage 1: Resume Screening
                          </span>
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                            Mandatory
                          </span>
                        </div>

                        {studentResumeUrl ? (
                          <div className="space-y-2">
                            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs">
                              <CheckCircle2 className="size-4 shrink-0 text-emerald-600 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-[11px] text-emerald-900">
                                  Resume Attached
                                </p>
                                <p className="text-[11px] text-emerald-700 mt-0.5">
                                  Your resume will be screened by AI as stage 1 of the hiring process.
                                </p>
                                <div className="flex items-center gap-2 mt-2 text-[11px]">
                                  <a
                                    href={studentResumeUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-emerald-700 hover:text-emerald-900 underline inline-flex items-center gap-1 font-medium"
                                  >
                                    View Resume <ExternalLink className="size-2.5" />
                                  </a>
                                  <span className="text-emerald-400">•</span>
                                  <button
                                    type="button"
                                    onClick={() => resumeInputRef.current?.click()}
                                    disabled={resumeUploading}
                                    className="text-indigo-600 hover:text-indigo-800 underline font-medium"
                                  >
                                    {resumeUploading ? "Uploading..." : "Replace PDF"}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2.5 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                            <div className="flex items-start gap-1.5">
                              <AlertCircle className="size-4 shrink-0 text-amber-600 mt-0.5" />
                              <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                                Resume screening is the mandatory 1st stage of hiring. You must add your resume before applying.
                              </p>
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => resumeInputRef.current?.click()}
                              disabled={resumeUploading}
                              className="w-full text-xs h-8 border-amber-300 text-amber-900 hover:bg-amber-100 gap-1.5 font-medium bg-white shadow-xs"
                            >
                              {resumeUploading ? (
                                <>
                                  <Loader2 className="size-3.5 animate-spin" /> Uploading PDF...
                                </>
                              ) : (
                                <>
                                  <Upload className="size-3.5" /> Upload Resume (PDF)
                                </>
                              )}
                            </Button>
                          </div>
                        )}

                        {resumeUploadError && (
                          <p className="text-[11px] text-rose-600 font-medium bg-rose-50 p-2 rounded border border-rose-200">
                            {resumeUploadError}
                          </p>
                        )}
                        {resumeUploadSuccess && (
                          <p className="text-[11px] text-emerald-600 font-medium bg-emerald-50 p-2 rounded border border-emerald-200">
                            {resumeUploadSuccess}
                          </p>
                        )}
                      </div>

                      <Button 
                        className="w-full brand-gradient text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                        onClick={handleApply}
                        disabled={applying || !studentResumeUrl || resumeUploading}
                        title={!studentResumeUrl ? "Resume addition is mandatory for Stage 1 screening" : undefined}
                      >
                        {applying ? (
                          <>
                            <Loader2 className="size-4 mr-2 animate-spin" />
                            Applying...
                          </>
                        ) : !studentResumeUrl ? (
                          "Attach Resume to Apply"
                        ) : (
                          "Apply Now"
                        )}
                      </Button>
                    </div>
                  )}
                  <Button variant="outline" className="w-full text-xs">
                    Save Drive
                  </Button>

                  {left !== null && (
                    <div className="flex items-center gap-1.5 justify-center">
                      <Clock className="size-3 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground text-center">
                        Closes in{" "}
                        <strong className="text-rose-500">{left} days</strong>
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <p className="text-center text-xs text-muted-foreground mt-3 hover:text-foreground cursor-pointer transition-colors">
                Share this drive &rarr;
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

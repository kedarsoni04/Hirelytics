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
  Download,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api";
import { dispatchNotificationsUpdated } from "@/lib/use-unread-count";
import { dispatchApplicationsUpdated } from "@/lib/use-nav-counts";
import { cn } from "@/lib/utils";

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
  drive?: { id: string; title?: string };
  current_stage?: string;
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
  offer: { label: "Job Offer", sublabel: "Official placement offer extended" },
  offered: { label: "Job Offer", sublabel: "Official placement offer extended" },
  hired: { label: "Final Hiring", sublabel: "Offer accepted and onboarding" },
};

type StepStatus = "completed" | "active" | "pending" | "rejected";

interface ResolvedStep {
  id: string;
  label: string;
  sublabel: string;
  status: StepStatus;
  badge?: {
    text: string;
    variant: "completed" | "active" | "rejected" | "pending";
  };
}

function StepIcon({ status }: { status: StepStatus }) {
  if (status === "completed")
    return (
      <div className="size-6 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-600 shrink-0 shadow-xs">
        <CheckCircle2 className="size-4 text-emerald-600" />
      </div>
    );
  if (status === "active")
    return (
      <div className="size-6 rounded-full border-2 border-[#4F46E5] flex items-center justify-center bg-[#EEF2FF] shrink-0 shadow-xs">
        <div className="size-2 rounded-full bg-[#4F46E5] animate-pulse" />
      </div>
    );
  if (status === "rejected")
    return (
      <div className="size-6 rounded-full bg-rose-100 border border-rose-300 flex items-center justify-center text-rose-600 shrink-0 shadow-xs">
        <XCircle className="size-4 text-rose-600" />
      </div>
    );
  return (
    <div className="size-6 rounded-full border-2 border-border flex items-center justify-center bg-muted/40 shrink-0">
      <Circle className="size-3 text-muted-foreground/30" />
    </div>
  );
}

function resolveSelectionStages(
  rawStages: string[],
  existingApp: Application | null,
  applySuccess: boolean,
  submission: Submission | null
): ResolvedStep[] {
  const hasApplied = Boolean(existingApp || applySuccess);
  const currentStage = String(existingApp?.current_stage || (applySuccess ? "applied" : "")).toLowerCase();
  const isRejected = currentStage === "rejected";
  const isHired = currentStage === "hired" || existingApp?.offer_status === "accepted";
  const isOffered = currentStage === "offered" || currentStage === "offer";

  // Milestones verified by persistent data
  const assessmentDone = Boolean(submission) || Boolean(existingApp?.assessment_completed);
  const interviewDone = Boolean(existingApp?.interview_completed);

  // Resume screening is completed if applicant moved forward or has completed assessment/interview
  const resumeDone =
    hasApplied &&
    (assessmentDone ||
      interviewDone ||
      isOffered ||
      isHired ||
      [
        "resume_screened",
        "shortlisted",
        "assessment",
        "ai_interview",
        "hr_round",
        "hr",
        "offered",
        "offer",
        "hired",
      ].includes(currentStage));

  const assessmentScore =
    submission?.score !== undefined && submission?.score !== null
      ? Math.round(Number(submission.score))
      : existingApp?.assessment_score !== undefined && existingApp?.assessment_score !== null
      ? Math.round(Number(existingApp.assessment_score))
      : null;

  return (rawStages ?? []).map((s, i) => {
    const norm = s.toLowerCase().trim();
    const cfg = STAGE_LABELS[norm] ?? {
      label: s.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      sublabel: "",
    };

    if (!hasApplied) {
      return {
        id: s,
        label: cfg.label,
        sublabel: cfg.sublabel,
        status: "pending",
        badge: i === 0 ? { text: "Stage 1", variant: "pending" } : undefined,
      };
    }

    // 1. Resume Screening
    if (norm === "resume" || norm === "applied") {
      if (resumeDone) {
        return {
          id: s,
          label: cfg.label,
          sublabel: "Resume screened and approved for next rounds",
          status: "completed",
          badge: { text: "Shortlisted ✓", variant: "completed" },
        };
      }
      if (isRejected) {
        return {
          id: s,
          label: cfg.label,
          sublabel: "Resume did not meet current role criteria",
          status: "rejected",
          badge: { text: "Not Cleared", variant: "rejected" },
        };
      }
      return {
        id: s,
        label: cfg.label,
        sublabel: "AI resume screening in progress",
        status: "active",
        badge: { text: "Screening in Progress", variant: "active" },
      };
    }

    // 2. Online Assessment
    if (norm === "assessment") {
      if (assessmentDone) {
        return {
          id: s,
          label: cfg.label,
          sublabel: "Assessment completed and submitted for evaluation",
          status: "completed",
          badge: {
            text: assessmentScore !== null ? `Score: ${assessmentScore}% ✓` : "Completed ✓",
            variant: "completed",
          },
        };
      }
      if (
        interviewDone ||
        isOffered ||
        isHired ||
        ["ai_interview", "hr_round", "hr", "offered", "offer", "hired"].includes(currentStage)
      ) {
        return {
          id: s,
          label: cfg.label,
          sublabel: "Assessment requirement satisfied",
          status: "completed",
          badge: { text: "Completed ✓", variant: "completed" },
        };
      }
      if (resumeDone) {
        if (isRejected) {
          return {
            id: s,
            label: cfg.label,
            sublabel: "Assessment cutoff not met",
            status: "rejected",
            badge: { text: "Not Cleared", variant: "rejected" },
          };
        }
        return {
          id: s,
          label: cfg.label,
          sublabel: "Technical assessment window open — take test now",
          status: "active",
          badge: { text: "Test Live / Action Required", variant: "active" },
        };
      }
      return {
        id: s,
        label: cfg.label,
        sublabel: cfg.sublabel,
        status: "pending",
        badge: { text: "Upcoming", variant: "pending" },
      };
    }

    // 3. AI Video Interview
    if (norm === "ai_interview") {
      if (interviewDone) {
        return {
          id: s,
          label: cfg.label,
          sublabel: "AI Video Interview evaluated and responses submitted",
          status: "completed",
          badge: { text: "Interview Completed ✓", variant: "completed" },
        };
      }
      if (
        isOffered ||
        isHired ||
        ["hr_round", "hr", "offered", "offer", "hired"].includes(currentStage)
      ) {
        return {
          id: s,
          label: cfg.label,
          sublabel: "Interview round cleared",
          status: "completed",
          badge: { text: "Cleared ✓", variant: "completed" },
        };
      }
      if (
        assessmentDone ||
        currentStage === "ai_interview" ||
        Boolean(existingApp?.has_interview)
      ) {
        if (isRejected) {
          return {
            id: s,
            label: cfg.label,
            sublabel: "Interview evaluation did not meet threshold",
            status: "rejected",
            badge: { text: "Not Cleared", variant: "rejected" },
          };
        }
        return {
          id: s,
          label: cfg.label,
          sublabel: existingApp?.has_interview
            ? "AI video interview is scheduled and ready to start"
            : "Next round: AI Video Interview",
          status: "active",
          badge: { text: "Ready to Take", variant: "active" },
        };
      }
      return {
        id: s,
        label: cfg.label,
        sublabel: cfg.sublabel,
        status: "pending",
        badge: { text: "Upcoming", variant: "pending" },
      };
    }

    // 4. HR Round
    if (norm === "hr_round" || norm === "hr") {
      if (isHired || isOffered) {
        return {
          id: s,
          label: cfg.label,
          sublabel: "HR interview successfully completed",
          status: "completed",
          badge: { text: "Cleared ✓", variant: "completed" },
        };
      }
      if (currentStage === "hr_round" || currentStage === "hr") {
        if (isRejected) {
          return {
            id: s,
            label: cfg.label,
            sublabel: "HR interview did not clear",
            status: "rejected",
            badge: { text: "Not Cleared", variant: "rejected" },
          };
        }
        return {
          id: s,
          label: cfg.label,
          sublabel: "Live recruiter interview scheduled / in progress",
          status: "active",
          badge: { text: "In Progress", variant: "active" },
        };
      }
      if (interviewDone) {
        if (isRejected) {
          return {
            id: s,
            label: cfg.label,
            sublabel: "Not selected for HR round",
            status: "rejected",
            badge: { text: "Not Cleared", variant: "rejected" },
          };
        }
        return {
          id: s,
          label: cfg.label,
          sublabel: "Under review by recruiter for HR interview schedule",
          status: "active",
          badge: { text: "Current Stage", variant: "active" },
        };
      }
      return {
        id: s,
        label: cfg.label,
        sublabel: cfg.sublabel,
        status: "pending",
        badge: { text: "Upcoming", variant: "pending" },
      };
    }

    // 5. Job Offer
    if (norm === "offer" || norm === "offered") {
      if (isHired) {
        return {
          id: s,
          label: cfg.label,
          sublabel: "Offer accepted and verified",
          status: "completed",
          badge: { text: "Offer Accepted ✓", variant: "completed" },
        };
      }
      if (isOffered) {
        if (existingApp?.offer_status === "rejected") {
          return {
            id: s,
            label: cfg.label,
            sublabel: "Offer was declined by candidate",
            status: "rejected",
            badge: { text: "Offer Declined", variant: "rejected" },
          };
        }
        return {
          id: s,
          label: cfg.label,
          sublabel: "Official placement offer extended — response required",
          status: "active",
          badge: { text: "Decision Required", variant: "active" },
        };
      }
      return {
        id: s,
        label: cfg.label,
        sublabel: cfg.sublabel,
        status: "pending",
        badge: { text: "Upcoming", variant: "pending" },
      };
    }

    // Generic fallback
    return {
      id: s,
      label: cfg.label,
      sublabel: cfg.sublabel,
      status: "pending",
      badge: undefined,
    };
  });
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
  const [acceptedOtherApp, setAcceptedOtherApp] = useState<Application | null>(null);
  const [respondingOffer, setRespondingOffer] = useState(false);
  const [offerError, setOfferError] = useState<string | null>(null);

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

  const handleOfferResponse = async (response: "accepted" | "rejected") => {
    if (!existingApp) return;
    try {
      setRespondingOffer(true);
      setOfferError(null);
      const updated = await api.respondToOffer(existingApp.id, response);
      // Use the server-returned state to keep everything in sync
      if (updated) {
        setExistingApp((prev) => prev ? { ...prev, ...updated } : prev);
      } else {
        setExistingApp((prev) =>
          prev
            ? {
                ...prev,
                offer_status: response,
                // current_stage stays as 'offered' — recruiter decides final hire
              }
            : prev
        );
      }
      dispatchNotificationsUpdated();
      dispatchApplicationsUpdated();
    } catch (err: unknown) {
      setOfferError(err instanceof Error ? err.message : "Failed to respond to offer. Please try again.");
    } finally {
      setRespondingOffer(false);
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
          const other = myApps.find(
            (a: Application) =>
              (a.offer_status === "accepted" || a.current_stage === "hired") &&
              a.drive_id !== driveId &&
              a.drive?.id !== driveId
          );
          if (other) {
            setAcceptedOtherApp(other);
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

  const stages = resolveSelectionStages(
    drive.selection_stages ?? [],
    existingApp,
    applySuccess,
    submission
  );

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
                      const isCompleted = step.status === "completed";
                      const isActive = step.status === "active";
                      const isRejectedStep = step.status === "rejected";

                      const badgeClasses = {
                        completed: "bg-emerald-100 text-emerald-800",
                        active: "bg-[#EEF2FF] text-[#3730A3]",
                        rejected: "bg-rose-100 text-rose-700",
                        pending: "bg-muted text-muted-foreground",
                      };

                      return (
                        <div key={step.id} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <StepIcon status={step.status} />
                            {!isLast && (
                              <div
                                className={cn(
                                  "w-0.5 flex-1 my-1",
                                  isCompleted ? "bg-emerald-300" : "bg-border"
                                )}
                                style={{ minHeight: 32 }}
                              />
                            )}
                          </div>
                          <div className={`pb-5 flex-1 min-w-0 ${isLast ? "pb-0" : ""}`}>
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p
                                  className={cn(
                                    "text-sm font-medium",
                                    isActive && "text-[#4F46E5]",
                                    isCompleted && "text-emerald-700",
                                    isRejectedStep && "text-rose-600",
                                    !isActive && !isCompleted && !isRejectedStep && "text-muted-foreground"
                                  )}
                                >
                                  {step.label}
                                </p>
                                {step.sublabel && (
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {step.sublabel}
                                  </p>
                                )}
                              </div>
                              {step.badge && (
                                <span
                                  className={cn(
                                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold shrink-0",
                                    badgeClasses[step.badge.variant]
                                  )}
                                >
                                  {step.badge.text}
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

                      {/* Offer Decision & Letter Card */}
                      {Boolean(
                        existingApp?.current_stage === "offered" ||
                        existingApp?.current_stage === "hired" ||
                        existingApp?.offer_status === "accepted" ||
                        existingApp?.offer_status === "rejected" ||
                        existingApp?.current_stage === "offer"
                      ) && (
                        <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-300 space-y-3 shadow-xs">
                          <div className="flex items-center gap-2">
                            <div className="size-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0">
                              <Sparkles className="size-4" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                                Placement Offer
                              </p>
                              <p className="text-xs text-emerald-700 font-semibold">
                                {drive.package || "Package Confirmed"}
                              </p>
                            </div>
                          </div>

                          {existingApp?.offer_status === "rejected" ? (
                            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-center">
                              <p className="text-xs font-bold text-rose-700">You declined this offer</p>
                              <p className="text-[11px] text-rose-600 mt-0.5">
                                The recruiter has been notified of your decision.
                              </p>
                            </div>
                          ) : existingApp?.offer_status === "accepted" || existingApp?.current_stage === "hired" ? (
                            <div className="space-y-2">
                              <div className="p-2.5 rounded-lg bg-emerald-100/80 border border-emerald-300 text-center">
                                <p className="text-xs font-bold text-emerald-900 flex items-center justify-center gap-1.5">
                                  <CheckCircle2 className="size-4 text-emerald-700" />
                                  Offer Accepted 🎉
                                </p>
                                <p className="text-[11px] text-emerald-800 mt-0.5">
                                  You are placed! Campus placement policy now blocks applications to other drives.
                                </p>
                              </div>
                              {(existingApp?.offer_letter_url as string | undefined) && (
                                <a
                                  href={existingApp!.offer_letter_url as string}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-xs"
                                >
                                  <Download className="size-3.5" />
                                  Download Offer Letter (PDF)
                                </a>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-2.5">
                              <p className="text-xs text-emerald-900 leading-relaxed font-medium">
                                Congratulations! {drive.title} has extended an official placement offer to you. Please accept or decline below:
                              </p>
                              {offerError && (
                                <p className="text-[11px] text-rose-600 bg-rose-50 p-2 rounded border border-rose-200">
                                  {offerError}
                                </p>
                              )}
                              <div className="grid grid-cols-2 gap-2 pt-1">
                                <Button
                                  size="sm"
                                  onClick={() => handleOfferResponse("accepted")}
                                  disabled={respondingOffer}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold h-9 gap-1"
                                >
                                  {respondingOffer ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3.5" />}
                                  Accept Offer
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleOfferResponse("rejected")}
                                  disabled={respondingOffer}
                                  className="border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-semibold h-9 gap-1"
                                >
                                  {respondingOffer ? <Loader2 className="size-3 animate-spin" /> : <X className="size-3.5" />}
                                  Decline
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

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

                      {/* Assessment block — visible only once shortlisted and time-gated */}
                      {(() => {
                        const isShortlisted = ["shortlisted", "assessment", "ai_interview", "offer", "offered", "hired"].includes(
                          existingApp?.current_stage || ""
                        );

                        // If candidate is NOT shortlisted yet (e.g. applied or resume_screened)
                        if (!isShortlisted) {
                          return (
                            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1">
                              <p className="text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5">
                                <Clock className="size-3.5 text-slate-500" /> Application Under Review
                              </p>
                              <p className="text-[11px] text-muted-foreground">
                                Resume screening is in progress. The online assessment will become available once you are shortlisted.
                              </p>
                            </div>
                          );
                        }

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
                  ) : acceptedOtherApp ? (
                    <div className="space-y-3">
                      <div className="p-4 rounded-xl bg-amber-50 border-2 border-amber-300 space-y-2 text-center">
                        <div className="size-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                          <LockKeyhole className="size-5" />
                        </div>
                        <p className="text-xs font-bold text-amber-900">
                          Placement Offer Accepted
                        </p>
                        <p className="text-[11px] text-amber-800 leading-relaxed">
                          You have already accepted an offer with{" "}
                          <strong>
                            {acceptedOtherApp.drive?.title ?? "another company"}
                          </strong>
                          .
                        </p>
                        <p className="text-[10px] text-amber-700">
                          As per campus placement guidelines, students with an accepted offer cannot apply to additional placement drives.
                        </p>
                        <Button
                          disabled
                          className="w-full bg-muted text-muted-foreground cursor-not-allowed text-xs font-semibold mt-2"
                        >
                          Applications Blocked (Placed)
                        </Button>
                      </div>
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

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Send,
  Star,
  FileText,
  XCircle,
  Sparkles,
  Clock,
  ArrowRight,
  Trophy,
  RotateCcw,
  Search,
  Filter,
  SlidersHorizontal,
  TrendingUp,
  Calendar,
  CheckCircle2,
  Video,
  Download,
  UserCheck,
  Check,
  X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { dispatchNotificationsUpdated } from "@/lib/use-unread-count";

type AppStage =
  | "applied"
  | "resume_screened"
  | "ai_screened"
  | "assessment"
  | "ai_interview"
  | "shortlisted"
  | "hr_round"
  | "offer"
  | "offered"
  | "hired"
  | "rejected"
  | "withdrawn";

interface ApplicationDrive {
  id?: string;
  title?: string;
  company_name?: string | null;
  package?: number | string | null;
  location?: string | null;
  status?: string | null;
}

interface Application {
  id: string;
  student_id: string;
  drive_id: string;
  current_stage: AppStage;
  applied_at: string;
  updated_at?: string | null;
  offer_status?: string | null;
  offer_letter_url?: string | null;
  offer_responded_at?: string | null;
  drive?: ApplicationDrive | null;
  overall_ai_score?: number | null;
  has_assessment?: boolean;
  assessment_completed?: boolean;
  assessment_score?: number | null;
  assessment_start?: string | null;
  assessment_end?: string | null;
  assessment_duration_mins?: number | null;
  is_shortlisted?: boolean;
  has_interview?: boolean;
  interview_completed?: boolean;
  interview_scheduled_at?: string | null;
  interview_id?: string | null;
}


// ── Stage config ───────────────────────────────────────────────────────────────

const stageConfig: Record<
  string,
  {
    label: string;
    bg: string;
    text: string;
    icon: React.ElementType;
    dot: string;
  }
> = {
  applied: {
    label: "Applied",
    bg: "#EEF2FF",
    text: "#3730A3",
    icon: Send,
    dot: "#6366F1",
  },
  resume_screened: {
    label: "Resume Screened",
    bg: "#EDE9FE",
    text: "#5B21B6",
    icon: Sparkles,
    dot: "#8B5CF6",
  },
  ai_screened: {
    label: "AI Screened",
    bg: "#EDE9FE",
    text: "#5B21B6",
    icon: Sparkles,
    dot: "#8B5CF6",
  },
  assessment: {
    label: "Assessment",
    bg: "#FEF3C7",
    text: "#92400E",
    icon: FileText,
    dot: "#F59E0B",
  },
  ai_interview: {
    label: "AI Interview",
    bg: "#DBEAFE",
    text: "#1E40AF",
    icon: Calendar,
    dot: "#3B82F6",
  },
  shortlisted: {
    label: "Shortlisted",
    bg: "#D1FAE5",
    text: "#065F46",
    icon: Star,
    dot: "#10B981",
  },
  hr_round: {
    label: "HR Round",
    bg: "#E0E7FF",
    text: "#3730A3",
    icon: Calendar,
    dot: "#6366F1",
  },
  offer: {
    label: "Offer Extended 🎉",
    bg: "#D1FAE5",
    text: "#065F46",
    icon: Trophy,
    dot: "#10B981",
  },
  offered: {
    label: "Offer Extended 🎉",
    bg: "#D1FAE5",
    text: "#065F46",
    icon: Trophy,
    dot: "#10B981",
  },
  hired: {
    label: "Hired 🎉",
    bg: "#CCFBF1",
    text: "#115E59",
    icon: UserCheck,
    dot: "#0D9488",
  },
  rejected: {
    label: "Rejected",
    bg: "#FFE4E6",
    text: "#9F1239",
    icon: XCircle,
    dot: "#F43F5E",
  },
  withdrawn: {
    label: "Withdrawn",
    bg: "#F1F5F9",
    text: "#475569",
    icon: RotateCcw,
    dot: "#94A3B8",
  },
};

// ── Stage summary counts ──────────────────────────────────────────────────────

const summaryStages = ["applied", "assessment", "ai_interview", "shortlisted", "offered", "hired", "rejected"];

function getStageCounts(applications: Application[]) {
  return summaryStages.map((stage) => ({
    stage,
    count: applications.filter((a) => {
      if (stage === "offered") return a.current_stage === "offered" || a.current_stage === "offer";
      return a.current_stage === stage;
    }).length,
  }));
}


// ── Helpers ───────────────────────────────────────────────────────────────────

function companyDisplay(companyName?: string | null) {
  const name = companyName || "Unknown";
  const palette = [
    "#4F46E5", "#0EA5E9", "#10B981", "#F59E0B", "#EF4444",
    "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16", "#F97316",
  ];
  const idx = name.charCodeAt(0) % palette.length;
  return {
    initials: (name.substring(0, 2) || "??").toUpperCase(),
    color: palette[idx],
  };
}

function formatDate(iso?: string | null) {
  if (!iso) return "--";
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

function isCandidateShortlisted(stage: string): boolean {
  return ["shortlisted", "assessment", "ai_interview", "offer", "offered", "hired"].includes(stage);
}

function formatWindowDateTime(iso?: string | null) {
  if (!iso) return "";
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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [respondingAppId, setRespondingAppId] = useState<string | null>(null);

  const handleOfferResponse = async (appId: string, response: "accepted" | "rejected") => {
    const actionText = response === "accepted" ? "ACCEPT" : "DECLINE";
    if (!confirm(`Are you sure you want to ${actionText} this job offer?`)) return;
    try {
      setRespondingAppId(appId);
      await api.respondToOffer(appId, response);
      const data = await api.getMyApplications();
      setApplications(data);
      dispatchNotificationsUpdated();
    } catch (err: unknown) {
      console.error("Offer response error:", err);
      alert(err instanceof Error ? err.message : "Failed to record offer response.");
    } finally {
      setRespondingAppId(null);
    }
  };

  useEffect(() => {
    const loadApps = async () => {
      try {
        setLoading(true);
        const data = await api.getMyApplications();
        setApplications(data);
      } catch (err: unknown) {
        console.error("Failed to fetch applications:", err);
        setError(err instanceof Error ? err.message : "Failed to load applications.");
      } finally {
        setLoading(false);
      }
    };
    loadApps();
  }, []);

  if (loading) {
    return <div className="p-10 text-center">Loading applications...</div>;
  }

  if (error) {
    return <div className="p-10 text-center text-red-500">{error}</div>;
  }

  const stageCounts = getStageCounts(applications);
  const total = applications.length;
  const activeCount = applications.filter(
    (a) => !["rejected", "withdrawn"].includes(a.current_stage)
  ).length;

  // ── AI Insight (real data) ──────────────────────────────────────────────────
  const appsWithScore = applications.filter(
    (a) => typeof a.overall_ai_score === "number" && a.overall_ai_score > 0
  );
  const hasInsight = appsWithScore.length > 0;
  const bestApp = hasInsight
    ? appsWithScore.reduce((best, a) =>
      (a.overall_ai_score ?? 0) > (best.overall_ai_score ?? 0) ? a : best
    )
    : null;
  const bestScore = bestApp?.overall_ai_score ?? 0;
  const avgScore = hasInsight
    ? Math.round(
      appsWithScore.reduce((sum, a) => sum + (a.overall_ai_score ?? 0), 0) /
      appsWithScore.length
    )
    : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Applications</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {total} applications · {activeCount} active
          </p>
        </div>
        <Link href="/drives">
          <Button className="brand-gradient text-white hover:opacity-90 transition-opacity gap-2">
            <Send className="size-4" />
            Find New Drives
          </Button>
        </Link>
      </div>

      {/* ── Stage summary strip ── */}
      <div className="flex overflow-x-auto gap-3 pb-1">
        {stageCounts.map(({ stage, count }) => {
          const cfg = stageConfig[stage];
          const Icon = cfg.icon;
          return (
            <div
              key={stage}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-card card-shadow shrink-0 min-w-0"
            >
              <div
                className="size-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: cfg.bg }}
              >
                <Icon className="size-3.5" style={{ color: cfg.text }} />
              </div>
              <div className="min-w-0">
                <p className="text-xs tracking-tight text-muted-foreground truncate">{cfg.label}</p>
                <p className="text-sm font-bold text-foreground">{count}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input placeholder="Search by company or role…" className="pl-9 text-xs h-8" />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
            <Filter className="size-3.5" /> Stage
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
            <SlidersHorizontal className="size-3.5" /> Sort
          </Button>
        </div>
      </div>

      {/* ── Table ── */}
      <Card className="card-shadow border-border/60 overflow-hidden">
        {/* Table header */}
        <div className="hidden md:grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 px-5 py-3 bg-muted/50 border-b border-border text-xs tracking-tight font-semibold uppercase tracking-wider text-muted-foreground">
          <span>Company</span>
          <span>Role</span>
          <span className="text-center">Applied</span>
          <span className="text-center">AI Score</span>
          <span className="text-center">Stage</span>
          <span></span>
        </div>

        {/* Rows */}
        <div className="divide-y divide-border/60">
          {applications.length === 0 && (
            <div className="p-8 text-center text-muted-foreground text-sm">No applications found.</div>
          )}
          {applications.map((app) => {
            const stage = (app.current_stage || "applied") as AppStage;
            const cfg = stageConfig[stage] || stageConfig["applied"];
            const isActive = !["rejected", "withdrawn"].includes(stage);
            const { initials, color } = companyDisplay(app.drive?.company_name);

            return (
              <div
                key={app.id}
                className="flex flex-col md:grid md:grid-cols-[auto_1fr_auto_auto_auto_auto] gap-3 md:gap-4 px-5 py-4 hover:bg-muted/20 transition-colors group"
              >
                {/* Company */}
                <div className="flex items-center gap-3">
                  <div
                    className="size-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ backgroundColor: color }}
                  >
                    {initials}
                  </div>
                  <div className="md:hidden flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{app.drive?.title}</p>
                    <p className="text-xs text-muted-foreground">{app.drive?.company_name}</p>
                  </div>
                </div>

                {/* Role (desktop only) */}
                <div className="hidden md:flex flex-col justify-center min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate group-hover:text-[#4F46E5] transition-colors">
                    {app.drive?.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {app.drive?.company_name} · {app.drive?.package || "N/A"}
                  </p>
                  {app.has_interview && !app.interview_completed ? (
                    <div className="mt-1">
                      {app.interview_scheduled_at ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-md">
                          <Calendar className="size-3" /> Interview: {new Date(app.interview_scheduled_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "numeric" })}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-md">
                          <Sparkles className="size-3" /> AI Interview Ready
                        </span>
                      )}
                    </div>
                  ) : isActive ? (
                    <p className="text-xs tracking-tight text-muted-foreground/70 mt-1 flex items-center gap-1">
                      <Clock className="size-3" /> Updated {formatDate(app.updated_at)}
                    </p>
                  ) : null}
                </div>

                {/* Applied date */}
                <div className="hidden md:flex flex-col justify-center items-center">
                  <p className="text-xs text-foreground whitespace-nowrap">{formatDate(app.applied_at)}</p>
                </div>

                {/* AI Score */}
                <div className="hidden md:flex flex-col justify-center items-center">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-[#EDE9FE] text-[#5B21B6]">
                    <Sparkles className="size-3" />
                    {typeof app.overall_ai_score === "number" ? Math.round(app.overall_ai_score) : "--"}
                  </span>
                </div>

                {/* Stage badge */}
                <div className="flex md:justify-center items-center">
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap"
                    style={{ backgroundColor: cfg.bg, color: cfg.text }}
                  >
                    <span
                      className="size-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: cfg.dot }}
                    />
                    {cfg.label}
                  </span>
                </div>

                {/* Action */}
                <div className="hidden md:flex items-center justify-end gap-2">
                  {(() => {
                    const candidateShortlisted = isCandidateShortlisted(app.current_stage) || app.is_shortlisted;
                    if (!app.has_assessment && !candidateShortlisted) return null;

                    // If drive has assessment, but candidate is not shortlisted yet
                    if (app.has_assessment && !candidateShortlisted) {
                      return (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 whitespace-nowrap" title="Assessment opens only after resume screening shortlist">
                          <Clock className="size-3" /> Screening in progress
                        </span>
                      );
                    }

                    // Candidate is shortlisted
                    if (candidateShortlisted && app.has_assessment) {
                      if (app.assessment_completed) {
                        return (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700 whitespace-nowrap">
                            <CheckCircle2 className="size-3" /> Test: {Math.round(app.assessment_score ?? 0)}%
                          </span>
                        );
                      }

                      const nowMs = Date.now();
                      const startMs = app.assessment_start ? new Date(app.assessment_start).getTime() : null;
                      const endMs = app.assessment_end ? new Date(app.assessment_end).getTime() : null;
                      const isUpcoming = startMs && nowMs < startMs;
                      const isClosed = endMs && nowMs > endMs;

                      if (isUpcoming) {
                        return (
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 border border-amber-200 text-amber-800 whitespace-nowrap"
                            title={`Opens on ${formatWindowDateTime(app.assessment_start)}`}
                          >
                            <Calendar className="size-3 text-amber-600" /> Exam: {formatWindowDateTime(app.assessment_start)}
                          </span>
                        );
                      }

                      if (isClosed) {
                        return (
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 border border-rose-200 text-rose-700 whitespace-nowrap"
                            title={`Deadline was ${formatWindowDateTime(app.assessment_end)}`}
                          >
                            <XCircle className="size-3 text-rose-500" /> Exam Closed
                          </span>
                        );
                      }

                      return (
                        <Link href={`/assessment/${app.id}`}>
                          <Button size="sm" className="h-7 px-2.5 text-xs font-semibold bg-[#4F46E5] hover:bg-[#4338CA] text-white shadow-sm gap-1 whitespace-nowrap animate-pulse">
                            <FileText className="size-3" /> Take Assessment {app.assessment_end ? `(Ends ${formatWindowDateTime(app.assessment_end)})` : ""}
                          </Button>
                        </Link>
                      );
                    }

                    return null;
                  })()}

                  {app.has_interview && (
                    app.interview_completed ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-violet-50 border border-violet-200 text-violet-700 whitespace-nowrap">
                        <CheckCircle2 className="size-3" /> Interview Done
                      </span>
                    ) : (
                      <Link href={`/interview/${app.id}`}>
                        <Button size="sm" className="h-7 px-2.5 text-xs font-semibold bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-sm gap-1 whitespace-nowrap animate-pulse">
                          <Video className="size-3" /> Take AI Interview
                        </Button>
                      </Link>
                    )
                  )}

                  {/* Offer Extended or Hired Actions (Requirement 4 & 5) */}
                  {(app.current_stage === "offered" || app.current_stage === "offer") && (
                    <div className="flex items-center gap-1.5">
                      {app.offer_status === "accepted" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700 whitespace-nowrap">
                          <CheckCircle2 className="size-3" /> Offer Accepted ✓
                        </span>
                      ) : app.offer_status === "rejected" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 border border-rose-200 text-rose-700 whitespace-nowrap">
                          <XCircle className="size-3" /> Offer Declined
                        </span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <Button
                            size="sm"
                            disabled={respondingAppId === app.id}
                            onClick={() => handleOfferResponse(app.id, "accepted")}
                            className="h-7 px-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm gap-1"
                          >
                            <Check className="size-3" /> Accept Offer
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={respondingAppId === app.id}
                            onClick={() => handleOfferResponse(app.id, "rejected")}
                            className="h-7 px-2.5 text-xs font-bold text-rose-600 border-rose-300 hover:bg-rose-50 gap-1"
                          >
                            <X className="size-3" /> Decline
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {app.current_stage === "hired" && (
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-teal-50 border border-teal-200 text-teal-800 whitespace-nowrap">
                        <UserCheck className="size-3" /> Hired ✓
                      </span>
                      {app.offer_letter_url && (
                        <a href={app.offer_letter_url} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" className="h-7 px-2.5 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white gap-1 shadow-sm">
                            <Download className="size-3" /> Offer Letter
                          </Button>
                        </a>
                      )}
                    </div>
                  )}

                  {isActive ? (
                    <Link href={`/drives/${app.drive_id}`}>
                      <Button variant="ghost" size="sm" className="text-xs gap-1 h-7 group-hover:bg-accent">
                        View <ArrowRight className="size-3.5" />
                      </Button>
                    </Link>
                  ) : (
                    <span className="text-xs text-muted-foreground px-2">—</span>
                  )}
                </div>

                {/* Mobile: extra info */}
                <div className="md:hidden flex flex-col gap-2 pt-2 border-t border-border/40">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs tracking-tight text-muted-foreground">{formatDate(app.applied_at)}</span>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs tracking-tight font-bold bg-[#EDE9FE] text-[#5B21B6]">
                        <Sparkles className="size-2.5" />
                        {typeof app.overall_ai_score === "number" ? Math.round(app.overall_ai_score) : "--"}
                      </span>
                    </div>
                    {isActive && (
                      <Link href={`/drives/${app.drive_id}`}>
                        <Button variant="ghost" size="sm" className="text-xs h-7 gap-1">
                          View <ArrowRight className="size-3" />
                        </Button>
                      </Link>
                    )}
                  </div>

                  {/* Mobile Offer Actions */}
                  {(app.current_stage === "offered" || app.current_stage === "offer") && (
                    <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex flex-col gap-2">
                      <p className="text-xs font-bold text-emerald-900 flex items-center gap-1">
                        <Trophy className="size-3.5 text-emerald-600" /> Job Offer Extended!
                      </p>
                      {app.offer_status === "accepted" ? (
                        <span className="text-xs font-semibold text-emerald-700">You accepted this offer ✓</span>
                      ) : app.offer_status === "rejected" ? (
                        <span className="text-xs font-semibold text-rose-700">You declined this offer ❌</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            disabled={respondingAppId === app.id}
                            onClick={() => handleOfferResponse(app.id, "accepted")}
                            className="flex-1 h-7 text-xs font-bold bg-emerald-600 text-white"
                          >
                            Accept Offer
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={respondingAppId === app.id}
                            onClick={() => handleOfferResponse(app.id, "rejected")}
                            className="flex-1 h-7 text-xs font-bold text-rose-600 border-rose-300"
                          >
                            Decline
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {app.current_stage === "hired" && app.offer_letter_url && (
                    <a href={app.offer_letter_url} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" className="w-full h-8 text-xs font-bold bg-teal-600 text-white gap-1.5">
                        <Download className="size-3.5" /> Download Official Offer Letter
                      </Button>
                    </a>
                  )}
                  {(() => {
                    const candidateShortlisted = isCandidateShortlisted(app.current_stage) || app.is_shortlisted;
                    if (!app.has_assessment && !candidateShortlisted) return null;

                    if (app.has_assessment && !candidateShortlisted) {
                      return (
                        <div className="flex items-center justify-end">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                            <Clock className="size-3" /> Screening in progress
                          </span>
                        </div>
                      );
                    }

                    if (candidateShortlisted && app.has_assessment) {
                      if (app.assessment_completed) {
                        return (
                          <div className="flex items-center justify-end">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700">
                              <CheckCircle2 className="size-3" /> Test: {Math.round(app.assessment_score ?? 0)}%
                            </span>
                          </div>
                        );
                      }

                      const nowMs = Date.now();
                      const startMs = app.assessment_start ? new Date(app.assessment_start).getTime() : null;
                      const endMs = app.assessment_end ? new Date(app.assessment_end).getTime() : null;
                      const isUpcoming = startMs && nowMs < startMs;
                      const isClosed = endMs && nowMs > endMs;

                      if (isUpcoming) {
                        return (
                          <div className="flex items-center justify-end">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 border border-amber-200 text-amber-800">
                              <Calendar className="size-3 text-amber-600" /> Exam: {formatWindowDateTime(app.assessment_start)}
                            </span>
                          </div>
                        );
                      }

                      if (isClosed) {
                        return (
                          <div className="flex items-center justify-end">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 border border-rose-200 text-rose-700">
                              <XCircle className="size-3 text-rose-500" /> Exam Closed
                            </span>
                          </div>
                        );
                      }

                      return (
                        <div className="flex items-center justify-end">
                          <Link href={`/assessment/${app.id}`} className="w-full">
                            <Button size="sm" className="w-full h-8 text-xs font-semibold bg-[#4F46E5] hover:bg-[#4338CA] text-white gap-1.5 shadow-sm">
                              <FileText className="size-3.5" /> Take Assessment {app.assessment_end ? `(Ends ${formatWindowDateTime(app.assessment_end)})` : ""}
                            </Button>
                          </Link>
                        </div>
                      );
                    }

                    return null;
                  })()}
                  {app.has_interview && (
                    <div className="flex items-center justify-end">
                      {app.interview_completed ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-violet-50 border border-violet-200 text-violet-700">
                          <CheckCircle2 className="size-3" /> Interview Done
                        </span>
                      ) : (
                        <Link href={`/interview/${app.id}`} className="w-full">
                          <Button size="sm" className="w-full h-8 text-xs font-semibold bg-[#7C3AED] hover:bg-[#6D28D9] text-white gap-1.5 shadow-sm">
                            <Video className="size-3.5" /> Take AI Interview
                          </Button>
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* ── Progress insight ── */}
      {hasInsight && bestApp && (
        <Card className="card-shadow border-l-4 border-l-violet-500 border-border/60 ai-glow">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <div className="size-9 rounded-lg ai-gradient flex items-center justify-center shrink-0">
                <TrendingUp className="size-4 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-semibold text-foreground">AI Application Insight</p>
                  <span className="text-xs tracking-tight font-medium px-1.5 py-0.5 rounded bg-[#EDE9FE] text-[#5B21B6]">
                    LIVE EVALUATION
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Your top performance is for the <strong>{bestApp.drive?.title || "Applied Role"}</strong>{" "}
                  {bestApp.drive?.company_name ? `at ${bestApp.drive?.company_name}` : ""} with an AI score of{" "}
                  <strong className="text-[#5B21B6]">{Math.round(bestScore)}</strong>
                  {appsWithScore.length > 1
                    ? ` (average across your evaluations: ${avgScore}).`
                    : "."}{" "}
                  {bestScore >= 80
                    ? "Strong candidacy! Review interview and assessment insights to keep momentum."
                    : "Continue practicing technical and communication questions to boost your overall ranking."}
                </p>
                <div className="flex gap-2 mt-3">
                  <Link href={`/drives/${bestApp.drive_id}`}>
                    <Button size="sm" className="ai-gradient text-white text-xs h-7 px-3 hover:opacity-90">
                      <Sparkles className="size-3 mr-1" /> View Drive Details
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

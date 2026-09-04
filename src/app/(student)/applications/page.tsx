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
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

type AppStage = "applied" | "ai_screened" | "assessment" | "interview" | "shortlisted" | "offer" | "rejected" | "withdrawn";

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
  drive?: ApplicationDrive | null;
  overall_ai_score?: number | null;
}


// ── Stage config ───────────────────────────────────────────────────────────────

const stageConfig: Record<
  AppStage,
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
  interview: {
    label: "Interview",
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
  offer: {
    label: "Offer 🎉",
    bg: "#D1FAE5",
    text: "#065F46",
    icon: Trophy,
    dot: "#10B981",
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

const summaryStages: AppStage[] = ["applied", "ai_screened", "assessment", "interview", "shortlisted", "offer", "rejected"];

function getStageCounts(applications: Application[]) {
  return summaryStages.map((stage) => ({
    stage,
    count: applications.filter((a) => a.current_stage === stage).length,
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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
                  {isActive && (
                    <p className="text-xs tracking-tight text-muted-foreground/70 mt-1 flex items-center gap-1">
                      <Clock className="size-3" /> Updated {formatDate(app.updated_at)}
                    </p>
                  )}
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
                <div className="hidden md:flex items-center justify-end">
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
                <div className="md:hidden flex items-center justify-between">
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

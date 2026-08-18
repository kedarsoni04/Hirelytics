"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  MapPin,
  Clock,
  Users,
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
  Gift,
  Loader2,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api";

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

export default function DriveDetailPage() {
  const params = useParams();
  const driveId = params?.driveId as string;

  const [drive, setDrive] = useState<Drive | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applySuccess, setApplySuccess] = useState(false);

  useEffect(() => {
    if (!driveId) return;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getDrive(driveId);
        setDrive(data);
      } catch (err: any) {
        console.error("[Drive Detail] API error:", err);
        setError(err.message || "Drive not found");
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
        <p className="text-sm text-muted-foreground">Loading drive details\u2026</p>
      </div>
    );
  }

  const handleApply = async () => {
    if (!drive) return;
    try {
      setApplying(true);
      setApplyError(null);
      await api.applyToDrive(drive.id);
      setApplySuccess(true);
    } catch (err: any) {
      console.error("[Drive Detail] Apply error:", err);
      setApplyError(err.message || "Failed to apply");
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

                  {applySuccess ? (
                    <div className="text-sm font-semibold text-[#065F46] bg-[#D1FAE5] p-3 rounded-lg text-center flex items-center justify-center gap-2">
                      <CheckCircle2 className="size-4" /> Applied Successfully
                    </div>
                  ) : (
                    <Button 
                      className="w-full brand-gradient text-white font-semibold hover:opacity-90 transition-opacity"
                      onClick={handleApply}
                      disabled={applying}
                    >
                      {applying ? (
                        <>
                          <Loader2 className="size-4 mr-2 animate-spin" />
                          Applying...
                        </>
                      ) : (
                        "Apply Now"
                      )}
                    </Button>
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

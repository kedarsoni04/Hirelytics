"use client";

import { useEffect, useState } from "react";
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
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

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

export default function CandidateListPage() {
  const router = useRouter();
  const params = useParams();
  const driveId = params?.driveId as string;

  const [drive, setDrive] = useState<any | null>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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
    } catch (err: any) {
      console.error("[Candidate List] Error fetching data:", err);
      setError(err.message || "Failed to load candidates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [driveId]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
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
    } catch (err: any) {
      console.error("[Candidate List] Stage change error:", err);
      alert(err.message || "Failed to update candidate stage");
    } finally {
      setUpdatingId(null);
    }
  };

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
        <div className="flex items-center gap-2 shrink-0">
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
    </div>
  );
}

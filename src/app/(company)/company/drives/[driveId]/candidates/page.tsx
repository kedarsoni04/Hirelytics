"use client";

import { useState } from "react";
import {
  ArrowUpDown,
  Check,
  UserCheck,
  UserX,
  ChevronRight,
  Sparkles,
  SlidersHorizontal,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { candidates, companyDrives, type CandidateStage } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

// ── Stage config ──────────────────────────────────────────────────────────────

const stageConfig: Record<CandidateStage, { label: string; bg: string; color: string }> = {
  applied:     { label: "Applied",      bg: "#F1F5F9", color: "#475569" },
  ai_screened: { label: "AI Screened",  bg: "#EDE9FE", color: "#5B21B6" },
  assessment:  { label: "Assessment",   bg: "#DBEAFE", color: "#1E40AF" },
  interview:   { label: "Interview",    bg: "#FEF3C7", color: "#92400E" },
  shortlisted: { label: "Shortlisted",  bg: "#D1FAE5", color: "#065F46" },
  offer:       { label: "Offer",        bg: "#D1FAE5", color: "#065F46" },
  rejected:    { label: "Rejected",     bg: "#FFE4E6", color: "#9F1239" },
};

function StageBadge({ stage }: { stage: CandidateStage }) {
  const cfg = stageConfig[stage];
  return (
    <span
      className="px-2.5 py-1 rounded-full text-xs tracking-tight font-bold whitespace-nowrap"
      style={{ backgroundColor: cfg.bg, color: cfg.color }}
    >
      {cfg.label}
    </span>
  );
}

// ── AI Score badge ────────────────────────────────────────────────────────────

function AIScore({ score }: { score: number }) {
  const color =
    score >= 85 ? "#5B21B6" : score >= 70 ? "#1E40AF" : "#475569";
  const bg =
    score >= 85 ? "#EDE9FE" : score >= 70 ? "#DBEAFE" : "#F1F5F9";
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold"
      style={{ backgroundColor: bg, color }}
    >
      <Sparkles className="size-3" />
      {score}%
    </span>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

type SortField = "aiScore" | "cgpa" | "name";
type SortDir = "asc" | "desc";

const ALL_STAGES: CandidateStage[] = [
  "applied", "ai_screened", "assessment", "interview", "shortlisted", "offer", "rejected",
];

const stageFilterLabels: { value: CandidateStage | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "ai_screened", label: "AI Screened" },
  { value: "assessment", label: "Assessment" },
  { value: "interview", label: "Interview" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "applied", label: "Applied" },
  { value: "rejected", label: "Rejected" },
];

export default function CandidateListPage() {
  const [sortField, setSortField] = useState<SortField>("aiScore");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [stageFilter, setStageFilter] = useState<CandidateStage | "all">("all");
  const [shortlisted, setShortlisted] = useState<Set<string>>(new Set(["c2", "c5"]));
  const [rejected, setRejected] = useState<Set<string>>(new Set(["c9"]));

  const drive = companyDrives[0];

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("desc"); }
  };

  const handleShortlist = (id: string) => {
    setShortlisted((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    setRejected((s) => { const n = new Set(s); n.delete(id); return n; });
  };

  const handleReject = (id: string) => {
    setRejected((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    setShortlisted((s) => { const n = new Set(s); n.delete(id); return n; });
  };

  const sorted = [...candidates]
    .filter((c) => stageFilter === "all" || c.stage === stageFilter)
    .sort((a, b) => {
      const mult = sortDir === "asc" ? 1 : -1;
      if (sortField === "name") return mult * a.name.localeCompare(b.name);
      return mult * (a[sortField] - b[sortField]);
    });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="size-3.5 opacity-40" />;
    return sortDir === "desc" ? <ArrowDown className="size-3.5 text-[#4F46E5]" /> : <ArrowUp className="size-3.5 text-[#4F46E5]" />;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <span>Drives</span>
            <ChevronRight className="size-3" />
            <span className="text-foreground font-medium">{drive.role}</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Candidate List</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {candidates.length} candidates · AI ranked by match score
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg ai-gradient text-white text-xs font-semibold">
            <Sparkles className="size-3.5" />
            AI Ranking Active
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
                onClick={() => setStageFilter(value as CandidateStage | "all")}
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
            {(["aiScore", "cgpa", "name"] as SortField[]).map((field) => (
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
                {field === "aiScore" ? "AI Score" : field === "cgpa" ? "CGPA" : "Name"}
                <SortIcon field={field} />
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary strip */}
      <div className="flex gap-4 text-xs">
        <span className="text-muted-foreground">{sorted.length} shown</span>
        <span className="text-emerald-600 font-medium">✓ {shortlisted.size} shortlisted</span>
        <span className="text-[#F43F5E] font-medium">✗ {rejected.size} rejected</span>
        <span className="text-muted-foreground">{candidates.length - shortlisted.size - rejected.size} pending review</span>
      </div>

      {/* Candidate rows */}
      <Card className="card-shadow border-border/60 overflow-hidden">
        {/* Table header */}
        <div className="hidden md:grid grid-cols-[auto_1fr_140px_100px_120px_100px] gap-4 px-5 py-3 bg-muted/50 border-b border-border text-xs tracking-tight font-bold text-muted-foreground uppercase tracking-wider items-center">
          <span className="w-10" />
          <span>Candidate</span>
          <span>College</span>
          <button onClick={() => toggleSort("cgpa")} className="flex items-center gap-1 hover:text-foreground transition-colors">
            CGPA <SortIcon field="cgpa" />
          </button>
          <button onClick={() => toggleSort("aiScore")} className="flex items-center gap-1 hover:text-foreground transition-colors text-[#5B21B6]">
            AI Score <SortIcon field="aiScore" />
          </button>
          <span>Actions</span>
        </div>

        {/* Rows */}
        {sorted.map((c, i) => {
          const isShortlisted = shortlisted.has(c.id);
          const isRejected = rejected.has(c.id);
          return (
            <div key={c.id}>
              {i > 0 && <Separator />}
              <div
                onClick={() => window.location.href = `/company/drives/${drive.id}/candidates/${c.id}`}
                className={cn(
                  "flex flex-col md:grid md:grid-cols-[auto_1fr_140px_100px_120px_100px] gap-4 px-5 py-4 items-center group cursor-pointer transition-colors",
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
                      style={{ background: `hsl(${(c.id.charCodeAt(1) * 37) % 360}, 65%, 50%)` }}
                    >
                      {c.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-foreground">{c.name}</p>
                      <StageBadge stage={c.stage} />
                    </div>
                    <p className="text-xs tracking-tight text-muted-foreground mt-0.5">{c.branch} · Applied {c.appliedDate}</p>
                  </div>
                </div>

                {/* College */}
                <p className="hidden md:block text-xs text-muted-foreground truncate">{c.college}</p>

                {/* CGPA */}
                <p className="hidden md:block text-sm font-semibold text-foreground">{c.cgpa}</p>

                {/* AI Score */}
                <div className="hidden md:block">
                  <AIScore score={c.aiScore} />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleShortlist(c.id); }}
                    title="Shortlist"
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
                    onClick={(e) => { e.stopPropagation(); handleReject(c.id); }}
                    title="Reject"
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

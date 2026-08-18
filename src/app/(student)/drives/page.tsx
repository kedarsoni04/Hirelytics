"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  MapPin,
  Briefcase,
  Clock,
  Sparkles,
  Building2,
  IndianRupee,
  CalendarDays,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

/** Derive initials and a deterministic colour from company_id */
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

export default function BrowseDrivesPage() {
  const [drives, setDrives] = useState<Drive[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const fetchDrives = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getDrives();
      setDrives(data);
    } catch (err: any) {
      console.error("[Browse Drives] API error:", err);
      setError(err.message || "Failed to load drives");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrives();
  }, []);

  const filtered = drives.filter((d) => {
    const q = search.toLowerCase();
    return (
      d.title.toLowerCase().includes(q) ||
      (d.location ?? "").toLowerCase().includes(q) ||
      d.eligible_branches.some((b) => b.toLowerCase().includes(q))
    );
  });

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Browse Drives</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {loading
              ? "Loading live placement drives\u2026"
              : `${drives.length} live drive${drives.length !== 1 ? "s" : ""} available`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search role, location, branch\u2026"
              className="pl-8 h-9 text-sm w-64"
            />
          </div>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs h-9">
            <Filter className="size-3.5" />
            Filter
          </Button>
        </div>
      </div>

      {/* ── Loading state ── */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="size-8 animate-spin text-[#4F46E5]" />
          <p className="text-sm text-muted-foreground">Fetching live drives\u2026</p>
        </div>
      )}

      {/* ── Error state ── */}
      {!loading && error && (
        <Card className="border-rose-200 bg-rose-50">
          <CardContent className="flex items-center gap-3 p-5">
            <AlertCircle className="size-5 text-rose-500 shrink-0" />
            <div>
              <p className="text-sm font-medium text-rose-700">Could not load drives</p>
              <p className="text-xs text-rose-500 mt-0.5">{error}</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="ml-auto text-xs border-rose-300 text-rose-600 hover:bg-rose-100"
              onClick={fetchDrives}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Empty state ── */}
      {!loading && !error && drives.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <div className="size-16 rounded-2xl bg-[#EEF2FF] flex items-center justify-center">
            <Briefcase className="size-8 text-[#4F46E5]" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">No live drives yet</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
              No companies have published a live drive yet. Check back soon.
            </p>
          </div>
        </div>
      )}

      {/* ── No search results ── */}
      {!loading && !error && drives.length > 0 && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <Search className="size-8 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">
            No drives match &ldquo;<strong>{search}</strong>&rdquo;
          </p>
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => setSearch("")}>
            Clear search
          </Button>
        </div>
      )}

      {/* ── Drive cards ── */}
      {!loading && !error && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((drive) => {
            const { initials, color } = companyDisplay(drive);
            const left = daysLeft(drive.deadline);
            return (
              <Link key={drive.id} href={`/drives/${drive.id}`}>
                <Card className="card-shadow hover:card-shadow-hover transition-all duration-200 border-border/60 cursor-pointer group">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      {/* Company logo placeholder */}
                      <div
                        className="size-11 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm"
                        style={{ backgroundColor: color }}
                      >
                        {initials}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate group-hover:text-[#4F46E5] transition-colors">
                              {drive.title}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Building2 className="size-3 text-muted-foreground" />
                              <p className="text-xs text-muted-foreground truncate">
                                Campus Drive
                              </p>
                            </div>
                          </div>

                          {/* Live badge */}
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#D1FAE5] text-[#065F46] shrink-0">
                            <span className="size-1.5 rounded-full bg-[#10B981] animate-pulse" />
                            Live
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2.5">
                          {drive.location && (
                            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                              <MapPin className="size-3 shrink-0" />
                              {drive.location}
                            </span>
                          )}
                          {drive.package && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground">
                              <IndianRupee className="size-3 shrink-0" />
                              {drive.package}
                            </span>
                          )}
                          {drive.deadline && (
                            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                              <CalendarDays className="size-3 shrink-0" />
                              Closes {formatDeadline(drive.deadline)}
                            </span>
                          )}
                          {drive.min_cgpa !== null && drive.min_cgpa !== undefined && (
                            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Sparkles className="size-3 shrink-0" />
                              Min CGPA: {drive.min_cgpa}
                            </span>
                          )}
                        </div>

                        {/* Branch chips + deadline urgency */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          {drive.eligible_branches.slice(0, 4).map((b) => (
                            <span
                              key={b}
                              className="px-1.5 py-0.5 bg-accent text-accent-foreground rounded text-xs"
                            >
                              {b}
                            </span>
                          ))}
                          {drive.eligible_branches.length > 4 && (
                            <span className="px-1.5 py-0.5 bg-accent text-accent-foreground rounded text-xs">
                              +{drive.eligible_branches.length - 4} more
                            </span>
                          )}
                          {left !== null && (
                            <span className="ml-auto inline-flex items-center gap-1 text-xs text-rose-500 font-medium">
                              <Clock className="size-3" />
                              {left}d left
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

    </div>
  );
}

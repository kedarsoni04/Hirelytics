"use client";

import { useEffect, useState, useMemo } from "react";
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
  CheckCircle2,
  XCircle,
  X,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  Check,
  GraduationCap,
  Layers,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

// ── Types ─────────────────────────────────────────────────────────────────────

type CompanyInfo = {
  id?: string;
  company_name?: string;
  logo_url?: string | null;
  industry?: string | null;
};

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
  company?: CompanyInfo | null;
};

type AppliedApp = {
  id: string;
  drive_id: string;
  stage: string;
  offer_status?: string;
};

type TabFilter = "all" | "eligible" | "applied" | "closing_soon";
type SortOption = "deadline_asc" | "newest" | "package_desc" | "cgpa_asc";

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

function getDeadlineDiffDays(iso: string | null): number | null {
  if (!iso) return null;
  const deadlineMs = new Date(iso).getTime();
  if (isNaN(deadlineMs)) return null;
  return Math.ceil((deadlineMs - Date.now()) / (1000 * 60 * 60 * 24));
}

function parsePackageLpa(pkg: string | null | undefined): number {
  if (!pkg) return 0;
  const match = pkg.match(/(\d+(?:\.\d+)?)/);
  if (!match) return 0;
  const num = parseFloat(match[1]);
  if (num < 100) return num; // Already LPA (e.g. 12 or 8.5)
  return num / 100000; // In raw INR
}

function getCompanyVisual(drive: Drive) {
  const palette = [
    { bg: "bg-indigo-600", text: "text-white", border: "border-indigo-100" },
    { bg: "bg-violet-600", text: "text-white", border: "border-violet-100" },
    { bg: "bg-sky-600", text: "text-white", border: "border-sky-100" },
    { bg: "bg-emerald-600", text: "text-white", border: "border-emerald-100" },
    { bg: "bg-amber-600", text: "text-white", border: "border-amber-100" },
    { bg: "bg-rose-600", text: "text-white", border: "border-rose-100" },
    { bg: "bg-teal-600", text: "text-white", border: "border-teal-100" },
  ];

  const nameToHash = drive.company?.company_name || drive.company_id || drive.title || "Company";
  const charCode = Math.abs(nameToHash.charCodeAt(0) || 0);
  const color = palette[charCode % palette.length];

  const rawInitials = drive.company?.company_name
    ? drive.company.company_name
        .trim()
        .split(/\s+/)
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
    : drive.title.substring(0, 2) || "??";

  return {
    initials: (rawInitials || "??").toUpperCase(),
    style: color,
  };
}

const STAGE_LABELS: Record<string, string> = {
  applied: "Applied",
  assessment: "Assessment",
  ai_interview: "AI Video Round",
  shortlisted: "Shortlisted",
  offered: "Offer Extended",
  hired: "Placed 🎉",
  rejected: "Archived",
};

// ── Main Page Component ─────────────────────────────────────────────────────────

export default function BrowseDrivesPage() {
  const { user } = useAuth();

  const [drives, setDrives] = useState<Drive[]>([]);
  const [appliedMap, setAppliedMap] = useState<Record<string, AppliedApp>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filtering state
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<TabFilter>("all");
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  // Criteria
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [minPackageLpa, setMinPackageLpa] = useState<number>(0);
  const [maxCgpaCutoff, setMaxCgpaCutoff] = useState<number>(10);
  const [sortBy, setSortBy] = useState<SortOption>("deadline_asc");

  // Placed status
  const [acceptedOffer, setAcceptedOffer] = useState<{ id: string; title?: string } | null>(null);

  const fetchDrives = async () => {
    try {
      setLoading(true);
      setError(null);
      const [data, myApps] = await Promise.all([
        api.getDrives(),
        api.getMyApplications().catch(() => []),
      ]);

      const safeDrives = Array.isArray(data) ? data : [];
      setDrives(safeDrives);

      if (Array.isArray(myApps)) {
        const appRecord: Record<string, AppliedApp> = {};
        let placedOffer: { id: string; title?: string } | null = null;

        for (const app of myApps) {
          if (app && app.drive_id) {
            appRecord[app.drive_id] = {
              id: app.id,
              drive_id: app.drive_id,
              stage: app.current_stage || "applied",
              offer_status: app.offer_status,
            };
          }
          if (app && (app.offer_status === "accepted" || app.current_stage === "hired") && !placedOffer) {
            placedOffer = {
              id: app.id,
              title: app.drive?.title || app.drive_title || "Campus Drive",
            };
          }
        }

        setAppliedMap(appRecord);
        setAcceptedOffer(placedOffer);
      }
    } catch (err: unknown) {
      console.error("[Browse Drives] API error:", err);
      setError(err instanceof Error ? err.message : "Failed to load drives");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchDrives();
  }, []);

  // Collect unique branches from drives
  const availableBranches = useMemo(() => {
    const branches = new Set<string>();
    drives.forEach((d) => {
      if (Array.isArray(d.eligible_branches)) {
        d.eligible_branches.forEach((b) => {
          if (b && typeof b === "string") branches.add(b.trim());
        });
      }
    });
    return Array.from(branches).sort();
  }, [drives]);

  // Check if current student meets eligibility criteria
  const checkEligibility = (drive: Drive): { eligible: boolean; reason?: string } => {
    if (!user || user.role !== "student") return { eligible: true };

    const studentCgpa = typeof user.cgpa === "number" ? user.cgpa : null;
    const studentBranch = user.branch ? user.branch.trim().toLowerCase() : null;

    if (drive.min_cgpa != null && studentCgpa != null && studentCgpa < drive.min_cgpa) {
      return { eligible: false, reason: `Requires CGPA ≥ ${drive.min_cgpa} (Yours: ${studentCgpa})` };
    }

    if (
      studentBranch &&
      Array.isArray(drive.eligible_branches) &&
      drive.eligible_branches.length > 0
    ) {
      const match = drive.eligible_branches.some(
        (b) => b.trim().toLowerCase() === studentBranch || b.toLowerCase().includes(studentBranch)
      );
      if (!match) {
        return { eligible: false, reason: `Requires ${drive.eligible_branches.join(", ")}` };
      }
    }

    return { eligible: true };
  };

  // Active filter count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedBranch !== "all") count++;
    if (minPackageLpa > 0) count++;
    if (maxCgpaCutoff < 10) count++;
    if (sortBy !== "deadline_asc") count++;
    return count;
  }, [selectedBranch, minPackageLpa, maxCgpaCutoff, sortBy]);

  const resetFilters = () => {
    setSelectedBranch("all");
    setMinPackageLpa(0);
    setMaxCgpaCutoff(10);
    setSortBy("deadline_asc");
    setSearch("");
    setActiveTab("all");
  };

  // Filtered & Sorted drives list
  const filteredDrives = useMemo(() => {
    return drives
      .filter((drive) => {
        // 1. Text Search
        if (search.trim()) {
          const q = search.trim().toLowerCase();
          const titleMatch = (drive.title || "").toLowerCase().includes(q);
          const companyMatch = (drive.company?.company_name || "").toLowerCase().includes(q);
          const locMatch = (drive.location || "").toLowerCase().includes(q);
          const pkgMatch = (drive.package || "").toLowerCase().includes(q);
          const descMatch = (drive.description || "").toLowerCase().includes(q);
          const branchMatch =
            Array.isArray(drive.eligible_branches) &&
            drive.eligible_branches.some((b) => (b || "").toLowerCase().includes(q));

          if (!titleMatch && !companyMatch && !locMatch && !pkgMatch && !descMatch && !branchMatch) {
            return false;
          }
        }

        const diffDays = getDeadlineDiffDays(drive.deadline);
        const isClosed = drive.status === "closed" || (diffDays !== null && diffDays <= 0);

        // 2. Tab Filter
        if (activeTab === "eligible") {
          const { eligible } = checkEligibility(drive);
          if (!eligible) return false;
        } else if (activeTab === "applied") {
          if (!appliedMap[drive.id]) return false;
        } else if (activeTab === "closing_soon") {
          if (isClosed || diffDays === null || diffDays > 3) return false;
        }

        // 3. Branch Filter
        if (selectedBranch !== "all") {
          const branchMatch =
            Array.isArray(drive.eligible_branches) &&
            drive.eligible_branches.some(
              (b) => b.trim().toLowerCase() === selectedBranch.toLowerCase()
            );
          if (!branchMatch) return false;
        }

        // 4. Min Package
        if (minPackageLpa > 0) {
          const pkgNum = parsePackageLpa(drive.package);
          if (pkgNum < minPackageLpa) return false;
        }

        // 5. Max CGPA Cutoff
        if (maxCgpaCutoff < 10) {
          if (drive.min_cgpa != null && drive.min_cgpa > maxCgpaCutoff) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "deadline_asc") {
          if (!a.deadline && !b.deadline) return 0;
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        }
        if (sortBy === "newest") {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        if (sortBy === "package_desc") {
          return parsePackageLpa(b.package) - parsePackageLpa(a.package);
        }
        if (sortBy === "cgpa_asc") {
          return (a.min_cgpa ?? 0) - (b.min_cgpa ?? 0);
        }
        return 0;
      });
  }, [drives, search, activeTab, selectedBranch, minPackageLpa, maxCgpaCutoff, sortBy, appliedMap, user]);

  // Tab counts
  const tabCounts = useMemo(() => {
    let eligibleCount = 0;
    let appliedCount = 0;
    let closingSoonCount = 0;

    drives.forEach((d) => {
      const diff = getDeadlineDiffDays(d.deadline);
      const isClosed = d.status === "closed" || (diff !== null && diff <= 0);

      if (checkEligibility(d).eligible) eligibleCount++;
      if (appliedMap[d.id]) appliedCount++;
      if (!isClosed && diff !== null && diff <= 3) closingSoonCount++;
    });

    return {
      all: drives.length,
      eligible: eligibleCount,
      applied: appliedCount,
      closing_soon: closingSoonCount,
    };
  }, [drives, appliedMap, user]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">

      {/* ── Offer Accepted / Placed Banner ── */}
      {acceptedOffer && (
        <div className="relative overflow-hidden rounded-2xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50/50 p-4 sm:p-5 card-shadow">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="size-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-600/20">
                <CheckCircle2 className="size-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-emerald-950">Placement Offer Accepted!</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Placed 🎉
                  </span>
                </div>
                <p className="text-xs text-emerald-800/90 mt-0.5">
                  You accepted an offer with <strong>{acceptedOffer.title}</strong>. Under university placement rules, placed candidates are excused from new drives.
                </p>
              </div>
            </div>
            <Link href="/applications" className="shrink-0">
              <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold h-9 shadow-sm">
                View My Applications <ChevronRight className="size-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* ── Top Hero & Controls Bar ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 mb-1.5">
            <Sparkles className="size-3 text-indigo-500" /> Live Campus Opportunities
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Browse Drives
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Discover verified corporate campus recruitment drives, test rounds, and AI video interviews.
          </p>
        </div>

        {/* Quick Search & Filter Trigger */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search roles, companies, branches…"
              className="pl-9 pr-8 h-10 text-xs sm:text-sm bg-white border-border/80 rounded-xl card-shadow focus-visible:ring-indigo-500"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground rounded-full hover:bg-slate-100"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilterDrawer((prev) => !prev)}
            className={`gap-2 h-10 px-3.5 rounded-xl text-xs font-semibold transition-all border-border/80 card-shadow ${
              showFilterDrawer || activeFiltersCount > 0
                ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                : "bg-white text-gray-700 hover:bg-slate-50"
            }`}
          >
            <Filter className="size-3.5" />
            <span className="hidden sm:inline">Filters</span>
            {activeFiltersCount > 0 && (
              <span className="size-4.5 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
            <ChevronDown
              className={`size-3 text-muted-foreground transition-transform duration-200 ${
                showFilterDrawer ? "rotate-180" : ""
              }`}
            />
          </Button>
        </div>
      </div>

      {/* ── Segmented Tabs ── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-border/60">
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === "all"
              ? "bg-[#4F46E5] text-white shadow-sm shadow-indigo-500/20"
              : "text-muted-foreground hover:text-foreground hover:bg-slate-100"
          }`}
        >
          <span>All Drives</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              activeTab === "all" ? "bg-white/20 text-white font-bold" : "bg-slate-200 text-slate-700"
            }`}
          >
            {tabCounts.all}
          </span>
        </button>

        {user?.role === "student" && (
          <button
            type="button"
            onClick={() => setActiveTab("eligible")}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === "eligible"
                ? "bg-[#4F46E5] text-white shadow-sm shadow-indigo-500/20"
                : "text-muted-foreground hover:text-foreground hover:bg-slate-100"
            }`}
          >
            <Sparkles className="size-3.5 text-amber-300" />
            <span>Eligible for Me</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeTab === "eligible" ? "bg-white/20 text-white font-bold" : "bg-slate-200 text-slate-700"
              }`}
            >
              {tabCounts.eligible}
            </span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveTab("applied")}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === "applied"
              ? "bg-[#4F46E5] text-white shadow-sm shadow-indigo-500/20"
              : "text-muted-foreground hover:text-foreground hover:bg-slate-100"
          }`}
        >
          <Check className="size-3.5" />
          <span>My Applications</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              activeTab === "applied" ? "bg-white/20 text-white font-bold" : "bg-slate-200 text-slate-700"
            }`}
          >
            {tabCounts.applied}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("closing_soon")}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === "closing_soon"
              ? "bg-rose-600 text-white shadow-sm shadow-rose-600/20"
              : "text-muted-foreground hover:text-foreground hover:bg-slate-100"
          }`}
        >
          <Clock className="size-3.5" />
          <span>Ending Soon</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              activeTab === "closing_soon" ? "bg-white/20 text-white font-bold" : "bg-slate-200 text-slate-700"
            }`}
          >
            {tabCounts.closing_soon}
          </span>
        </button>

        {(activeFiltersCount > 0 || search || activeTab !== "all") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="ml-auto text-xs h-8 px-2.5 text-muted-foreground hover:text-foreground gap-1.5 rounded-lg"
          >
            <RotateCcw className="size-3" /> Reset View
          </Button>
        )}
      </div>

      {/* ── Expandable Filter Drawer ── */}
      {showFilterDrawer && (
        <Card className="border-indigo-100 bg-white/95 backdrop-blur-sm card-shadow rounded-2xl p-5 space-y-4 animate-in fade-in-50 slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Filter className="size-4 text-indigo-600" />
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                Filter & Sort Options
              </h4>
            </div>
            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
              >
                Clear all filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Branch */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                Eligible Branch
              </label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full text-xs h-9 rounded-xl border border-border bg-slate-50/50 px-3 py-1 font-medium text-foreground focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="all">All Branches</option>
                {availableBranches.map((branch) => (
                  <option key={branch} value={branch}>
                    {branch}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Min Package */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                Min Compensation
              </label>
              <select
                value={minPackageLpa}
                onChange={(e) => setMinPackageLpa(Number(e.target.value))}
                className="w-full text-xs h-9 rounded-xl border border-border bg-slate-50/50 px-3 py-1 font-medium text-foreground focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="0">Any Package</option>
                <option value="6">≥ 6 LPA</option>
                <option value="10">≥ 10 LPA</option>
                <option value="15">≥ 15 LPA</option>
                <option value="20">≥ 20 LPA</option>
              </select>
            </div>

            {/* 3. CGPA Restriction */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                Maximum CGPA Cutoff
              </label>
              <select
                value={maxCgpaCutoff}
                onChange={(e) => setMaxCgpaCutoff(Number(e.target.value))}
                className="w-full text-xs h-9 rounded-xl border border-border bg-slate-50/50 px-3 py-1 font-medium text-foreground focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="10">Any CGPA</option>
                <option value="7">≤ 7.0 CGPA</option>
                <option value="7.5">≤ 7.5 CGPA</option>
                <option value="8">≤ 8.0 CGPA</option>
                <option value="8.5">≤ 8.5 CGPA</option>
              </select>
            </div>

            {/* 4. Sort By */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                Sort Order
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full text-xs h-9 rounded-xl border border-border bg-slate-50/50 px-3 py-1 font-medium text-foreground focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="deadline_asc">Closing Soonest</option>
                <option value="newest">Recently Published</option>
                <option value="package_desc">Highest Package</option>
                <option value="cgpa_asc">Lowest CGPA Cutoff</option>
              </select>
            </div>
          </div>

          {/* Active criteria chips */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
              <span className="text-[11px] text-muted-foreground font-medium">Active:</span>
              {selectedBranch !== "all" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Branch: {selectedBranch}
                  <button onClick={() => setSelectedBranch("all")}>
                    <X className="size-3 text-indigo-500 hover:text-indigo-800" />
                  </button>
                </span>
              )}
              {minPackageLpa > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-indigo-50 text-indigo-700 border border-indigo-200">
                  ≥ {minPackageLpa} LPA
                  <button onClick={() => setMinPackageLpa(0)}>
                    <X className="size-3 text-indigo-500 hover:text-indigo-800" />
                  </button>
                </span>
              )}
              {maxCgpaCutoff < 10 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-indigo-50 text-indigo-700 border border-indigo-200">
                  CGPA ≤ {maxCgpaCutoff}
                  <button onClick={() => setMaxCgpaCutoff(10)}>
                    <X className="size-3 text-indigo-500 hover:text-indigo-800" />
                  </button>
                </span>
              )}
              {sortBy !== "deadline_asc" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700 border border-slate-200">
                  Sort: {sortBy}
                  <button onClick={() => setSortBy("deadline_asc")}>
                    <X className="size-3 text-slate-500 hover:text-slate-800" />
                  </button>
                </span>
              )}
            </div>
          )}
        </Card>
      )}

      {/* ── Loading Skeleton / Spinner ── */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-24 gap-3 bg-white rounded-2xl border border-border/60 card-shadow">
          <div className="size-12 rounded-2xl brand-gradient flex items-center justify-center text-white shadow-md shadow-indigo-500/20 animate-pulse">
            <Loader2 className="size-6 animate-spin text-white" />
          </div>
          <p className="text-sm font-semibold text-foreground">Loading recruitment drives…</p>
          <p className="text-xs text-muted-foreground">Syncing live corporate drives and application status.</p>
        </div>
      )}

      {/* ── Error State ── */}
      {!loading && error && (
        <Card className="border-rose-200 bg-rose-50/70 card-shadow rounded-2xl">
          <CardContent className="flex items-center gap-3.5 p-6">
            <div className="size-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <AlertCircle className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-rose-900">Failed to load drives</p>
              <p className="text-xs text-rose-700 mt-0.5">{error}</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="ml-auto text-xs border-rose-300 text-rose-800 hover:bg-rose-100 shrink-0 font-semibold"
              onClick={fetchDrives}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Empty State: No live drives published at all ── */}
      {!loading && !error && drives.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center bg-white rounded-2xl border border-dashed border-border/80 p-8 card-shadow">
          <div className="size-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
            <Briefcase className="size-8 text-[#4F46E5]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground">No Live Drives Scheduled</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Recruiters have not published active drives for this cycle yet. Notifications will alert you when a new drive goes live.
            </p>
          </div>
        </div>
      )}

      {/* ── No matching search or filter results ── */}
      {!loading && !error && drives.length > 0 && filteredDrives.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center bg-white rounded-2xl border border-dashed border-border/80 p-8 card-shadow">
          <div className="size-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center">
            <Search className="size-6 text-slate-400" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground">No drives found</h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              We couldn&apos;t find any placement drives matching &ldquo;{search}&rdquo; with your selected filters.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="text-xs mt-2 gap-1.5 rounded-xl border-border font-semibold"
            onClick={resetFilters}
          >
            <RotateCcw className="size-3.5" /> Clear All Filters
          </Button>
        </div>
      )}

      {/* ── Drive Cards Grid / List ── */}
      {!loading && !error && filteredDrives.length > 0 && (
        <div className="space-y-4">
          {filteredDrives.map((drive) => {
            const { initials, style } = getCompanyVisual(drive);
            const diffDays = getDeadlineDiffDays(drive.deadline);
            const isClosed = drive.status === "closed" || (diffDays !== null && diffDays <= 0);
            const isClosingUrgent = !isClosed && diffDays !== null && diffDays <= 1;
            const isClosingSoon = !isClosed && diffDays !== null && diffDays > 1 && diffDays <= 3;

            const application = appliedMap[drive.id];
            const hasApplied = Boolean(application);
            const { eligible, reason: ineligibilityReason } = checkEligibility(drive);

            return (
              <Link key={drive.id} href={`/drives/${drive.id}`} className="block group">
                <Card className="card-shadow hover:card-shadow-hover transition-all duration-300 border-border/60 hover:border-indigo-300 rounded-2xl overflow-hidden bg-white">
                  <CardContent className="p-5 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      
                      {/* Left: Avatar & Title & Meta */}
                      <div className="flex items-start gap-4 min-w-0 flex-1">
                        {/* Company Logo or Initials Avatar */}
                        {drive.company?.logo_url ? (
                          <div className="size-12 sm:size-14 rounded-2xl border border-border/80 overflow-hidden shrink-0 bg-slate-50 flex items-center justify-center p-1 shadow-xs">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={drive.company.logo_url}
                              alt={drive.company.company_name || drive.title}
                              className="size-full object-contain"
                            />
                          </div>
                        ) : (
                          <div
                            className={`size-12 sm:size-14 rounded-2xl ${style.bg} ${style.text} flex items-center justify-center text-sm sm:text-base font-bold shrink-0 shadow-sm`}
                          >
                            {initials}
                          </div>
                        )}

                        {/* Title, Company, Pipeline */}
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-base sm:text-lg font-bold text-foreground group-hover:text-[#4F46E5] transition-colors leading-snug">
                              {drive.title}
                            </h2>

                            {/* Eligibility Tag */}
                            {user?.role === "student" && !hasApplied && (
                              eligible ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  Eligible ✓
                                </span>
                              ) : (
                                <span
                                  title={ineligibilityReason}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200"
                                >
                                  Cutoff Restrained
                                </span>
                              )
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                            <span className="font-semibold text-slate-800 flex items-center gap-1">
                              <Building2 className="size-3.5 text-slate-500" />
                              {drive.company?.company_name || "Campus Drive"}
                            </span>
                            {drive.company?.industry && (
                              <>
                                <span className="text-slate-300">•</span>
                                <span>{drive.company.industry}</span>
                              </>
                            )}
                            {drive.location && (
                              <>
                                <span className="text-slate-300">•</span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="size-3 text-slate-400" />
                                  {drive.location}
                                </span>
                              </>
                            )}
                          </div>

                          {/* Attribute Tags (Compensation, CGPA, Branches) */}
                          <div className="flex flex-wrap items-center gap-2 pt-1.5 text-xs">
                            {drive.package && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                                <IndianRupee className="size-3.5 text-emerald-600" />
                                {drive.package}
                              </span>
                            )}

                            {drive.min_cgpa != null && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg font-medium bg-slate-100 text-slate-700 border border-slate-200/80 text-[11px]">
                                <GraduationCap className="size-3.5 text-slate-500" />
                                Min CGPA: <strong>{drive.min_cgpa}</strong>
                              </span>
                            )}

                            {Array.isArray(drive.selection_stages) && drive.selection_stages.length > 0 && (
                              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-lg font-medium bg-slate-100 text-slate-700 border border-slate-200/80 text-[11px]">
                                <Layers className="size-3.5 text-slate-500" />
                                {drive.selection_stages.length} Stages
                              </span>
                            )}

                            {/* Branch Chips */}
                            {Array.isArray(drive.eligible_branches) &&
                              drive.eligible_branches.slice(0, 3).map((branch) => (
                                <span
                                  key={branch}
                                  className="hidden md:inline-flex px-2 py-0.5 rounded-md bg-slate-50 text-slate-600 border border-slate-200/60 text-[11px]"
                                >
                                  {branch}
                                </span>
                              ))}

                            {Array.isArray(drive.eligible_branches) && drive.eligible_branches.length > 3 && (
                              <span className="hidden md:inline-flex text-[11px] text-muted-foreground font-medium">
                                +{drive.eligible_branches.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Badges & Call to Action */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Application Stage Badge */}
                          {hasApplied ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-violet-100 text-violet-800 border border-violet-200 shadow-xs">
                              <CheckCircle2 className="size-3 text-violet-600" />
                              {STAGE_LABELS[application.stage] || "Applied"}
                            </span>
                          ) : (
                            isClosed ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                                <XCircle className="size-3 text-slate-400" />
                                Closed
                              </span>
                            ) : isClosingUrgent ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-300 animate-pulse">
                                <Clock className="size-3 text-rose-600" />
                                Closes Today
                              </span>
                            ) : isClosingSoon ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                <Clock className="size-3 text-amber-600" />
                                {diffDays}d left
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#D1FAE5] text-[#065F46] border border-emerald-200">
                                <span className="size-1.5 rounded-full bg-[#10B981] animate-pulse" />
                                Live Drive
                              </span>
                            )
                          )}
                        </div>

                        {/* Deadline note */}
                        {drive.deadline && (
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <CalendarDays className="size-3" />
                            {isClosed ? "Ended" : "Deadline"} {formatDeadline(drive.deadline)}
                          </p>
                        )}

                        {/* Hover Action Link */}
                        <div className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-indigo-600 group-hover:text-indigo-800 group-hover:translate-x-1 transition-transform">
                          <span>View Details</span>
                          <ArrowRight className="size-3.5" />
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

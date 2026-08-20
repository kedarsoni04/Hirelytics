"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  Plus,
  MapPin,
  Calendar,
  Users,
  ArrowRight,
  Sparkles,
  Search,
  Loader2,
  AlertCircle,
  TrendingUp,
  Clock,
  Layers,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

type DriveStatus = "live" | "draft" | "closed";

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
  status: DriveStatus;
  deadline: string | null;
  created_at: string;
};

const statusConfig: Record<DriveStatus, { label: string; bg: string; color: string; dot: string }> = {
  live: { label: "Live", bg: "#D1FAE5", color: "#065F46", dot: "#10B981" },
  draft: { label: "Draft", bg: "#FEF3C7", color: "#92400E", dot: "#F59E0B" },
  closed: { label: "Closed", bg: "#F1F5F9", color: "#475569", dot: "#94A3B8" },
};

function DriveStatusBadge({ status }: { status: DriveStatus }) {
  const cfg = statusConfig[status] ?? statusConfig.closed;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap"
      style={{ backgroundColor: cfg.bg, color: cfg.color }}
    >
      <span className="size-1.5 rounded-full" style={{ backgroundColor: cfg.dot }} />
      {cfg.label}
    </span>
  );
}

function formatDeadline(iso: string | null) {
  if (!iso) return "Open Deadline";
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

export default function CompanyDrivesPage() {
  const [drives, setDrives] = useState<Drive[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [publishingId, setPublishingId] = useState<string | null>(null);

  const fetchDrives = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getMyCompanyDrives();
      setDrives(data || []);
    } catch (err: any) {
      console.error("[Company Drives] Error fetching drives:", err);
      setError(err.message || "Failed to load drives");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrives();
  }, []);

  const handlePublish = async (driveId: string) => {
    try {
      setPublishingId(driveId);
      await api.updateDrive(driveId, { status: "live" });
      setDrives((prev) =>
        prev.map((d) => (d.id === driveId ? { ...d, status: "live" } : d))
      );
    } catch (err: any) {
      console.error("[Company Drives] Publish error:", err);
      alert(err.message || "Failed to publish drive");
    } finally {
      setPublishingId(null);
    }
  };

  const filteredDrives = drives
    .filter((d) => statusFilter === "all" || d.status === statusFilter)
    .filter((d) => {
      if (!search.trim()) return true;
      const query = search.toLowerCase();
      const titleMatch = d.title.toLowerCase().includes(query);
      const locationMatch = d.location?.toLowerCase().includes(query) ?? false;
      const pkgMatch = d.package?.toLowerCase().includes(query) ?? false;
      return titleMatch || locationMatch || pkgMatch;
    });

  const totalDrives = drives.length;
  const liveCount = drives.filter((d) => d.status === "live").length;
  const draftCount = drives.filter((d) => d.status === "draft").length;
  const closedCount = drives.filter((d) => d.status === "closed").length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 className="size-8 animate-spin text-[#4F46E5]" />
        <p className="text-sm text-muted-foreground">Loading recruitment drives…</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Campus Drives</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your recruitment drives, track selection rounds, and review applicant shortlists.
          </p>
        </div>
        <Link href="/company/drives/new">
          <Button className="brand-gradient text-white gap-2 font-semibold hover:opacity-90 transition-opacity">
            <Plus className="size-4" /> Post a Drive
          </Button>
        </Link>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-shadow border-border/60">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="size-11 rounded-xl bg-[#EEF2FF] flex items-center justify-center shrink-0">
              <Briefcase className="size-5 text-[#4F46E5]" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Drives</p>
              <p className="text-2xl font-bold text-foreground">{totalDrives}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="card-shadow border-border/60">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="size-11 rounded-xl bg-[#D1FAE5] flex items-center justify-center shrink-0">
              <TrendingUp className="size-5 text-[#059669]" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Live Drives</p>
              <p className="text-2xl font-bold text-foreground">{liveCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="card-shadow border-border/60">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="size-11 rounded-xl bg-[#FEF3C7] flex items-center justify-center shrink-0">
              <Clock className="size-5 text-[#D97706]" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Drafts</p>
              <p className="text-2xl font-bold text-foreground">{draftCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="card-shadow border-border/60">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="size-11 rounded-xl bg-[#EDE9FE] flex items-center justify-center shrink-0">
              <Sparkles className="size-5 text-[#5B21B6]" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">AI Screening</p>
              <p className="text-2xl font-bold text-[#5B21B6]">{liveCount > 0 ? "Active" : "Ready"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter / Search Bar */}
      <Card className="card-shadow border-border/60">
        <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: "all", label: `All (${totalDrives})` },
              { id: "live", label: `Live (${liveCount})` },
              { id: "draft", label: `Drafts (${draftCount})` },
              { id: "closed", label: `Closed (${closedCount})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                  statusFilter === tab.id
                    ? "bg-[#4F46E5] text-white shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-[#EEF2FF] hover:text-[#3730A3]"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search drives, location, package…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>
        </CardContent>
      </Card>

      {/* Error state */}
      {error && (
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
              className="ml-auto text-xs border-rose-300 text-rose-600"
              onClick={fetchDrives}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!error && filteredDrives.length === 0 && (
        <Card className="card-shadow border-border/60 border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="size-14 rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground">
              <Briefcase className="size-7" />
            </div>
            <div>
              <p className="text-base font-bold text-foreground">
                {search || statusFilter !== "all" ? "No drives match your filters" : "No campus drives posted yet"}
              </p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                {search || statusFilter !== "all"
                  ? "Try adjusting your search criteria or switching to a different status tab."
                  : "Create your first campus recruitment drive to start receiving and screening student applications."}
              </p>
            </div>
            <Link href="/company/drives/new">
              <Button size="sm" className="brand-gradient text-white text-xs gap-1.5 font-semibold mt-2">
                <Plus className="size-3.5" /> Post a Drive
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Drives List */}
      {!error && filteredDrives.length > 0 && (
        <div className="space-y-4">
          {filteredDrives.map((drive) => {
            const isLive = drive.status === "live";
            const isDraft = drive.status === "draft";
            const isPublishing = publishingId === drive.id;

            return (
              <Card
                key={drive.id}
                className="card-shadow border-border/60 hover:border-[#4F46E5]/40 transition-all duration-200"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    {/* Main Drive Info */}
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h2 className="text-base font-bold text-foreground hover:text-[#4F46E5] transition-colors">
                          {drive.title}
                        </h2>
                        <DriveStatusBadge status={drive.status} />
                      </div>

                      {drive.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed max-w-3xl">
                          {drive.description}
                        </p>
                      )}

                      {/* Metadata Chips */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap pt-1">
                        {drive.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="size-3.5 text-muted-foreground/70" />
                            {drive.location}
                          </span>
                        )}
                        {drive.package && (
                          <span className="flex items-center gap-1 font-semibold text-foreground">
                            <span className="text-[#059669]">₹</span>
                            {drive.package}
                          </span>
                        )}
                        {drive.min_cgpa !== null && drive.min_cgpa !== undefined && (
                          <span className="flex items-center gap-1">
                            <GraduationCap className="size-3.5 text-muted-foreground/70" />
                            Min CGPA: {drive.min_cgpa}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="size-3.5 text-muted-foreground/70" />
                          Deadline: {formatDeadline(drive.deadline)}
                        </span>
                      </div>

                      {/* Eligible branches */}
                      {drive.eligible_branches && drive.eligible_branches.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                          <span className="text-[11px] font-semibold text-muted-foreground">Eligible:</span>
                          {drive.eligible_branches.map((b) => (
                            <span
                              key={b}
                              className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-[11px] font-medium"
                            >
                              {b}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Actions Right Side */}
                    <div className="flex items-center gap-2.5 shrink-0 pt-2 lg:pt-0">
                      {isDraft && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isPublishing}
                          onClick={() => handlePublish(drive.id)}
                          className="text-xs border-[#10B981] text-[#059669] hover:bg-[#D1FAE5]"
                        >
                          {isPublishing ? <Loader2 className="size-3.5 animate-spin" /> : "Publish Live"}
                        </Button>
                      )}

                      <Link href={`/company/drives/${drive.id}/candidates`}>
                        <Button
                          size="sm"
                          className={cn(
                            "text-xs font-semibold gap-1.5",
                            isLive
                              ? "brand-gradient text-white hover:opacity-90"
                              : "bg-muted text-foreground hover:bg-muted/80"
                          )}
                        >
                          {isDraft ? "View Candidates & Draft" : "View Candidates"}
                          <ArrowRight className="size-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* Stage Progress Pills if available */}
                  {drive.selection_stages && drive.selection_stages.length > 0 && (
                    <>
                      <Separator className="my-4" />
                      <div className="flex items-center justify-between gap-4 flex-wrap text-xs">
                        <div className="flex items-center gap-2">
                          <Layers className="size-3.5 text-[#4F46E5]" />
                          <span className="font-semibold text-foreground">Selection Stages:</span>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {drive.selection_stages.map((stage, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded-full bg-[#EEF2FF] text-[#3730A3] text-[11px] font-medium capitalize"
                              >
                                {stage.replace("_", " ")}
                              </span>
                            ))}
                          </div>
                        </div>

                        <Link
                          href="/company/pipeline"
                          className="text-xs font-semibold text-[#4F46E5] hover:underline flex items-center gap-1"
                        >
                          Open in Pipeline <ArrowRight className="size-3" />
                        </Link>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

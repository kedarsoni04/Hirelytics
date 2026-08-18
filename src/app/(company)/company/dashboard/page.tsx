"use client";

import { useEffect, useState } from "react";
import {
  Briefcase,
  Users,
  Sparkles,
  TrendingUp,
  MapPin,
  Calendar,
  ArrowRight,
  Plus,
  Clock,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

// ── Types ─────────────────────────────────────────────────────────────────────

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

// ── Drive status badge ─────────────────────────────────────────────────────────

const statusConfig: Record<DriveStatus, { label: string; bg: string; color: string; dot: string }> = {
  live: { label: "Live", bg: "#D1FAE5", color: "#065F46", dot: "#10B981" },
  draft: { label: "Draft", bg: "#FEF3C7", color: "#92400E", dot: "#F59E0B" },
  closed: { label: "Closed", bg: "#F1F5F9", color: "#475569", dot: "#94A3B8" },
};

function DriveStatusBadge({ status }: { status: DriveStatus }) {
  const cfg = statusConfig[status] ?? statusConfig.closed;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs tracking-tight font-bold"
      style={{ backgroundColor: cfg.bg, color: cfg.color }}
    >
      <span className="size-1.5 rounded-full" style={{ backgroundColor: cfg.dot }} />
      {cfg.label}
    </span>
  );
}

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

// ── Page ─────────────────────────────────────────────────────────────────────

export default function CompanyDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [drives, setDrives] = useState<Drive[]>([]);
  const [drivesLoading, setDrivesLoading] = useState(true);
  const [drivesError, setDrivesError] = useState<string | null>(null);

  const fetchDrives = async () => {
    try {
      setDrivesLoading(true);
      setDrivesError(null);
      const data = await api.getMyCompanyDrives();
      setDrives(data);
    } catch (err: any) {
      console.error("[Company Dashboard] drives error:", err);
      setDrivesError(err.message || "Failed to load drives");
    } finally {
      setDrivesLoading(false);
    }
  };

  useEffect(() => {
    fetchDrives();
  }, []);

  if (authLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto flex justify-center py-20">
        <Loader2 className="size-8 animate-spin text-[#4F46E5]" />
      </div>
    );
  }

  const companyName = user?.company_name ?? "Your Company";
  const recruiterName = user?.full_name ?? "Recruiter";
  const initials = companyName.substring(0, 2).toUpperCase();

  const liveDrives = drives.filter((d) => d.status === "live");

  // Computed stats from real data
  const stats = [
    { label: "Active Drives", value: liveDrives.length, icon: Briefcase, trend: null, trendUp: null, isAI: false },
    { label: "Total Drives", value: drives.length, icon: TrendingUp, trend: null, trendUp: null, isAI: false },
    { label: "Draft Drives", value: drives.filter((d) => d.status === "draft").length, icon: Users, trend: null, trendUp: null, isAI: false },
    { label: "AI Ranking Active", value: liveDrives.length > 0 ? "On" : "Off", icon: Sparkles, trend: `Across ${liveDrives.length} live drives`, trendUp: null, isAI: true },
  ];

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">

      {/* ── Welcome header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className="size-12 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-lg shrink-0 brand-gradient"
          >
            {initials}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Welcome back, {recruiterName.split(" ")[0]}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {companyName} &middot; Recruiter
            </p>
          </div>
        </div>
        <Link href="/company/drives/new">
          <Button className="brand-gradient text-white gap-2 hover:opacity-90 transition-opacity font-semibold">
            <Plus className="size-4" /> Post a Drive
          </Button>
        </Link>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="card-shadow border-border/60">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`size-9 rounded-xl flex items-center justify-center ${
                      stat.isAI ? "ai-gradient" : "brand-gradient"
                    }`}
                  >
                    <Icon className="size-4 text-white" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-foreground">
                  {typeof stat.value === "number" ? stat.value.toLocaleString() : stat.value}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                {stat.trend && (
                  <p className="text-xs tracking-tight text-muted-foreground mt-1">{stat.trend}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Active Drives section ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground">My Drives</h2>
          <span className="text-xs text-muted-foreground">{drives.length} total</span>
        </div>

        {/* Loading */}
        {drivesLoading && (
          <div className="flex items-center justify-center py-16 gap-3">
            <Loader2 className="size-5 animate-spin text-[#4F46E5]" />
            <span className="text-sm text-muted-foreground">Loading your drives\u2026</span>
          </div>
        )}

        {/* Error */}
        {!drivesLoading && drivesError && (
          <Card className="border-rose-200 bg-rose-50">
            <CardContent className="flex items-center gap-3 p-5">
              <AlertCircle className="size-5 text-rose-500 shrink-0" />
              <div>
                <p className="text-sm font-medium text-rose-700">Could not load drives</p>
                <p className="text-xs text-rose-500 mt-0.5">{drivesError}</p>
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

        {/* Empty */}
        {!drivesLoading && !drivesError && drives.length === 0 && (
          <Card className="card-shadow border-border/60 border-dashed">
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <Briefcase className="size-10 text-muted-foreground/30" />
              <div>
                <p className="text-sm font-semibold text-foreground">No drives yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Post your first drive to start recruiting
                </p>
              </div>
              <Link href="/company/drives/new">
                <Button size="sm" className="brand-gradient text-white text-xs gap-1.5 hover:opacity-90">
                  <Plus className="size-3.5" /> Post a Drive
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Drive list */}
        {!drivesLoading && !drivesError && drives.length > 0 && (
          <div className="space-y-3">
            {drives.map((drive) => (
              <Card key={drive.id} className="card-shadow border-border/60 hover:card-shadow-hover transition-shadow">
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-foreground">{drive.title}</h3>
                        <DriveStatusBadge status={drive.status} />
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                        {drive.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="size-3" />
                            {drive.location}
                          </span>
                        )}
                        {drive.deadline && (
                          <span className="flex items-center gap-1">
                            <Calendar className="size-3" />
                            Deadline: {formatDeadline(drive.deadline)}
                          </span>
                        )}
                        {drive.package && (
                          <span className="font-semibold text-foreground">{drive.package}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Publish button for draft drives */}
                      {drive.status === "draft" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs"
                          onClick={async () => {
                            try {
                              await api.updateDrive(drive.id, { status: "live" });
                              await fetchDrives();
                            } catch (e: any) {
                              alert("Failed to publish: " + e.message);
                            }
                          }}
                        >
                          Publish
                        </Button>
                      )}
                      <Link href={`/company/drives/${drive.id}/candidates`}>
                        <Button
                          size="sm"
                          variant={drive.status === "draft" ? "outline" : "default"}
                          className={`text-xs shrink-0 ${
                            drive.status !== "draft"
                              ? "brand-gradient text-white hover:opacity-90 transition-opacity"
                              : ""
                          }`}
                        >
                          {drive.status === "draft" ? "Edit Draft" : "View Candidates"}
                          <ArrowRight className="size-3 ml-1.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {drive.status === "live" && (
                    <>
                      <Separator className="my-3" />
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <p className="text-lg font-bold text-foreground">0</p>
                          <p className="text-xs tracking-tight text-muted-foreground">Applicants</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-[#8B5CF6]">0</p>
                          <p className="text-xs tracking-tight text-muted-foreground">AI Shortlisted</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-foreground">
                            {drive.selection_stages.length}
                          </p>
                          <p className="text-xs tracking-tight text-muted-foreground">Stages</p>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

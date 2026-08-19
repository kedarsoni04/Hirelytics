"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Send,
  Star,
  Calendar,
  Trophy,
  TrendingUp,
  TrendingDown,
  Sparkles,
  MapPin,
  Clock,
  CheckCircle2,
  Eye,
  ChevronRight,
  Briefcase,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";

type Drive = {
  id: string;
  company_id: string;
  title: string;
  description: string | null;
  package: string | null;
  location: string | null;
  min_cgpa: number | null;
  eligible_branches: string[];
  deadline: string | null;
  status: string;
};

const PALETTE = [
  "#4F46E5", "#0EA5E9", "#10B981", "#F59E0B", "#EF4444",
  "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16", "#F97316",
];

function driveColor(drive: Drive) {
  return PALETTE[drive.company_id.charCodeAt(0) % PALETTE.length];
}

function formatDeadline(iso: string | null) {
  if (!iso) return "Open";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const statIconMap: Record<string, React.ElementType> = {
  send: Send,
  star: Star,
  calendar: Calendar,
  trophy: Trophy,
};

const activityIconMap: Record<string, React.ElementType> = {
  sparkles: Sparkles,
  star: Star,
  check: CheckCircle2,
  send: Send,
  eye: Eye,
};

const activityColorMap: Record<string, string> = {
  violet: "bg-[#EDE9FE] text-[#6D28D9]",
  success: "bg-[#D1FAE5] text-[#065F46]",
  indigo: "bg-[#EEF2FF] text-[#3730A3]",
  muted: "bg-muted text-muted-foreground",
};

const statColors = [
  { bg: "#EEF2FF", icon: "#4F46E5" },
  { bg: "#D1FAE5", icon: "#059669" },
  { bg: "#FEF3C7", icon: "#D97706" },
  { bg: "#D1FAE5", icon: "#10B981" },
];

const statusStyles: Record<string, string> = {
  live: "bg-[#D1FAE5] text-[#065F46]",
  upcoming: "bg-[#FEF3C7] text-[#92400E]",
  closed: "bg-muted text-muted-foreground",
};

type Activity = {
  id: string;
  action: string;
  created_at: string;
};

type Stats = {
  applications_sent: number;
  shortlisted: number;
  interviews_scheduled: number;
  offers_received: number;
  ai_score: number | null;
};

// ── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user, loading } = useAuth();
  
  let completion = 0;
  if (user) {
    const fields = [
      user.full_name,
      user.college,
      user.branch,
      user.cgpa,
      user.skills && user.skills.length > 0,
      user.resume_url,
      user.linkedin_url,
      user.github_url,
      user.portfolio_url
    ];
    const filledCount = fields.filter(Boolean).length;
    completion = Math.round((filledCount / 9) * 100);
  }

  const [drives, setDrives] = useState<Drive[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [drivesLoading, setDrivesLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getDrives().then(data => setDrives(data.slice(0, 3))).catch(() => {}),
      api.getMyStats().then(setStats).catch(() => {}),
      api.getMyActivity().then(setActivities).catch(() => {})
    ]).finally(() => {
      setDrivesLoading(false);
    });
  }, []);

  if (loading || !user) {
    return (
      <div className="p-6 max-w-7xl mx-auto flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const firstName = user.full_name ? user.full_name.split(" ")[0] : "Student";
  const branch = user.branch || "Unknown Branch";
  const college = user.college || "Unknown College";

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">

      {/* ── Welcome header ── */}
      <section className="flex flex-col md:flex-row md:items-start gap-5">
        <div className="flex-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1">
            Good morning 👋
          </p>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back, {firstName}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {branch} · {college}
          </p>

          {/* Profile completion */}
          <div className="mt-4 max-w-sm">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-foreground">Profile Completion</span>
              <span className="text-xs font-semibold text-[#4F46E5]">{completion}%</span>
            </div>
            <div className="h-2 w-full bg-[#EEF2FF] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full brand-gradient transition-all duration-700"
                style={{ width: `${completion}%` }}
              />
            </div>
            <p className="text-xs tracking-tight text-muted-foreground mt-1.5">
              Complete your profile to improve AI match accuracy
            </p>
          </div>
        </div>

        {/* Quick stats pill */}
        <div className="flex items-center gap-2 px-4 py-3 bg-card rounded-xl border border-border/60 card-shadow shrink-0">
          <div className="size-9 rounded-lg ai-gradient flex items-center justify-center">
            <Sparkles className="size-4 text-white" />
          </div>
          <div>
            <p className="text-xs tracking-tight text-muted-foreground">Your AI Score</p>
            <p className="text-lg font-bold text-foreground leading-tight">
              {stats?.ai_score !== null && stats?.ai_score !== undefined ? `${stats.ai_score} / 100` : "—"}
            </p>
          </div>
        </div>
      </section>

      {/* ── Stat cards ── */}
      <section>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Applications Sent", value: stats?.applications_sent ?? 0, icon: "send", bg: "#EEF2FF", color: "#4F46E5" },
            { label: "Shortlisted", value: stats?.shortlisted ?? 0, icon: "star", bg: "#D1FAE5", color: "#059669" },
            { label: "Interviews", value: stats?.interviews_scheduled ?? 0, icon: "calendar", bg: "#FEF3C7", color: "#D97706" },
            { label: "Offers", value: stats?.offers_received ?? 0, icon: "trophy", bg: "#D1FAE5", color: "#10B981" },
          ].map((stat) => {
            const Icon = statIconMap[stat.icon];
            return (
              <Card key={stat.label} className="card-shadow hover:card-shadow-hover transition-all duration-200 border-border/60">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className="size-9 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: stat.bg }}
                    >
                      <Icon className="size-4.5" style={{ color: stat.color }} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ── Main content grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Recommended drives (2/3 width) ── */}
        <section className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground">Recommended Drives</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                <Sparkles className="inline size-3 mr-1 text-violet-500" />
                AI-matched based on your profile
              </p>
            </div>
            <Link href="/drives">
              <Button variant="ghost" size="sm" className="text-xs gap-1">
                View all <ChevronRight className="size-3.5" />
              </Button>
            </Link>
          </div>

          <div className="space-y-3">
            {drivesLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="size-6 animate-spin text-[#4F46E5]" />
              </div>
            )}
            {!drivesLoading && drives.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                <div className="size-12 rounded-2xl bg-[#EEF2FF] flex items-center justify-center">
                  <Briefcase className="size-6 text-[#4F46E5]" />
                </div>
                <p className="text-sm text-muted-foreground">No live drives right now. Check back soon!</p>
              </div>
            )}
            {!drivesLoading && drives.map((drive) => (
              <Link key={drive.id} href={`/drives/${drive.id}`}>
                <Card className="card-shadow hover:card-shadow-hover transition-all duration-200 border-border/60 cursor-pointer group">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Company logo placeholder */}
                      <div
                        className="size-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
                        style={{ backgroundColor: driveColor(drive) }}
                      >
                        {(drive.title.substring(0, 2) || "??").toUpperCase()}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate group-hover:text-[#4F46E5] transition-colors">
                              {drive.title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">Campus Drive</p>
                          </div>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[#D1FAE5] text-[#065F46] shrink-0">
                            <span className="size-1.5 rounded-full bg-[#10B981] animate-pulse" />
                            Live
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                          {drive.location && (
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="size-3" />
                              {drive.location}
                            </span>
                          )}
                          {drive.package && (
                            <span className="text-xs font-semibold text-foreground">{drive.package}</span>
                          )}
                          {drive.deadline && (
                            <span className="inline-flex items-center gap-1 text-xs tracking-tight text-muted-foreground">
                              <Clock className="size-3" />
                              Closes {formatDeadline(drive.deadline)}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {drive.eligible_branches.slice(0, 3).map((b) => (
                            <span key={b} className="px-1.5 py-0.5 bg-accent text-accent-foreground rounded text-xs tracking-tight">
                              {b}
                            </span>
                          ))}
                          {drive.min_cgpa !== null && drive.min_cgpa !== undefined && (
                            <span className="px-1.5 py-0.5 bg-accent text-accent-foreground rounded text-xs tracking-tight">
                              CGPA ≥ {drive.min_cgpa}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Recent Activity (1/3 width) ── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">Recent Activity</h2>
            <Link href="/applications">
              <Button variant="ghost" size="sm" className="text-xs">
                See all
              </Button>
            </Link>
          </div>

          <Card className="card-shadow border-border/60">
            <CardContent className="p-0">
              <div className="divide-y divide-border/60">
                {activities.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No activity yet — start applying to drives!
                  </div>
                ) : (
                  activities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 px-4 py-3.5 hover:bg-muted/30 transition-colors">
                      <div className="size-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 bg-[#EEF2FF] text-[#3730A3]">
                        <CheckCircle2 className="size-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground leading-snug">{activity.action}</p>
                        <p className="text-xs tracking-tight text-muted-foreground mt-0.5">
                          {new Date(activity.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "numeric" })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick actions */}
          <Card className="card-shadow border-l-4 border-l-violet-500 border-border/60 ai-glow">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="size-4 text-violet-500" />
                <p className="text-xs font-semibold text-foreground">AI Recommendation</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your resume lacks a <strong>Projects</strong> section. Adding 2–3 projects could increase your AI match score by up to <strong>8 points</strong>.
              </p>
              <Button size="sm" className="w-full mt-3 ai-gradient text-white text-xs hover:opacity-90">
                <Sparkles className="size-3 mr-1.5" />
                Improve Profile
              </Button>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}

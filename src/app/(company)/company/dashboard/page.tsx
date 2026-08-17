import type { Metadata } from "next";
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
  Dot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import {
  companyProfile,
  companyDrives,
  companyStats,
  companyActivity,
  type DriveStatus,
} from "@/lib/mock-data";

export const metadata: Metadata = { title: "Dashboard" };

// ── Drive status badge ────────────────────────────────────────────────────────

const statusConfig: Record<DriveStatus, { label: string; bg: string; color: string; dot: string }> = {
  live: { label: "Live", bg: "#D1FAE5", color: "#065F46", dot: "#10B981" },
  draft: { label: "Draft", bg: "#FEF3C7", color: "#92400E", dot: "#F59E0B" },
  closed: { label: "Closed", bg: "#F1F5F9", color: "#475569", dot: "#94A3B8" },
};

function DriveStatusBadge({ status }: { status: DriveStatus }) {
  const cfg = statusConfig[status];
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

// ── Stat icon map ─────────────────────────────────────────────────────────────

const statIcons: Record<string, React.ElementType> = {
  briefcase: Briefcase,
  users: Users,
  sparkles: Sparkles,
  handshake: TrendingUp,
};

// ── Page ─────────────────────────────────────────────────────────────────────

export default function CompanyDashboard() {
  const activeDrives = companyDrives.filter((d) => d.status === "live");
  const allDrives = companyDrives;

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">

      {/* ── Welcome header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className="size-12 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-lg shrink-0"
            style={{ backgroundColor: companyProfile.color }}
          >
            {companyProfile.initials}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Welcome back, {companyProfile.recruiterName.split(" ")[0]}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {companyProfile.name} · {companyProfile.recruiterRole}
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
        {companyStats.map((stat) => {
          const Icon = statIcons[stat.icon] ?? Briefcase;
          const isAI = stat.icon === "sparkles";
          return (
            <Card key={stat.label} className="card-shadow border-border/60">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`size-9 rounded-xl flex items-center justify-center ${
                      isAI ? "ai-gradient" : "brand-gradient"
                    }`}
                  >
                    <Icon className="size-4 text-white" />
                  </div>
                  {stat.trendUp !== null && (
                    <span className={`text-xs tracking-tight font-semibold px-1.5 py-0.5 rounded-full ${stat.trendUp ? "bg-[#D1FAE5] text-[#065F46]" : "bg-muted text-muted-foreground"}`}>
                      {stat.trendUp ? "↑" : ""} {stat.trend}
                    </span>
                  )}
                </div>
                <p className="text-3xl font-bold text-foreground">{stat.value.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                {stat.trendUp === null && (
                  <p className="text-xs tracking-tight text-muted-foreground mt-1">{stat.trend}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Two-column grid ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Active Drives — takes 2 cols */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground">Active Drives</h2>
            <Link href="/company/drives" className="text-xs text-[#4F46E5] font-medium hover:underline">
              View all ({allDrives.length})
            </Link>
          </div>

          <div className="space-y-3">
            {allDrives.map((drive) => (
              <Card key={drive.id} className="card-shadow border-border/60 hover:card-shadow-hover transition-shadow">
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-foreground">{drive.role}</h3>
                        <DriveStatusBadge status={drive.status} />
                        <span className="text-xs tracking-tight font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{drive.type}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1"><MapPin className="size-3" />{drive.location}</span>
                        <span className="flex items-center gap-1"><Calendar className="size-3" />Deadline: {drive.deadline}</span>
                        <span className="font-semibold text-foreground">{drive.package}</span>
                      </div>
                    </div>
                    <Link href={`/company/drives/${drive.id}/candidates`}>
                      <Button size="sm" variant={drive.status === "draft" ? "outline" : "default"} className={`text-xs shrink-0 ${drive.status !== "draft" ? "brand-gradient text-white hover:opacity-90 transition-opacity" : ""}`}>
                        {drive.status === "draft" ? "Edit Draft" : "View Candidates"}
                        <ArrowRight className="size-3 ml-1.5" />
                      </Button>
                    </Link>
                  </div>

                  {drive.status !== "draft" && (
                    <>
                      <Separator className="my-3" />
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <p className="text-lg font-bold text-foreground">{drive.applicants}</p>
                          <p className="text-xs tracking-tight text-muted-foreground">Applicants</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-[#8B5CF6]">{drive.shortlisted}</p>
                          <p className="text-xs tracking-tight text-muted-foreground">AI Shortlisted</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-foreground">{drive.assessmentCompleted}</p>
                          <p className="text-xs tracking-tight text-muted-foreground">Assessed</p>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent AI Activity — 1 col */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-foreground">Recent Activity</h2>
          <Card className="card-shadow border-border/60">
            <CardContent className="p-0">
              {companyActivity.map((item, i) => (
                <div key={item.id}>
                  {i > 0 && <Separator />}
                  <div className="flex items-start gap-3 px-4 py-3.5">
                    <div className={`size-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${item.ai ? "ai-gradient" : "bg-muted"}`}>
                      {item.ai
                        ? <Sparkles className="size-3.5 text-white" />
                        : <Clock className="size-3.5 text-muted-foreground" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs leading-relaxed ${item.ai ? "text-[#4C1D95] font-medium" : "text-foreground"}`}>
                        {item.text}
                      </p>
                      <p className="text-xs tracking-tight text-muted-foreground mt-1">{item.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}

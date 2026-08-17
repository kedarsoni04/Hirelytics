import type { Metadata } from "next";
import Link from "next/link";
import {
  MapPin,
  Clock,
  Users,
  Briefcase,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Circle,
  XCircle,
  ArrowLeft,
  Building2,
  GraduationCap,
  IndianRupee,
  CalendarDays,
  Shield,
  Gift,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { driveDetail } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: `${driveDetail.role} — ${driveDetail.company}`,
};

// ── Stepper status icons ──────────────────────────────────────────────────────

function StepIcon({ status }: { status: string }) {
  if (status === "completed") return <CheckCircle2 className="size-5 text-[#4F46E5]" />;
  if (status === "active") return (
    <div className="size-5 rounded-full border-2 border-[#4F46E5] flex items-center justify-center bg-[#EEF2FF]">
      <div className="size-2 rounded-full bg-[#4F46E5]" />
    </div>
  );
  return <Circle className="size-5 text-muted-foreground/40" />;
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function DriveDetailPage({
  params,
}: {
  params: Promise<{ driveId: string }>;
}) {
  const { driveId } = await params;
  // In production, fetch by driveId. We use mock data for all drives.
  const drive = driveDetail;

  return (
    <div className="min-h-screen bg-background">

      {/* ── Breadcrumb ── */}
      <div className="px-6 pt-5 pb-0">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground max-w-7xl mx-auto">
          <Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
          <ChevronRight className="size-3" />
          <Link href="/drives" className="hover:text-foreground transition-colors">Browse Drives</Link>
          <ChevronRight className="size-3" />
          <span className="text-foreground font-medium truncate">{drive.role}</span>
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
              style={{ backgroundColor: drive.companyColor }}
            >
              {drive.companyInitials}
            </div>

            {/* Meta */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-xl font-bold text-foreground">{drive.role}</h1>
                <span
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium"
                  style={{ backgroundColor: "#D1FAE5", color: "#065F46" }}
                >
                  <span className="size-1.5 rounded-full bg-[#10B981] animate-pulse" />
                  Live
                </span>
              </div>
              <p className="text-sm font-semibold text-foreground">{drive.company}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{drive.companyTagline}</p>

              <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="size-3.5 shrink-0" /> {drive.location}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Briefcase className="size-3.5 shrink-0" /> {drive.type} · {drive.duration}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <IndianRupee className="size-3.5 shrink-0" /> {drive.package}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarDays className="size-3.5 shrink-0" /> Closes {drive.deadline}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="size-3.5 shrink-0" /> {drive.applicants} applicants · {drive.openings} openings
                </span>
              </div>
            </div>

            {/* AI Match badge (desktop) */}
            <div className="hidden md:flex flex-col items-end gap-2 shrink-0">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold bg-[#EDE9FE] text-[#5B21B6] ai-glow">
                <Sparkles className="size-4" />
                {drive.aiMatch}% AI Match
              </span>
              <p className="text-xs tracking-tight text-muted-foreground">Based on your profile</p>
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
                  <div>
                    <p className="text-xs tracking-tight font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                      <GraduationCap className="size-3.5" /> Minimum CGPA
                    </p>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EEF2FF] text-[#3730A3] text-sm font-bold">
                      {drive.eligibility.cgpa} / 10
                    </span>
                  </div>

                  {/* Graduation year */}
                  <div>
                    <p className="text-xs tracking-tight font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                      <CalendarDays className="size-3.5" /> Graduation Year
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {drive.eligibility.graduation.map((y) => (
                        <span key={y} className="px-3 py-1.5 rounded-lg bg-accent text-accent-foreground text-sm font-medium border border-border">
                          {y}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Branches */}
                  <div className="sm:col-span-2">
                    <p className="text-xs tracking-tight font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                      <Building2 className="size-3.5" /> Eligible Branches
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {drive.eligibility.branches.map((b) => (
                        <span key={b} className="px-3 py-1.5 rounded-lg bg-accent text-accent-foreground text-xs font-medium border border-border">
                          {b}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Skills */}
                  <div className="sm:col-span-2">
                    <p className="text-xs tracking-tight font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                      <Sparkles className="size-3.5 text-violet-500" /> Required Skills
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {drive.eligibility.skills.map((s) => (
                        <span key={s} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#EDE9FE] text-[#5B21B6] border border-violet-200">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Backlogs */}
                  <div>
                    <p className="text-xs tracking-tight font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      Backlogs Allowed
                    </p>
                    {drive.eligibility.backlogs ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D1FAE5] text-[#065F46] text-xs font-medium">
                        <CheckCircle2 className="size-3.5" /> Yes
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FFE4E6] text-[#9F1239] text-xs font-medium">
                        <XCircle className="size-3.5" /> No active backlogs
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Job description */}
            <Card className="card-shadow border-border/60">
              <CardContent className="p-5">
                <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Briefcase className="size-4 text-[#4F46E5]" /> Job Description
                </h2>
                <div className="prose prose-sm max-w-none text-foreground">
                  {drive.description.split("\n\n").map((block, i) => {
                    if (block.startsWith("## ")) {
                      return (
                        <h3 key={i} className="text-sm font-semibold text-foreground mt-4 mb-2 first:mt-0">
                          {block.replace("## ", "")}
                        </h3>
                      );
                    }
                    if (block.startsWith("- ")) {
                      return (
                        <ul key={i} className="list-none space-y-1.5 mb-3">
                          {block.split("\n").filter(l => l.startsWith("- ")).map((line, j) => (
                            <li key={j} className="flex items-start gap-2 text-xs text-muted-foreground">
                              <span className="size-1.5 rounded-full bg-[#4F46E5] mt-1.5 shrink-0" />
                              {line.replace("- ", "")}
                            </li>
                          ))}
                        </ul>
                      );
                    }
                    if (block.trim()) {
                      return (
                        <p key={i} className="text-xs text-muted-foreground leading-relaxed mb-3">
                          {block.trim()}
                        </p>
                      );
                    }
                    return null;
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Selection process stepper */}
            <Card className="card-shadow border-border/60">
              <CardContent className="p-5">
                <h2 className="text-base font-semibold text-foreground mb-5 flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-[#4F46E5]" /> Selection Process
                </h2>
                <div className="space-y-0">
                  {drive.selectionProcess.map((step, i) => {
                    const isLast = i === drive.selectionProcess.length - 1;
                    const isCompleted = step.status === "completed";
                    const isActive = step.status === "active";
                    return (
                      <div key={step.step} className="flex gap-4">
                        {/* Timeline */}
                        <div className="flex flex-col items-center">
                          <StepIcon status={step.status} />
                          {!isLast && (
                            <div
                              className={`w-0.5 flex-1 my-1 ${
                                isCompleted ? "bg-[#4F46E5]" : "bg-border"
                              }`}
                              style={{ minHeight: 32 }}
                            />
                          )}
                        </div>

                        {/* Content */}
                        <div className={`pb-5 flex-1 min-w-0 ${isLast ? "pb-0" : ""}`}>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p
                                className={`text-sm font-medium ${
                                  isActive
                                    ? "text-[#4F46E5]"
                                    : isCompleted
                                    ? "text-foreground"
                                    : "text-muted-foreground"
                                }`}
                              >
                                {step.label}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">{step.sublabel}</p>
                            </div>
                            {isActive && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs tracking-tight font-semibold bg-[#EEF2FF] text-[#3730A3] shrink-0">
                                You are here
                              </span>
                            )}
                            {isCompleted && (
                              <span className="text-xs tracking-tight text-emerald-600 shrink-0 font-medium">Completed ✓</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Perks */}
            <Card className="card-shadow border-border/60">
              <CardContent className="p-5">
                <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Gift className="size-4 text-[#4F46E5]" /> Perks & Benefits
                </h2>
                <div className="flex flex-wrap gap-2">
                  {drive.perks.map((perk) => (
                    <span key={perk} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D1FAE5] text-[#065F46] text-xs font-medium">
                      <CheckCircle2 className="size-3.5" /> {perk}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── Right: sticky apply card ── */}
          <aside className="w-full lg:w-72 shrink-0">
            <div className="sticky top-36">
              <Card className="card-shadow border-border/60">
                <CardContent className="p-5 space-y-4">
                  <div>
                    <p className="text-lg font-bold text-foreground">{drive.package}</p>
                    <p className="text-xs text-muted-foreground">{drive.type} · {drive.duration}</p>
                  </div>

                  <Separator />

                  {/* Key stats */}
                  <div className="space-y-2.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Applications</span>
                      <span className="font-medium text-foreground">{drive.applicants}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Openings</span>
                      <span className="font-medium text-foreground">{drive.openings}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Deadline</span>
                      <span className="font-medium text-rose-500">{drive.deadline}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Min CGPA</span>
                      <span className="font-medium text-foreground">{drive.eligibility.cgpa}</span>
                    </div>
                  </div>

                  <Separator />

                  {/* AI Match */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-[#EDE9FE]">
                    <div className="flex items-center gap-2">
                      <Sparkles className="size-4 text-violet-500" />
                      <p className="text-xs font-semibold text-[#5B21B6]">AI Match Score</p>
                    </div>
                    <p className="text-lg font-bold text-[#5B21B6]">{drive.aiMatch}%</p>
                  </div>

                  {/* Eligibility check */}
                  <div className="space-y-1.5">
                    <p className="text-xs tracking-tight font-semibold uppercase tracking-wider text-muted-foreground mb-2">Your Eligibility</p>
                    <div className="flex items-center gap-2 text-xs text-emerald-700">
                      <CheckCircle2 className="size-3.5" /> CGPA 9.2 ≥ {drive.eligibility.cgpa} ✓
                    </div>
                    <div className="flex items-center gap-2 text-xs text-emerald-700">
                      <CheckCircle2 className="size-3.5" /> Branch: CSE ✓
                    </div>
                    <div className="flex items-center gap-2 text-xs text-emerald-700">
                      <CheckCircle2 className="size-3.5" /> No active backlogs ✓
                    </div>
                    <div className="flex items-center gap-2 text-xs text-emerald-700">
                      <CheckCircle2 className="size-3.5" /> Class of 2025 ✓
                    </div>
                  </div>

                  <Link href="/assessment/test-001" className="block w-full">
                    <Button className="w-full brand-gradient text-white font-semibold hover:opacity-90 transition-opacity">
                      Apply Now
                    </Button>
                  </Link>
                  <Button variant="outline" className="w-full text-xs">
                    Save Drive
                  </Button>

                  {/* Deadline urgency */}
                  <div className="flex items-center gap-1.5 justify-center">
                    <Clock className="size-3 text-muted-foreground" />
                    <p className="text-xs tracking-tight text-muted-foreground text-center">
                      Closes in <strong className="text-rose-500">12 days</strong>
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Share */}
              <p className="text-center text-xs text-muted-foreground mt-3 hover:text-foreground cursor-pointer transition-colors">
                Share this drive →
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

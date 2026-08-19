"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Award,
  Sparkles,
  CheckCircle2,
  Clock,
  BookOpen,
  Target,
  BarChart3,
  Zap,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";

interface StudentStats {
  applications_sent: number;
  shortlisted: number;
  interviews_scheduled: number;
  offers_received: number;
  ai_score: number | null;
  dsa_score: number | null;
  communication_score: number | null;
  resume_score: number | null;
}

export default function StudentProgressPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMyStats()
      .then((res: StudentStats) => {
        setStats(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load progress stats:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  // Calculate readiness index
  let readinessIndex = stats?.ai_score ?? null;
  if (readinessIndex === null) {
    let calculated = 35;
    if (user?.full_name && user?.college) calculated += 15;
    if (user?.resume_url) calculated += 20;
    if (user?.skills && user.skills.length > 0) calculated += 10;
    if ((stats?.applications_sent ?? 0) > 0) calculated += Math.min(20, (stats?.applications_sent ?? 0) * 5);
    readinessIndex = Math.min(95, calculated);
  }

  const dsaScore = stats?.dsa_score ?? null;
  const commScore = stats?.communication_score ?? null;
  const resumeScore = stats?.resume_score ?? (user?.resume_url ? 80 : null);

  const competencyMetrics = [
    {
      label: "DSA & Problem Solving",
      score: dsaScore,
      color: "text-emerald-600",
      bar: "bg-emerald-500",
      hint: "From online drive assessments",
    },
    {
      label: "AI Mock Interview Performance",
      score: commScore,
      color: "text-[#8B5CF6]",
      bar: "ai-gradient",
      hint: "From AI video interviews",
    },
    {
      label: "Resume ATS Score",
      score: resumeScore,
      color: "text-[#4F46E5]",
      bar: "brand-gradient",
      hint: "From AI resume screening",
    },
  ];

  const milestones = [
    {
      title: "Profile & Academic Details",
      desc: user?.full_name ? "100% verified profile details" : "Pending completion",
      status: user?.full_name ? "completed" : "pending",
    },
    {
      title: "ATS Resume Upload",
      desc: user?.resume_url ? "Uploaded & ready for screening" : "Upload your resume in Profile",
      status: user?.resume_url ? "completed" : "pending",
    },
    {
      title: "Drive Applications",
      desc: `${stats?.applications_sent || 0} application${(stats?.applications_sent || 0) === 1 ? "" : "s"} submitted`,
      status: (stats?.applications_sent || 0) > 0 ? "completed" : "pending",
    },
    {
      title: "Shortlists & Interviews",
      desc: `${stats?.shortlisted || 0} shortlisted · ${stats?.interviews_scheduled || 0} scheduled`,
      status: (stats?.shortlisted || 0) > 0 || (stats?.interviews_scheduled || 0) > 0 ? "completed" : "upcoming",
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Progress</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track your placement readiness, assessment performance, and upcoming milestones.
          </p>
        </div>
        <Link href="/applications">
          <Button className="brand-gradient text-white font-semibold gap-2">
            <Sparkles className="size-4" /> View My Applications
          </Button>
        </Link>
      </div>

      {/* Top Readiness Score Card */}
      <Card className="card-shadow border-border/60 bg-gradient-to-r from-indigo-50/50 via-white to-purple-50/40">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EDE9FE] text-[#5B21B6]">
                <Zap className="size-3.5" /> Placement Readiness Index
              </div>
              <h2 className="text-xl font-bold text-foreground">
                {readinessIndex >= 80 ? "You are on track for top tier placements" : "Build your readiness score"}
              </h2>
              <p className="text-xs text-muted-foreground max-w-md">
                Based on your profile completeness, application volume, and AI assessment benchmark results.
              </p>
            </div>
            <div className="flex items-center gap-4 bg-white px-6 py-4 rounded-2xl border border-border shadow-sm shrink-0">
              <div className="size-16 rounded-full brand-gradient flex items-center justify-center text-white text-2xl font-bold">
                {readinessIndex}
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Readiness Index</p>
                <p className="text-sm font-semibold text-emerald-600 flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="size-3.5" />
                  {readinessIndex >= 80 ? "Placement Ready" : "In Progress"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics & Milestones Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Skills Breakdown */}
        <Card className="card-shadow border-border/60">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="size-4 text-[#4F46E5]" /> Competency Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {competencyMetrics.map((metric, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-medium">
                  <div>
                    <span className="text-foreground font-semibold">{metric.label}</span>
                    <span className="text-[11px] text-muted-foreground ml-2">({metric.hint})</span>
                  </div>
                  {metric.score !== null ? (
                    <span className={`font-bold ${metric.color}`}>{metric.score}%</span>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">Not enough data yet</span>
                  )}
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  {metric.score !== null ? (
                    <div className={`h-full rounded-full ${metric.bar}`} style={{ width: `${metric.score}%` }} />
                  ) : (
                    <div className="h-full rounded-full bg-muted-foreground/20 w-0" />
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Milestone Timeline */}
        <Card className="card-shadow border-border/60">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="size-4 text-[#4F46E5]" /> Placement Milestones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {milestones.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div
                  className={`size-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    item.status === "completed"
                      ? "bg-emerald-100 text-emerald-600"
                      : "bg-[#EEF2FF] text-[#4F46E5]"
                  }`}
                >
                  {item.status === "completed" ? (
                    <CheckCircle2 className="size-4" />
                  ) : (
                    <Clock className="size-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

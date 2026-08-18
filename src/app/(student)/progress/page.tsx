"use client";

import type { Metadata } from "next";
import Link from "next/link";
import {
  TrendingUp,
  Award,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowRight,
  BookOpen,
  Target,
  BarChart3,
  Calendar,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { studentProfile } from "@/lib/mock-data";

export default function StudentProgressPage() {
  const readinessMetrics = [
    { label: "Overall Placement Readiness", score: 87, color: "text-[#4F46E5]", bar: "brand-gradient" },
    { label: "DSA & Problem Solving", score: 92, color: "text-emerald-600", bar: "bg-emerald-500" },
    { label: "AI Mock Interview Performance", score: 84, color: "text-[#8B5CF6]", bar: "ai-gradient" },
    { label: "Resume ATS Score", score: 90, color: "text-[#4F46E5]", bar: "brand-gradient" },
  ];

  const milestones = [
    { title: "Profile & Resume Completed", date: "Aug 10, 2026", status: "completed", desc: "100% verified by placement cell" },
    { title: "AI Diagnostic Assessment", date: "Aug 12, 2026", status: "completed", desc: "Scored 92/100 in Technical Core" },
    { title: "Mock Interview Round 1", date: "Aug 15, 2026", status: "completed", desc: "Strong performance in System Design" },
    { title: "Google SWE Drive Screening", date: "Aug 20, 2026", status: "upcoming", desc: "Shortlisted for Round 1 Technical" },
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
            <Sparkles className="size-4" /> Practice AI Interview
          </Button>
        </Link>
      </div>

      {/* Top Readiness Score Card */}
      <Card className="card-shadow border-border/60 bg-gradient-to-r from-indigo-50/50 via-white to-purple-50/40">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EDE9FE] text-[#5B21B6]">
                <Zap className="size-3.5" /> High Readiness Tier
              </div>
              <h2 className="text-xl font-bold text-foreground">You are in the top 10% of candidates</h2>
              <p className="text-xs text-muted-foreground max-w-md">
                Based on your mock interview scores, ATS resume rating, and problem-solving benchmarks across {studentProfile.college}.
              </p>
            </div>
            <div className="flex items-center gap-4 bg-white px-6 py-4 rounded-2xl border border-border shadow-sm shrink-0">
              <div className="size-16 rounded-full brand-gradient flex items-center justify-center text-white text-2xl font-bold">
                87
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Readiness Index</p>
                <p className="text-sm font-semibold text-emerald-600 flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="size-3.5" /> Placement Ready
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
          <CardContent className="space-y-5">
            {readinessMetrics.map((metric, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-foreground">{metric.label}</span>
                  <span className={`font-bold ${metric.color}`}>{metric.score}%</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${metric.bar}`} style={{ width: `${metric.score}%` }} />
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
                    item.status === "completed" ? "bg-emerald-100 text-emerald-600" : "bg-[#EEF2FF] text-[#4F46E5]"
                  }`}
                >
                  {item.status === "completed" ? <CheckCircle2 className="size-4" /> : <Clock className="size-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-foreground">{item.title}</p>
                    <span className="text-[11px] text-muted-foreground font-medium">{item.date}</span>
                  </div>
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

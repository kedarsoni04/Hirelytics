"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Download,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  FileText,
  ClipboardCheck,
  Video,
  MessageSquare,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { CircularProgress } from "@/components/ui/circular-progress";
import { candidates, companyDrives, type CandidateStage } from "@/lib/mock-data";

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

export default function CandidateScorecardPage({ params }: { params: { candidateId: string; driveId: string } }) {
  // Use mock data fallback if ID not found for demo purposes
  const candidate = candidates.find(c => c.id === params.candidateId) || candidates[0];
  const drive = companyDrives.find(d => d.id === params.driveId) || companyDrives[0];

  const cfg = stageConfig[candidate.stage];

  // Action states for the demo
  const [decision, setDecision] = useState<"pending" | "shortlisted" | "rejected">("pending");

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">

      {/* ── Breadcrumb & Back ── */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link href={`/company/drives/${drive.id}/candidates`} className="hover:text-foreground hover:underline transition-colors flex items-center gap-1">
          <ChevronLeft className="size-3" /> Back to Candidates
        </Link>
        <span className="text-border">|</span>
        <span>{drive.role}</span>
        <ChevronRight className="size-3" />
        <span className="font-medium text-foreground">{candidate.name}</span>
      </div>

      {/* ── Header Card ── */}
      <Card className="card-shadow border-border/60">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex items-center gap-5">
              <Avatar className="size-20 shrink-0">
                <AvatarFallback
                  className="text-2xl font-bold text-white shadow-inner"
                  style={{ background: `hsl(${(candidate.id.charCodeAt(1) * 37) % 360}, 65%, 50%)` }}
                >
                  {candidate.initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-bold text-foreground">{candidate.name}</h1>
                  <span
                    className="px-2.5 py-1 rounded-full text-xs tracking-tight font-bold"
                    style={{ backgroundColor: cfg.bg, color: cfg.color }}
                  >
                    {cfg.label}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {candidate.college} · {candidate.branch} · Applied {candidate.appliedDate}
                </p>
                <div className="flex items-center gap-4 mt-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-muted text-muted-foreground text-xs font-semibold">
                    CGPA: {candidate.cgpa} / 10
                  </span>
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
                    <Download className="size-3" /> Resume
                  </Button>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-col gap-2 shrink-0 md:w-48">
              {decision === "pending" ? (
                <>
                  <Button
                    onClick={() => setDecision("shortlisted")}
                    className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm"
                  >
                    <CheckCircle2 className="size-4" /> Move to Next Round
                  </Button>
                  <Button
                    onClick={() => setDecision("rejected")}
                    variant="outline"
                    className="w-full gap-2 text-[#F43F5E] hover:bg-[#FFE4E6] hover:text-[#E11D48] border-[#F43F5E]/30"
                  >
                    <XCircle className="size-4" /> Reject Candidate
                  </Button>
                </>
              ) : decision === "shortlisted" ? (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                  <CheckCircle2 className="size-5 text-emerald-600 mx-auto mb-1" />
                  <p className="text-xs font-bold text-emerald-800">Candidate Shortlisted</p>
                  <Button size="sm" variant="outline" className="w-full mt-2 h-7 text-xs tracking-tight gap-1.5">
                    <Calendar className="size-3" /> Schedule Interview
                  </Button>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-center">
                  <XCircle className="size-5 text-rose-600 mx-auto mb-1" />
                  <p className="text-xs font-bold text-rose-800">Candidate Rejected</p>
                  <Button size="sm" variant="ghost" onClick={() => setDecision("pending")} className="w-full mt-1 h-6 text-xs tracking-tight text-rose-700">
                    Undo Decision
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Main AI Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column: Overall Score & Insights */}
        <div className="lg:col-span-1 space-y-6">
          {/* Overall Score */}
          <Card className="card-shadow border-border/60 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#8B5CF6]/5 rounded-bl-full blur-2xl" />
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="flex items-center gap-1.5 mb-4 text-[#5B21B6] font-bold text-sm bg-[#EDE9FE] px-3 py-1 rounded-full">
                <Sparkles className="size-4" /> Overall AI Match
              </div>
              <CircularProgress value={candidate.aiScore} size={140} strokeWidth={12} />
              <p className="text-xs text-muted-foreground mt-5 leading-relaxed">
                <strong className="text-foreground">Strong technical fit.</strong> High coding assessment score and excellent communication skills observed during AI video interview.
              </p>
            </CardContent>
          </Card>

          {/* AI Interview Insights */}
          <Card className="card-shadow border-border/60">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Video className="size-4 text-[#5B21B6]" />
                <h3 className="text-sm font-bold text-foreground">Video Interview Insights</h3>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start gap-2.5">
                  <span className="size-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    <strong className="text-foreground">High Confidence:</strong> Maintained good eye contact and spoke clearly in 85% of responses.
                  </p>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="size-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    <strong className="text-foreground">Technical Depth:</strong> Clearly explained distributed systems concepts. Mentioned "React" and "Node" multiple times contextually.
                  </p>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="size-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    <strong className="text-foreground">Area to Probe:</strong> Showed slight hesitation when answering the system design follow-up question.
                  </p>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Detailed Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-lg font-bold text-foreground">Score Breakdown</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Resume Match */}
            <Card className="border-border/60 bg-muted/20">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <FileText className="size-4 text-[#4F46E5]" /> Resume Match
                  </div>
                  <span className="text-lg font-bold text-[#4F46E5]">88%</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-[#4F46E5] rounded-full" style={{ width: "88%" }} />
                </div>
                <p className="text-xs tracking-tight text-muted-foreground mt-2">
                  Matches 8/9 required skills. Strong alignment with job description.
                </p>
              </CardContent>
            </Card>

            {/* Assessment Score */}
            <Card className="border-border/60 bg-muted/20">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <ClipboardCheck className="size-4 text-[#059669]" /> Assessment
                  </div>
                  <span className="text-lg font-bold text-[#059669]">92%</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-[#10B981] rounded-full" style={{ width: "92%" }} />
                </div>
                <div className="flex justify-between items-center text-xs tracking-tight text-muted-foreground mt-2">
                  <span>18/20 Correct</span>
                  <span>Time: 42m / 60m</span>
                </div>
              </CardContent>
            </Card>

            {/* Communication Score */}
            <Card className="border-border/60 bg-muted/20">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <MessageSquare className="size-4 text-[#D97706]" /> Communication
                  </div>
                  <span className="text-lg font-bold text-[#D97706]">85%</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-[#F59E0B] rounded-full" style={{ width: "85%" }} />
                </div>
                <p className="text-xs tracking-tight text-muted-foreground mt-2">
                  Clear articulation, good vocabulary. Detected positive tone.
                </p>
              </CardContent>
            </Card>

            {/* Keyword Relevance */}
            <Card className="border-border/60 bg-muted/20">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <TrendingUp className="size-4 text-[#9D174D]" /> Keyword Relevance
                  </div>
                  <span className="text-lg font-bold text-[#9D174D]">95%</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-[#EC4899] rounded-full" style={{ width: "95%" }} />
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {["React", "Node.js", "System Design", "AWS"].map((kw) => (
                    <span key={kw} className="text-[9px] font-medium bg-pink-100 text-pink-800 px-1.5 py-0.5 rounded">
                      {kw}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Timeline / Activity for candidate */}
          <div className="mt-8">
            <h2 className="text-base font-bold text-foreground mb-4">Candidate Journey</h2>
            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-border before:to-transparent">
              
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center size-6 rounded-full border-2 border-background bg-emerald-500 text-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow">
                  <CheckCircle2 className="size-3.5" />
                </div>
                <div className="w-[calc(100%-3rem)] md:w-[calc(50%-1.5rem)] p-4 rounded-xl border border-border/60 bg-card card-shadow ml-4 md:ml-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-bold text-foreground">AI Video Interview</p>
                    <span className="text-xs tracking-tight text-muted-foreground">{candidate.appliedDate}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Completed asynchronous video interview. Scored 85%.</p>
                </div>
              </div>

              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center size-6 rounded-full border-2 border-background bg-emerald-500 text-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow">
                  <CheckCircle2 className="size-3.5" />
                </div>
                <div className="w-[calc(100%-3rem)] md:w-[calc(50%-1.5rem)] p-4 rounded-xl border border-border/60 bg-card card-shadow ml-4 md:ml-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-bold text-foreground">Online Assessment</p>
                    <span className="text-xs tracking-tight text-muted-foreground">Jan 12</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Completed technical assessment. Scored 92%.</p>
                </div>
              </div>

              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center size-6 rounded-full border-2 border-background bg-[#4F46E5] text-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow">
                  <FileText className="size-3" />
                </div>
                <div className="w-[calc(100%-3rem)] md:w-[calc(50%-1.5rem)] p-4 rounded-xl border border-border/60 bg-card card-shadow ml-4 md:ml-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-bold text-foreground">Application Submitted</p>
                    <span className="text-xs tracking-tight text-muted-foreground">Jan 10</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Resume parsed and pre-screened by AI.</p>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

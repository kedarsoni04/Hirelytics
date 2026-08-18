"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
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
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { CircularProgress } from "@/components/ui/circular-progress";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

// ── Stage config ──────────────────────────────────────────────────────────────
const stageConfig: Record<string, { label: string; bg: string; color: string }> = {
  applied:         { label: "Applied",         bg: "#F1F5F9", color: "#475569" },
  resume_screened: { label: "Resume Screened", bg: "#EDE9FE", color: "#5B21B6" },
  assessment:      { label: "Assessment",      bg: "#DBEAFE", color: "#1E40AF" },
  ai_interview:    { label: "AI Interview",    bg: "#FEF3C7", color: "#92400E" },
  shortlisted:     { label: "Shortlisted",     bg: "#D1FAE5", color: "#065F46" },
  hr_round:        { label: "HR Round",        bg: "#E0E7FF", color: "#3730A3" },
  offered:         { label: "Offered",         bg: "#D1FAE5", color: "#065F46" },
  hired:           { label: "Hired",           bg: "#CCFBF1", color: "#115E59" },
  rejected:        { label: "Rejected",        bg: "#FFE4E6", color: "#9F1239" },
};

function getInitials(name: string) {
  if (!name) return "??";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return "N/A";
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

export default function CandidateScorecardPage() {
  const params = useParams();
  const driveId = params?.driveId as string;
  const candidateId = params?.candidateId as string; // this is application_id

  const [application, setApplication] = useState<any | null>(null);
  const [scorecard, setScorecard] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [generating, setGenerating] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadData = async () => {
    if (!candidateId) return;
    try {
      setLoading(true);
      setError(null);
      const appData = await api.getApplication(candidateId);
      setApplication(appData);

      try {
        const scData = await api.getScorecard(candidateId);
        setScorecard(scData);
      } catch (scErr) {
        // Scorecard not generated yet, which is expected before generation
        setScorecard(null);
      }
    } catch (err: any) {
      console.error("[Candidate Scorecard] Load error:", err);
      setError(err.message || "Failed to load candidate application");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [candidateId]);

  const handleStageAction = async (newStage: string) => {
    try {
      setActionLoading(true);
      setActionMessage(null);
      await api.updateApplicationStage(candidateId, newStage);
      setApplication((prev: any) => ({ ...prev, current_stage: newStage }));
    } catch (err: any) {
      console.error("[Candidate Action] Error:", err);
      setActionMessage(err.message || "Failed to update candidate stage");
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerateScorecard = async () => {
    try {
      setGenerating(true);
      setActionMessage(null);
      const sc = await api.generateScorecard(candidateId);
      setScorecard(sc);
      // Reload application to get any updated stage
      const updatedApp = await api.getApplication(candidateId);
      setApplication(updatedApp);
    } catch (err: any) {
      console.error("[Generate Scorecard] Error:", err);
      setActionMessage(err.message || "Failed to generate scorecard. Complete Assessment & Interview first.");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 className="size-8 animate-spin text-[#4F46E5]" />
        <p className="text-sm text-muted-foreground">Loading candidate profile & scorecard…</p>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card className="border-rose-200 bg-rose-50">
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <AlertCircle className="size-8 text-rose-500" />
            <p className="text-sm font-medium text-rose-700">{error ?? "Candidate application not found"}</p>
            <Link href={`/company/drives/${driveId}/candidates`}>
              <Button size="sm" variant="outline" className="text-xs mt-2">
                <ChevronLeft className="size-3.5 mr-1" /> Back to Candidates
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const student = application.student || {};
  const drive = application.drive || {};
  const stage = application.current_stage || "applied";
  const cfg = stageConfig[stage] || { label: stage, bg: "#F1F5F9", color: "#475569" };
  const initials = getInitials(student.full_name || "Candidate");

  const overallScore = scorecard?.overall_ai_score ?? null;
  const resumeScore = scorecard?.resume_match_score ?? null;
  const assessmentScore = scorecard?.assessment_score ?? null;
  const commScore = scorecard?.communication_score ?? null;
  const insights: string[] = scorecard?.ai_insights || [];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* ── Breadcrumb & Back ── */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link
          href={`/company/drives/${driveId}/candidates`}
          className="hover:text-foreground hover:underline transition-colors flex items-center gap-1"
        >
          <ChevronLeft className="size-3" /> Back to Candidates
        </Link>
        <span className="text-border">|</span>
        <span>{drive.title || "Drive"}</span>
        <ChevronRight className="size-3" />
        <span className="font-medium text-foreground">{student.full_name || "Candidate"}</span>
      </div>

      {actionMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center justify-between">
          <span>{actionMessage}</span>
          <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setActionMessage(null)}>
            Dismiss
          </Button>
        </div>
      )}

      {/* ── Header Card ── */}
      <Card className="card-shadow border-border/60">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex items-center gap-5">
              <Avatar className="size-20 shrink-0">
                <AvatarFallback
                  className="text-2xl font-bold text-white shadow-inner"
                  style={{
                    background: `hsl(${(application.id.charCodeAt(0) * 37) % 360}, 65%, 50%)`,
                  }}
                >
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-bold text-foreground">
                    {student.full_name || "Unknown Candidate"}
                  </h1>
                  <span
                    className="px-2.5 py-1 rounded-full text-xs tracking-tight font-bold"
                    style={{ backgroundColor: cfg.bg, color: cfg.color }}
                  >
                    {cfg.label}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {student.college || "College N/A"} · {student.branch || "Branch N/A"} · Applied {formatDate(application.applied_at)}
                </p>
                <div className="flex items-center gap-4 mt-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-muted text-muted-foreground text-xs font-semibold">
                    CGPA: {student.cgpa !== null && student.cgpa !== undefined ? `${student.cgpa} / 10` : "N/A"}
                  </span>
                  {student.resume_url && (
                    <a href={student.resume_url} target="_blank" rel="noreferrer">
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
                        <Download className="size-3" /> Resume
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-col gap-2 shrink-0 md:w-56">
              {stage === "shortlisted" ? (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                  <CheckCircle2 className="size-5 text-emerald-600 mx-auto mb-1" />
                  <p className="text-xs font-bold text-emerald-800">Candidate Shortlisted</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStageAction("applied")}
                    disabled={actionLoading}
                    className="w-full mt-2 h-7 text-xs tracking-tight"
                  >
                    Undo Shortlist
                  </Button>
                </div>
              ) : stage === "rejected" ? (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-center">
                  <XCircle className="size-5 text-rose-600 mx-auto mb-1" />
                  <p className="text-xs font-bold text-rose-800">Candidate Rejected</p>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleStageAction("applied")}
                    disabled={actionLoading}
                    className="w-full mt-1 h-6 text-xs tracking-tight text-rose-700"
                  >
                    Undo Decision
                  </Button>
                </div>
              ) : (
                <>
                  <Button
                    onClick={() => handleStageAction("shortlisted")}
                    disabled={actionLoading}
                    className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm"
                  >
                    {actionLoading ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                    Shortlist Candidate
                  </Button>
                  <Button
                    onClick={() => handleStageAction("rejected")}
                    disabled={actionLoading}
                    variant="outline"
                    className="w-full gap-2 text-[#F43F5E] hover:bg-[#FFE4E6] hover:text-[#E11D48] border-[#F43F5E]/30"
                  >
                    <XCircle className="size-4" /> Reject Candidate
                  </Button>
                </>
              )}

              {/* Generate Scorecard Button */}
              {!scorecard && (
                <Button
                  onClick={handleGenerateScorecard}
                  disabled={generating}
                  className="w-full gap-1.5 brand-gradient text-white text-xs font-semibold mt-1"
                >
                  {generating ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" /> Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-3.5" /> Generate Scorecard
                    </>
                  )}
                </Button>
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
                <Sparkles className="size-4" /> Overall AI Score
              </div>
              {overallScore !== null ? (
                <>
                  <CircularProgress value={Math.round(overallScore)} size={140} strokeWidth={12} />
                  <p className="text-xs text-muted-foreground mt-5 leading-relaxed">
                    {scorecard?.ai_summary || "Scorecard generated from assessment & interview performance."}
                  </p>
                </>
              ) : (
                <div className="py-8 text-center space-y-3">
                  <p className="text-xs text-muted-foreground">Scorecard not yet generated for this candidate.</p>
                  <Button
                    size="sm"
                    onClick={handleGenerateScorecard}
                    disabled={generating}
                    className="brand-gradient text-white text-xs gap-1.5"
                  >
                    {generating ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
                    Generate Now
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Insights */}
          {insights.length > 0 && (
            <Card className="card-shadow border-border/60">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Video className="size-4 text-[#5B21B6]" />
                  <h3 className="text-sm font-bold text-foreground">AI Evaluation Insights</h3>
                </div>
                <ul className="space-y-3">
                  {insights.map((insight, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span className="size-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                      <p className="text-xs text-muted-foreground leading-relaxed">{insight}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Detailed Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">Evaluation Breakdown</h2>
            {scorecard && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleGenerateScorecard}
                disabled={generating}
                className="text-xs gap-1 text-muted-foreground"
              >
                <RefreshCw className={cn("size-3", generating && "animate-spin")} /> Re-evaluate
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Resume Match */}
            <Card className="border-border/60 bg-muted/20">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <FileText className="size-4 text-[#4F46E5]" /> Resume Match
                  </div>
                  <span className="text-lg font-bold text-[#4F46E5]">
                    {resumeScore !== null ? `${Math.round(resumeScore)}%` : "—"}
                  </span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#4F46E5] rounded-full transition-all"
                    style={{ width: `${resumeScore ?? 0}%` }}
                  />
                </div>
                <p className="text-xs tracking-tight text-muted-foreground mt-2">
                  Alignment with drive eligibility & criteria.
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
                  <span className="text-lg font-bold text-[#059669]">
                    {assessmentScore !== null ? `${Math.round(assessmentScore)}%` : "—"}
                  </span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#10B981] rounded-full transition-all"
                    style={{ width: `${assessmentScore ?? 0}%` }}
                  />
                </div>
                <p className="text-xs tracking-tight text-muted-foreground mt-2">
                  Technical & aptitude assessment score.
                </p>
              </CardContent>
            </Card>

            {/* Communication Score */}
            <Card className="border-border/60 bg-muted/20">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <MessageSquare className="size-4 text-[#D97706]" /> Communication
                  </div>
                  <span className="text-lg font-bold text-[#D97706]">
                    {commScore !== null ? `${Math.round(commScore)}%` : "—"}
                  </span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#F59E0B] rounded-full transition-all"
                    style={{ width: `${commScore ?? 0}%` }}
                  />
                </div>
                <p className="text-xs tracking-tight text-muted-foreground mt-2">
                  AI speech & sentiment analysis evaluation.
                </p>
              </CardContent>
            </Card>

            {/* Candidate Skills */}
            <Card className="border-border/60 bg-muted/20">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <TrendingUp className="size-4 text-[#9D174D]" /> Verified Skills
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {student.skills && student.skills.length > 0 ? (
                    student.skills.map((skill: string) => (
                      <span
                        key={skill}
                        className="text-xs font-medium bg-pink-100 text-pink-800 px-2 py-0.5 rounded-md"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground italic">No skills listed</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

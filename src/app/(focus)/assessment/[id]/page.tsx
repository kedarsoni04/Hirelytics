"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Flag,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Trophy,
  Calendar,
  Timer,
  LockKeyhole,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import OptionCard from "@/components/assessment/OptionCard";
import QuestionPalette from "@/components/assessment/QuestionPalette";
import CountdownTimer from "@/components/assessment/CountdownTimer";
import ProctorWarningModal from "@/components/assessment/ProctorWarningModal";
import { useProctor } from "@/lib/useProctor";
import { api } from "@/lib/api";
import { dispatchNotificationsUpdated } from "@/lib/use-unread-count";
import type { QuestionStatus } from "@/lib/types";

/** Max tab-switch / window-blur violations before the exam is force-submitted */
const MAX_VIOLATIONS = 3;

type AssessmentQuestion = {
  id?: number;
  question: string;
  options: string[];
  [key: string]: unknown;
};

type AssessmentData = {
  id: string;
  drive_id: string;
  questions: AssessmentQuestion[];
  duration_mins: number;
  assessment_start?: string | null;
  assessment_end?: string | null;
};

type SubmissionResult = {
  score: number | null;
  [key: string]: unknown;
};

type FormattedOption = {
  id: string;
  text: string;
  index: number;
};

export default function AssessmentPage() {
  const params = useParams();
  const rawId = params?.id as string;

  const [assessment, setAssessment] = useState<AssessmentData | null>(null);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [driveTitle, setDriveTitle] = useState<string>("Technical Assessment");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  /** "upcoming" = window not opened yet, "closed" = window ended, null = no window issue */
  const [windowStatus, setWindowStatus] = useState<"upcoming" | "closed" | null>(null);
  const [notShortlisted, setNotShortlisted] = useState(false);
  const [candidateStage, setCandidateStage] = useState<string>("applied");

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());

  const [submitting, setSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);

  /** Pre-exam acknowledgement gate — must accept anti-cheat rules before starting */
  const [acknowledged, setAcknowledged] = useState(false);

  // ── Anti-cheat: proctoring ────────────────────────────────────────────────
  // handleForceSubmit is defined after state, so we forward-declare via ref pattern
  const forceSubmitRef = useRef<(() => void) | undefined>(undefined);
  const handleForceSubmit = useCallback(() => {
    forceSubmitRef.current?.();
  }, []);

  const {
    proctorFlags,
    violationCount,
    showWarning,
    lastViolation,
    dismissWarning,
  } = useProctor({
    maxViolations: MAX_VIOLATIONS,
    onForceSubmit: handleForceSubmit,
    // Disable proctoring once submitted, while loading, or before the user acknowledges rules
    enabled: !submissionResult && !loading && acknowledged && !notShortlisted,
  });

  useEffect(() => {
    if (!rawId) return;

    const loadAssessmentData = async () => {
      try {
        setLoading(true);
        setError(null);
        setNotShortlisted(false);

        let resolvedDriveId = rawId;
        let resolvedAppId: string | null = null;
        let appStage: string | null = null;

        // Try to see if rawId is an application_id first, or drive_id
        try {
          const app = await api.getApplication(rawId);
          if (app) {
            resolvedAppId = app.id;
            resolvedDriveId = app.drive_id;
            appStage = app.current_stage;
            if (app.drive?.title) setDriveTitle(app.drive.title);
          }
        } catch {
          // If not application, maybe rawId is drive_id
          resolvedDriveId = rawId;
        }

        // Find student's application for this drive if not already resolved
        if (!resolvedAppId || !appStage) {
          try {
            const myApps = await api.getMyApplications();
            const matchingApp = myApps.find((a: { drive_id: string; id: string; current_stage: string; drive?: { id: string; title?: string } }) => a.drive_id === resolvedDriveId || a.drive?.id === resolvedDriveId);
            if (matchingApp) {
              resolvedAppId = matchingApp.id;
              appStage = matchingApp.current_stage;
              if (matchingApp.drive?.title) setDriveTitle(matchingApp.drive.title);
            }
          } catch (e) {
            console.error("Could not resolve application for drive:", e);
          }
        }

        setApplicationId(resolvedAppId);

        // Check shortlisting gate: candidate must be shortlisted before taking the exam
        if (appStage) {
          setCandidateStage(appStage);
          const isShortlisted = ["shortlisted", "assessment", "ai_interview", "hr_round", "offer", "offered", "hired"].includes(appStage);
          if (!isShortlisted) {
            setNotShortlisted(true);
            setLoading(false);
            return;
          }
        }

        // Fetch assessment for drive
        try {
          const assessData = await api.getDriveAssessment(resolvedDriveId);
          setAssessment(assessData);

          // Check window timeline relative to current time
          if (assessData) {
            const nowMs = Date.now();
            const startMs = assessData.assessment_start ? new Date(assessData.assessment_start).getTime() : null;
            const endMs = assessData.assessment_end ? new Date(assessData.assessment_end).getTime() : null;

            if (startMs && nowMs < startMs) {
              setWindowStatus("upcoming");
            } else if (endMs && nowMs > endMs) {
              setWindowStatus("closed");
            }
          }
        } catch (fetchErr: unknown) {
          // Check if backend told us the window isn't open yet or already closed
          const msg = fetchErr instanceof Error ? fetchErr.message : "";
          if (msg.toLowerCase().includes("has not opened yet") || msg.toLowerCase().includes("not opened")) {
            setWindowStatus("upcoming");
          } else if (msg.toLowerCase().includes("window has closed") || msg.toLowerCase().includes("deadline")) {
            setWindowStatus("closed");
          } else {
            throw fetchErr; // re-throw so the outer catch sets error
          }
        }

        // Check if student already submitted this assessment previously
        if (resolvedAppId) {
          try {
            const existingSub = await api.getAssessmentSubmission(resolvedAppId);
            if (existingSub) {
              setSubmissionResult(existingSub);
            }
          } catch {
            // Not submitted yet — ready to take
          }
        }
      } catch (err: unknown) {
        console.error("[Assessment] Load error:", err);
        setError(err instanceof Error ? err.message : "Failed to load assessment. It might not be created for this drive yet.");
      } finally {
        setLoading(false);
      }
    };

    loadAssessmentData();
  }, [rawId]);

  const handleSubmit = useCallback(async (opts?: { force?: boolean }) => {
    if (!applicationId) {
      if (!opts?.force) alert("Application ID could not be identified for submission.");
      return;
    }

    // Manual submission: ask for confirmation. Force-submit skips the prompt.
    if (!opts?.force) {
      const total = assessment?.questions.length ?? 0;
      const confirmSubmit = window.confirm(
        `Are you sure you want to submit? You have answered ${
          Object.keys(selectedAnswers).length
        } of ${total} questions.`
      );
      if (!confirmSubmit) return;
    }

    try {
      setSubmitting(true);
      const answersPayload = Object.entries(selectedAnswers).map(([qIdx, selectedOpt]) => ({
        question_id: parseInt(qIdx, 10),
        selected_option: selectedOpt,
      }));

      const res = await api.submitAssessment({
        application_id: applicationId,
        answers: answersPayload,
        proctor_flags: proctorFlags,
      });

      setSubmissionResult(res);
      dispatchNotificationsUpdated();
    } catch (err: unknown) {
      console.error("[Submit Assessment] Error:", err);
      if (!opts?.force) alert(err instanceof Error ? err.message : "Failed to submit assessment.");
    } finally {
      setSubmitting(false);
    }
  }, [applicationId, selectedAnswers, proctorFlags, assessment]);

  // Wire force-submit into the ref so useProctor can call it
  useEffect(() => {
    forceSubmitRef.current = () => handleSubmit({ force: true });
  }, [handleSubmit]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="size-8 animate-spin text-[#4F46E5]" />
        <p className="text-sm text-muted-foreground">Loading assessment questions…</p>
      </div>
    );
  }

  // Not shortlisted gate
  if (notShortlisted) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6 bg-[#F8FAFC]">
        <Card className="border-border/60 max-w-lg w-full card-shadow text-center p-8 space-y-5 bg-white">
          <div className="size-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="size-8" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Assessment Reserved for Shortlisted Candidates</h1>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              This online exam is only accessible to candidates whose profiles have been reviewed and shortlisted after initial resume screening.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-muted/40 border border-border text-xs text-muted-foreground flex items-center justify-between">
            <span>Your Current Application Stage:</span>
            <span className="font-bold text-[#4F46E5] uppercase tracking-wider text-[11px] px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200">
              {candidateStage.replace(/_/g, " ")}
            </span>
          </div>
          <div className="p-3 rounded-lg bg-indigo-50/50 border border-indigo-100 text-[11px] text-muted-foreground text-left">
            💡 Once the company completes resume screening and shortlists your application, the online exam will become available during its scheduled live window.
          </div>
          <Link href="/applications" className="block pt-2">
            <Button className="w-full brand-gradient text-white font-semibold text-xs">
              Return to My Applications
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  // Assessment window hasn't opened yet
  if (windowStatus === "upcoming") {
    return (
      <div className="flex items-center justify-center min-h-screen p-6 bg-[#F8FAFC]">
        <Card className="border-amber-200 bg-white max-w-lg w-full card-shadow text-center p-8 space-y-5">
          <div className="size-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
            <Timer className="size-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Assessment Not Yet Live</h2>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              This online exam has been scheduled but has not opened yet. It will become live during the configured time window.
            </p>
          </div>
          {assessment?.assessment_start && (
            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 space-y-1">
              <p className="font-bold flex items-center justify-center gap-1.5">
                <Calendar className="size-3.5 text-amber-600" />
                Opens: {new Date(assessment.assessment_start).toLocaleString("en-IN", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
              </p>
              {assessment?.assessment_end && (
                <p className="text-[11px] text-amber-700">
                  Deadline: {new Date(assessment.assessment_end).toLocaleString("en-IN", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
                </p>
              )}
            </div>
          )}
          <Link href="/applications" className="block pt-2">
            <Button variant="outline" className="w-full text-xs">
              Back to My Applications
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  // Assessment window has closed
  if (windowStatus === "closed") {
    return (
      <div className="flex items-center justify-center min-h-screen p-6 bg-[#F8FAFC]">
        <Card className="border-slate-200 bg-white max-w-lg w-full card-shadow text-center p-8 space-y-5">
          <div className="size-16 rounded-2xl bg-slate-100 border border-slate-200 text-slate-500 flex items-center justify-center mx-auto">
            <LockKeyhole className="size-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Assessment Window Closed</h2>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              The deadline to take this assessment has passed. Submissions are no longer accepted for this exam window.
            </p>
          </div>
          {assessment?.assessment_end && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
              Exam Deadline was: <strong>{new Date(assessment.assessment_end).toLocaleString("en-IN", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}</strong>
            </div>
          )}
          <Link href="/applications" className="block pt-2">
            <Button variant="outline" className="w-full text-xs">
              Back to My Applications
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (error || !assessment || !assessment.questions || assessment.questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <Card className="border-rose-200 bg-rose-50 max-w-lg w-full">
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <AlertCircle className="size-8 text-rose-500" />
            <h2 className="text-base font-bold text-rose-800">Assessment Unavailable</h2>
            <p className="text-xs text-rose-600">{error ?? "No assessment questions found for this drive."}</p>
            <Link href="/applications">
              <Button size="sm" variant="outline" className="text-xs mt-3">
                Back to My Applications
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If student hasn't applied to this drive yet
  if (!applicationId && !submissionResult) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <Card className="border-border max-w-lg w-full card-shadow">
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <AlertCircle className="size-8 text-[#4F46E5]" />
            <h2 className="text-base font-bold text-foreground">Application Required</h2>
            <p className="text-xs text-muted-foreground">
              You must apply to the campus drive before you can take the technical assessment.
            </p>
            <div className="flex gap-2 mt-3">
              <Link href="/drives">
                <Button size="sm" variant="outline" className="text-xs">
                  Browse Drives
                </Button>
              </Link>
              <Link href="/applications">
                <Button size="sm" className="brand-gradient text-white text-xs">
                  My Applications
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If already submitted, show result screen
  if (submissionResult) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6 bg-[#F8FAFC]">
        <Card className="max-w-md w-full card-shadow border-border/60 text-center p-8 space-y-6">
          <div className="size-16 rounded-full bg-[#D1FAE5] text-[#065F46] flex items-center justify-center mx-auto">
            <Trophy className="size-8 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Assessment Submitted!</h1>
            <p className="text-xs text-muted-foreground mt-1">
              Your responses have been recorded and graded by our automated evaluation engine.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#EEF2FF] border border-[#C7D2FE]">
            <p className="text-xs font-semibold text-[#3730A3] uppercase tracking-wider">Your Score</p>
            <p className="text-3xl font-extrabold text-[#4F46E5] mt-1">
              {Math.round(submissionResult.score ?? 0)}%
            </p>
          </div>

          <Link href="/applications" className="block">
            <Button className="w-full brand-gradient text-white font-semibold">
              Return to Applications <ArrowRight className="size-4 ml-2" />
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const questions = assessment.questions;
  const total = questions.length;
  const currentQ = questions[currentIndex];
  const isFlagged = flaggedQuestions.has(currentIndex);

  const formattedOptions = (currentQ.options || []).map((optText: string, i: number) => {
    const letters = ["a", "b", "c", "d", "e"];
    return {
      id: letters[i] || String(i),
      text: optText,
      index: i,
    };
  });

  const currentSelectedOption =
    selectedAnswers[currentIndex] !== undefined
      ? formattedOptions[selectedAnswers[currentIndex]]?.id ?? null
      : null;

  const handleSelectOption = (optId: string) => {
    const foundIndex = formattedOptions.findIndex((o: FormattedOption) => o.id === optId);
    if (foundIndex !== -1) {
      setSelectedAnswers((prev) => ({
        ...prev,
        [currentIndex]: foundIndex,
      }));
    }
  };

  const handleToggleFlag = () => {
    setFlaggedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(currentIndex)) {
        next.delete(currentIndex);
      } else {
        next.add(currentIndex);
      }
      return next;
    });
  };

  const handleNext = () => {
    if (currentIndex < total - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };



  // Build statuses map for QuestionPalette (1-indexed)
  const statuses: Record<number, QuestionStatus> = {};
  for (let i = 0; i < total; i++) {
    const num = i + 1;
    if (flaggedQuestions.has(i)) {
      statuses[num] = "flagged";
    } else if (selectedAnswers[i] !== undefined) {
      statuses[num] = "answered";
    } else {
      statuses[num] = "unanswered";
    }
  }

  // ── Pre-exam anti-cheat acknowledgement screen ───────────────────────────
  if (!acknowledged) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6 bg-[#F8FAFC]">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-border/60">
          {/* Header */}
          <div className="px-8 py-6 bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] text-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="size-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <ShieldCheck className="size-5 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold">Proctored Assessment</h1>
                <p className="text-xs text-white/75">{driveTitle}</p>
              </div>
            </div>
          </div>

          {/* Rules */}
          <div className="px-8 py-6 space-y-5">
            <p className="text-sm font-semibold text-foreground">
              Before you begin, please read the anti-cheat rules carefully:
            </p>

            <ul className="space-y-3">
              {([
                ["🚫", "Tab Switching", "Navigating away from this tab is recorded and counts as a violation."],
                ["🚫", "Window Focus", "Switching to another app or window (Alt+Tab) is detected and flagged."],
                ["🚫", "Copy / Paste", "Clipboard use (Ctrl+C / Ctrl+V) is fully blocked during the exam."],
                ["🚫", "Right-Click", "Context menu is disabled. Browser inspect tools are not accessible."],
                ["🚫", "DevTools", "F12, Ctrl+Shift+I, and similar shortcuts are blocked and logged."],
                ["🚫", "Printing / Screenshots", "Ctrl+P and PrintScreen are detected and flagged."],
                ["⚠️", "Auto-Submit", `${MAX_VIOLATIONS} violations will automatically submit your exam with current answers.`],
                ["⏱️", "Time Limit", "Time expiry also automatically submits your exam — even if unanswered."],
              ] as [string, string, string][]).map(([emoji, title, desc]) => (
                <li key={title} className="flex items-start gap-3">
                  <span className="text-base leading-none mt-0.5">{emoji}</span>
                  <div>
                    <p className="text-xs font-semibold text-foreground">{title}</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{desc}</p>
                  </div>
                </li>
              ))}
            </ul>

            <p className="text-[11px] text-muted-foreground border-t pt-4">
              All violations are logged with timestamps and sent to the recruiter alongside your submission.
            </p>
          </div>

          {/* CTA */}
          <div className="px-8 pb-8">
            <Button
              className="w-full brand-gradient text-white font-bold text-sm py-3"
              onClick={() => setAcknowledged(true)}
            >
              I Understand — Start Assessment
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* ── Anti-cheat: Proctor warning modal ── */}
      {showWarning && (
        <ProctorWarningModal
          violationCount={violationCount}
          maxViolations={MAX_VIOLATIONS}
          lastViolation={lastViolation}
          onDismiss={dismissWarning}
          forceSubmitting={submitting && violationCount >= MAX_VIOLATIONS}
        />
      )}
      {/* ── Main Question Area ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top contextual bar */}
        <div className="h-14 border-b border-border bg-white px-8 flex items-center justify-between shrink-0 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-sm font-semibold text-foreground">
                Question {currentIndex + 1} <span className="text-muted-foreground font-normal">of {total}</span>
              </p>
              <p className="text-xs tracking-tight text-muted-foreground uppercase tracking-widest mt-0.5">
                Technical MCQ
              </p>
            </div>
            <div className="h-6 w-px bg-border mx-2" />
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs tracking-tight font-medium bg-[#EEF2FF] text-[#3730A3]">
              <span className="size-1.5 rounded-full bg-[#4F46E5]" />
              Standard
            </span>
          </div>

          <div className="flex items-center gap-6">
            <span
                className={`inline-flex items-center gap-1.5 text-xs tracking-tight font-medium px-2.5 py-1 rounded-md border transition-colors ${
                  violationCount === 0
                    ? "text-emerald-600 bg-emerald-50 border-emerald-100"
                    : violationCount < MAX_VIOLATIONS
                    ? "text-amber-700 bg-amber-50 border-amber-200"
                    : "text-red-700 bg-red-50 border-red-200"
                }`}
              >
                <ShieldCheck className="size-3.5" />
                {violationCount === 0
                  ? "Proctoring Active"
                  : `${violationCount}/${MAX_VIOLATIONS} Violations`}
              </span>
            <CountdownTimer
              initialSeconds={(assessment.duration_mins || 30) * 60}
              onExpire={() => handleSubmit({ force: true })}
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-8 max-w-4xl w-full mx-auto space-y-8 select-none">
          {/* Question text */}
          <div className="prose prose-sm max-w-none text-foreground">
            <p className="text-lg font-medium leading-relaxed text-[#1E293B]">
              {currentQ.question}
            </p>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {formattedOptions.map((opt: FormattedOption) => (
              <OptionCard
                key={opt.id}
                option={opt}
                selected={currentSelectedOption === opt.id}
                onSelect={handleSelectOption}
              />
            ))}
          </div>
        </div>

        {/* Bottom controls */}
        <div className="h-16 border-t border-border bg-white px-8 flex items-center justify-between shrink-0 sticky bottom-0 z-10">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="gap-2 text-xs"
          >
            <ChevronLeft className="size-4" /> Previous
          </Button>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className={`gap-2 text-xs transition-colors ${
                isFlagged
                  ? "border-[#F59E0B] bg-[#FEF3C7] text-[#92400E] hover:bg-[#FDE68A] hover:text-[#78350F]"
                  : ""
              }`}
              onClick={handleToggleFlag}
            >
              <Flag className={`size-4 ${isFlagged ? "fill-[#F59E0B]" : ""}`} />
              {isFlagged ? "Unflag Question" : "Flag for Review"}
            </Button>
            {currentIndex < total - 1 ? (
              <Button
                onClick={handleNext}
                className="brand-gradient text-white gap-2 px-6 text-xs hover:opacity-90 transition-opacity font-semibold"
              >
                Save & Next <ChevronRight className="size-4" />
              </Button>
            ) : (
              <Button
                onClick={() => handleSubmit()}
                disabled={submitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 px-6 text-xs font-semibold"
              >
                {submitting ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                Finish & Submit
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── Sidebar (Palette) ── */}
      <div className="w-80 bg-white border-l border-border flex flex-col shrink-0">
        <div className="p-5 border-b border-border shrink-0">
          <h2 className="text-sm font-bold text-foreground truncate">{driveTitle}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Online Assessment</p>
        </div>
        <div className="p-5 flex-1 overflow-y-auto">
          <h3 className="text-xs font-semibold text-foreground uppercase tracking-widest mb-4 text-muted-foreground">
            Question Palette
          </h3>
          <QuestionPalette
            total={total}
            current={currentIndex + 1}
            statuses={statuses}
            onJump={(n) => setCurrentIndex(n - 1)}
          />
        </div>
        <div className="p-5 border-t border-border shrink-0">
          <Button
            variant="destructive"
            disabled={submitting}
            className="w-full text-xs font-bold"
            onClick={() => handleSubmit()}
          >
            {submitting ? "Submitting..." : "Submit Assessment"}
          </Button>
        </div>
      </div>
    </div>
  );
}

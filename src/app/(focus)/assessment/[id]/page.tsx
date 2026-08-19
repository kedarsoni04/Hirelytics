"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import OptionCard from "@/components/assessment/OptionCard";
import QuestionPalette from "@/components/assessment/QuestionPalette";
import CountdownTimer from "@/components/assessment/CountdownTimer";
import { api } from "@/lib/api";
import type { QuestionStatus } from "@/lib/types";

export default function AssessmentPage() {
  const router = useRouter();
  const params = useParams();
  const rawId = params?.id as string;

  const [assessment, setAssessment] = useState<any | null>(null);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [driveTitle, setDriveTitle] = useState<string>("Technical Assessment");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());

  const [submitting, setSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any | null>(null);

  useEffect(() => {
    if (!rawId) return;

    const loadAssessmentData = async () => {
      try {
        setLoading(true);
        setError(null);

        let resolvedDriveId = rawId;
        let resolvedAppId = rawId;

        // Try to see if rawId is an application_id first, or drive_id
        try {
          const app = await api.getApplication(rawId);
          if (app) {
            resolvedAppId = app.id;
            resolvedDriveId = app.drive_id;
            if (app.drive?.title) setDriveTitle(app.drive.title);
          }
        } catch {
          // If not application, maybe rawId is drive_id
          resolvedDriveId = rawId;
          // Find student's application for this drive
          try {
            const myApps = await api.getMyApplications();
            const matchingApp = myApps.find((a: any) => a.drive_id === rawId || a.drive?.id === rawId);
            if (matchingApp) {
              resolvedAppId = matchingApp.id;
              if (matchingApp.drive?.title) setDriveTitle(matchingApp.drive.title);
            }
          } catch (e) {
            console.error("Could not resolve application for drive:", e);
          }
        }

        setApplicationId(resolvedAppId);

        // Fetch assessment for drive
        const assessData = await api.getDriveAssessment(resolvedDriveId);
        setAssessment(assessData);
      } catch (err: any) {
        console.error("[Assessment] Load error:", err);
        setError(err.message || "Failed to load assessment. It might not be created for this drive yet.");
      } finally {
        setLoading(false);
      }
    };

    loadAssessmentData();
  }, [rawId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="size-8 animate-spin text-[#4F46E5]" />
        <p className="text-sm text-muted-foreground">Loading assessment questions…</p>
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
    const foundIndex = formattedOptions.findIndex((o: any) => o.id === optId);
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

  const handleSubmit = async () => {
    if (!applicationId) {
      alert("Application ID could not be identified for submission.");
      return;
    }

    const confirmSubmit = window.confirm(
      `Are you sure you want to submit? You have answered ${
        Object.keys(selectedAnswers).length
      } of ${total} questions.`
    );
    if (!confirmSubmit) return;

    try {
      setSubmitting(true);
      const answersPayload = Object.entries(selectedAnswers).map(([qIdx, selectedOpt]) => ({
        question_id: parseInt(qIdx, 10),
        selected_option: selectedOpt,
      }));

      const res = await api.submitAssessment({
        application_id: applicationId,
        answers: answersPayload,
        proctor_flags: [],
      });

      setSubmissionResult(res);
    } catch (err: any) {
      console.error("[Submit Assessment] Error:", err);
      alert(err.message || "Failed to submit assessment.");
    } finally {
      setSubmitting(false);
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

  return (
    <div className="flex h-full">
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
            <span className="inline-flex items-center gap-1.5 text-xs tracking-tight font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
              <ShieldCheck className="size-3.5" /> Proctoring Active
            </span>
            <CountdownTimer initialSeconds={(assessment.duration_mins || 30) * 60} />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-8 max-w-4xl w-full mx-auto space-y-8">
          {/* Question text */}
          <div className="prose prose-sm max-w-none text-foreground">
            <p className="text-lg font-medium leading-relaxed text-[#1E293B]">
              {currentQ.question}
            </p>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {formattedOptions.map((opt: any) => (
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
                onClick={handleSubmit}
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
            onClick={handleSubmit}
          >
            {submitting ? "Submitting..." : "Submit Assessment"}
          </Button>
        </div>
      </div>
    </div>
  );
}

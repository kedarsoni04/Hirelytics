"use client";

import { useState } from "react";
import { Play, Square, RotateCcw, ShieldCheck, Clock, CheckCircle2, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress, ProgressTrack, ProgressIndicator } from "@/components/ui/progress";
import CameraBox from "@/components/interview/CameraBox";
import { interviewMeta, interviewQuestions } from "@/lib/mock-data";

type AppState = "idle" | "recording" | "analyzing" | "done";

export default function InterviewPage() {
  const [state, setState] = useState<AppState>("idle");
  const q = interviewQuestions[interviewMeta.currentQuestion - 1];

  const handleRecord = () => setState("recording");
  const handleStop = () => setState("analyzing");
  const handleRetake = () => setState("idle");
  const handleNext = () => setState("idle"); // Simulation

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC]">
      {/* Top bar */}
      <div className="h-14 border-b border-border bg-white px-8 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-sm font-bold text-foreground">AI Video Interview — {interviewMeta.company}</h1>
        </div>
        <div className="flex items-center gap-6">
          <span className="inline-flex items-center gap-1.5 text-xs tracking-tight font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
            <ShieldCheck className="size-3.5" /> Proctoring Active
          </span>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-sm font-semibold font-mono">
            <Clock className="size-3.5 text-muted-foreground" /> 14:30
          </div>
        </div>
      </div>

      {/* Main content split */}
      <div className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 min-h-0 overflow-y-auto">

        {/* Left: Video & Controls */}
        <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full">
          <CameraBox state={state === "done" ? "idle" : state} />

          {/* Controls */}
          <div className="flex flex-col items-center justify-center gap-4 bg-white p-6 rounded-2xl border border-border card-shadow">
            {state === "idle" && (
              <>
                <Button onClick={handleRecord} size="lg" className="w-full max-w-xs bg-[#F43F5E] hover:bg-[#E11D48] text-white rounded-full font-bold shadow-lg shadow-rose-500/20 gap-2 h-12">
                  <Play className="size-5 fill-white" /> Start Recording
                </Button>
                <p className="text-xs text-muted-foreground">Take a deep breath. You have 2 minutes to answer.</p>
              </>
            )}

            {state === "recording" && (
              <>
                <div className="flex items-center gap-3">
                  <div className="size-3 rounded-full bg-[#F43F5E] animate-pulse" />
                  <span className="font-mono text-xl font-bold text-[#F43F5E]">01:42</span>
                </div>
                <Button onClick={handleStop} size="lg" variant="outline" className="w-full max-w-xs rounded-full font-bold border-border hover:bg-rose-50 hover:text-[#E11D48] hover:border-rose-200 gap-2 h-12">
                  <Square className="size-5 fill-current" /> Stop Recording
                </Button>
              </>
            )}

            {state === "analyzing" && (
              <div className="flex flex-col items-center gap-4 w-full max-w-xs">
                <Button disabled size="lg" className="w-full rounded-full font-bold ai-gradient text-white opacity-80 h-12">
                  Analyzing Response...
                </Button>
                <Progress value={66} className="h-2 w-full">
                  <ProgressTrack className="h-1.5">
                    <ProgressIndicator className="bg-[#8B5CF6]" />
                  </ProgressTrack>
                </Progress>
                <p className="text-xs tracking-tight text-muted-foreground text-center">
                  Our AI is processing your tone, confidence, and keyword matching.
                  <br/>This takes just a moment.
                </p>
                {/* Simulated auto-advance to done */}
                <Button variant="link" size="sm" onClick={() => setState("done")} className="text-xs text-muted-foreground hover:text-foreground">
                  (Simulate complete)
                </Button>
              </div>
            )}

            {state === "done" && (
              <div className="flex flex-col items-center w-full max-w-xs gap-3">
                <div className="flex items-center gap-2 text-emerald-600 mb-2">
                  <CheckCircle2 className="size-5" />
                  <span className="font-semibold text-sm">Response Recorded</span>
                </div>
                <Button onClick={handleNext} size="lg" className="w-full rounded-full font-bold brand-gradient text-white shadow-lg shadow-indigo-500/20 gap-2 h-12 hover:opacity-90 transition-opacity">
                  Next Question <ChevronRight className="size-5" />
                </Button>
                <Button onClick={handleRetake} variant="ghost" size="sm" className="w-full rounded-full gap-2 text-xs">
                  <RotateCcw className="size-3.5" /> Retake Answer
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Right: Question context */}
        <div className="flex flex-col gap-6 max-w-2xl w-full">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-foreground">Question {interviewMeta.currentQuestion} of {interviewMeta.totalQuestions}</span>
              <span className="text-muted-foreground">{(interviewMeta.currentQuestion / interviewMeta.totalQuestions) * 100}%</span>
            </div>
            <div className="flex gap-1.5">
              {Array.from({ length: interviewMeta.totalQuestions }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full ${
                    i < interviewMeta.currentQuestion - 1
                      ? "bg-[#10B981]"
                      : i === interviewMeta.currentQuestion - 1
                      ? "bg-[#4F46E5]"
                      : "bg-border"
                  }`}
                />
              ))}
            </div>
          </div>

          <Card className="card-shadow border-border/60 bg-white">
            <CardContent className="p-6 md:p-8 space-y-6">
              <div className="flex justify-between items-start gap-4">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs tracking-tight font-bold bg-[#EEF2FF] text-[#3730A3] uppercase tracking-wider">
                  {q.category}
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs tracking-tight font-medium bg-muted text-muted-foreground">
                  <Clock className="size-3" /> {interviewMeta.answerTimeMinutes} min
                </span>
              </div>

              <h2 className="text-2xl font-bold text-foreground leading-tight">{q.text}</h2>

              {/* AI Tip */}
              <div className="mt-8 p-4 rounded-xl bg-[#EDE9FE] border border-violet-200/50">
                <div className="flex items-center gap-2 mb-1.5">
                  <Sparkles className="size-4 text-violet-600" />
                  <span className="text-xs font-bold text-[#5B21B6]">AI Interview Coach</span>
                </div>
                <p className="text-sm text-[#4C1D95] leading-relaxed">
                  {q.tip}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Play,
  Square,
  RotateCcw,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Timer,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Loader2,
  AlertCircle,
  ArrowRight,
  Volume2,
  Keyboard,
  Edit3,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress, ProgressTrack, ProgressIndicator } from "@/components/ui/progress";
import CameraBox from "@/components/interview/CameraBox";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { dispatchNotificationsUpdated } from "@/lib/use-unread-count";

type InterviewQuestion = {
  question?: string;
  text?: string;
  category?: string;
  [key: string]: unknown;
};

type InterviewData = {
  id: string;
  application_id: string;
  questions: (string | InterviewQuestion)[];
  completed_at: string | null;
  [key: string]: unknown;
};

type ProctorFlag = {
  type: string;
  timestamp: string;
  details?: string;
};

type AppState = "idle" | "recording" | "analyzing" | "done";

function isTechnicalOrCoding(q: string | InterviewQuestion | undefined): boolean {
  if (!q) return false;
  if (typeof q === "object") {
    const cat = (q.category || "").toLowerCase();
    if (["technical", "coding", "problem_solving", "dsa", "system_design"].includes(cat)) {
      return true;
    }
    const text = (q.question || q.text || "").toLowerCase();
    if (/(code|coding|algorithm|data structure|complexity|function|implement|system design|sql|query|api|debug)/i.test(text)) {
      return true;
    }
  } else if (typeof q === "string") {
    if (/(code|coding|algorithm|data structure|complexity|function|implement|system design|sql|query|api|debug)/i.test(q)) {
      return true;
    }
  }
  return false;
}

function getQuestionDuration(q: string | InterviewQuestion | undefined): number {
  // Requirement 2:
  // Descriptive questions: maximum 3 mins (180s)
  // Technical / Coding questions: maximum 10 mins (600s)
  return isTechnicalOrCoding(q) ? 600 : 180;
}

function formatMinutesSeconds(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function InterviewPage() {
  const params = useParams();
  const applicationId = params?.id as string;
  const { user } = useAuth();

  const [interview, setInterview] = useState<InterviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [state, setState] = useState<AppState>("idle");
  const [recordedTranscripts, setRecordedTranscripts] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Anti-cheating & Termination state (Requirement 1)
  const [isTerminated, setIsTerminated] = useState(false);
  const [terminationReason, setTerminationReason] = useState<string | null>(null);
  const [proctorFlags, setProctorFlags] = useState<ProctorFlag[]>([]);
  const flagsRef = useRef<ProctorFlag[]>([]);

  // Question Timer state (Requirement 2)
  const [timeLeft, setTimeLeft] = useState<number>(180);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const activeStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!applicationId) return;

    const loadInterview = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getApplicationInterview(applicationId);
        setInterview(data);
        if (data.completed_at) {
          setIsCompleted(true);
        }
      } catch (err: unknown) {
        console.error("[Interview] Load error:", err);
        setError(err instanceof Error ? err.message : "Failed to load interview. It may not be scheduled yet.");
      } finally {
        setLoading(false);
      }
    };

    loadInterview();
  }, [applicationId]);

  // TTS implementation
  const readAloud = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const voice =
      voices.find((v) => v.lang.startsWith("en-") && (v.name.includes("Google") || v.name.includes("Natural"))) ||
      voices.find((v) => v.lang.startsWith("en-"));
    if (voice) {
      utterance.voice = voice;
    }
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (interview?.questions && interview.questions[currentQuestionIndex]) {
      const q = interview.questions[currentQuestionIndex];
      const text = typeof q === "string" ? q : q.question || q.text;
      if (text) {
        setTimeout(() => readAloud(text), 500);
      }
    }
  }, [currentQuestionIndex, interview]);

  // Reset timer on question change
  useEffect(() => {
    if (!interview?.questions) return;
    const q = interview.questions[currentQuestionIndex];
    const duration = getQuestionDuration(q);
    setTimeLeft(duration);
  }, [currentQuestionIndex, interview]);

  // Force-submit on cheating termination
  const handleTerminateInterview = useCallback(
    async (flag: ProctorFlag) => {
      if (isCompleted || isTerminated) return;

      // Stop recorder and microphone if running
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        try {
          mediaRecorderRef.current.stop();
        } catch {
          // ignore
        }
      }
      if (activeStreamRef.current) {
        activeStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }

      flagsRef.current = [...flagsRef.current, flag];
      setProctorFlags(flagsRef.current);
      setIsTerminated(true);
      setTerminationReason(flag.details || "Anti-cheating violation detected.");

      // Automatically finalize and submit interview with current transcript & violation flags
      if (interview) {
        try {
          setSubmitting(true);
          const fullTranscript = interview.questions
            .map((q: string | InterviewQuestion, i: number) => {
              const qText = typeof q === "string" ? q : q.question || q.text || `Question ${i + 1}`;
              const ans = recordedTranscripts[i] || "[Session terminated early due to anti-cheating violation]";
              return `Question ${i + 1}: ${qText}\nAnswer: ${ans}`;
            })
            .join("\n\n");

          await api.submitInterview(interview.id, {
            transcript: fullTranscript,
            proctor_flags: flagsRef.current,
          });
          dispatchNotificationsUpdated();
        } catch (e) {
          console.error("Auto submit on termination error:", e);
        } finally {
          setSubmitting(false);
        }
      }
    },
    [interview, isCompleted, isTerminated, recordedTranscripts]
  );

  // ── Anti-Cheating Event Handlers (Requirement 1: NO TAB SWITCHING ALLOWED) ──
  useEffect(() => {
    if (loading || isCompleted || isTerminated || !interview) return;

    // 1. Tab visibility change (Tab switch / Browser minimize)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        const flag: ProctorFlag = {
          type: "tab_switch",
          timestamp: new Date().toISOString(),
          details: "Candidate switched tab or minimized browser window during AI interview.",
        };
        handleTerminateInterview(flag);
      }
    };

    // 2. Window blur (lost focus / Alt-Tab)
    const handleBlur = () => {
      if (document.visibilityState === "hidden") return; // Handled by visibilitychange
      const flag: ProctorFlag = {
        type: "window_blur",
        timestamp: new Date().toISOString(),
        details: "Browser window lost focus (e.g. Alt+Tab or switched to external application).",
      };
      handleTerminateInterview(flag);
    };

    // 3. DevTools keyboard shortcut blocking
    const handleKeyDown = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;
      if (e.key === "F12" || (ctrl && shift && ["I", "i", "J", "j", "C", "c"].includes(e.key))) {
        e.preventDefault();
        const flag: ProctorFlag = {
          type: "devtools_shortcut",
          timestamp: new Date().toISOString(),
          details: `Blocked keyboard shortcut: ${e.key} (Inspect / DevTools).`,
        };
        handleTerminateInterview(flag);
      }
    };

    // 4. Right click context menu block
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      const flag: ProctorFlag = {
        type: "right_click",
        timestamp: new Date().toISOString(),
        details: "Candidate attempted to open right-click context menu.",
      };
      flagsRef.current = [...flagsRef.current, flag];
      setProctorFlags(flagsRef.current);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("contextmenu", handleContextMenu);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [loading, isCompleted, isTerminated, interview, handleTerminateInterview]);

  // ── Question Countdown Timer (Requirement 2) ──────────────────────────────
  useEffect(() => {
    if (loading || isCompleted || isTerminated || state === "analyzing") return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Timer reached 0: Auto advance
          handleTimeExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, isCompleted, isTerminated, state, currentQuestionIndex]);

  const handleTimeExpired = () => {
    // If currently recording, stop
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
    }
    // Auto advance
    advanceToNextQuestion(true);
  };

  const advanceToNextQuestion = async (auto = false) => {
    if (!interview?.questions) return;
    const total = interview.questions.length;
    if (currentQuestionIndex < total - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setState("idle");
    } else {
      // Last question reached: Submit interview
      try {
        setSubmitting(true);
        const fullTranscript = interview.questions
          .map((q: string | InterviewQuestion, i: number) => {
            const qText = typeof q === "string" ? q : q.question || q.text || `Question ${i + 1}`;
            const ans = recordedTranscripts[i] || (auto ? "[Auto-submitted on time limit]" : "No response recorded.");
            return `Question ${i + 1}: ${qText}\nAnswer: ${ans}`;
          })
          .join("\n\n");

        await api.submitInterview(interview.id, {
          transcript: fullTranscript,
          proctor_flags: flagsRef.current,
        });
        setIsCompleted(true);
        dispatchNotificationsUpdated();
      } catch (err: unknown) {
        console.error("[Submit Interview] Error:", err);
        alert(err instanceof Error ? err.message : "Failed to submit interview.");
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleRecord = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      activeStreamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setState("analyzing");
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach((track) => track.stop());

        const formData = new FormData();
        formData.append("file", audioBlob, "recording.webm");

        try {
          const res = await api.transcribeAudio(formData);
          setRecordedTranscripts((prev) => ({
            ...prev,
            [currentQuestionIndex]: res.transcript || "No speech detected.",
          }));
        } catch (err: unknown) {
          console.error("Transcription error:", err);
          setRecordedTranscripts((prev) => ({
            ...prev,
            [currentQuestionIndex]:
              err instanceof Error ? `[Error: ${err.message}]` : "[Error transcribing audio. Please try again.]",
          }));
        } finally {
          setState("done");
        }
      };

      mediaRecorder.start();
      setState("recording");
    } catch (err) {
      console.error("Microphone access error:", err);
      setState("done");
      setRecordedTranscripts((prev) => ({
        ...prev,
        [currentQuestionIndex]: prev[currentQuestionIndex] || "",
      }));
    }
  };

  const handleStop = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  };

  const handleRetake = () => {
    setState("idle");
  };

  const handleTypeInstead = () => {
    setState("done");
    if (!recordedTranscripts[currentQuestionIndex]) {
      setRecordedTranscripts((prev) => ({
        ...prev,
        [currentQuestionIndex]: "",
      }));
    }
  };

  const handleNext = () => {
    advanceToNextQuestion(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="size-8 animate-spin text-[#4F46E5]" />
        <p className="text-sm text-muted-foreground">Preparing AI Video Interview room…</p>
      </div>
    );
  }

  if (error || !interview || !interview.questions || interview.questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <Card className="border-rose-200 bg-rose-50 max-w-lg w-full">
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <AlertCircle className="size-8 text-rose-500" />
            <h2 className="text-base font-bold text-rose-800">Interview Not Found</h2>
            <p className="text-xs text-rose-600">
              {error ?? "No interview has been scheduled for this application yet."}
            </p>
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

  // Anti-Cheating Termination Screen (Requirement 1)
  if (isTerminated) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6 bg-[#FFF1F2]">
        <Card className="max-w-lg w-full border-rose-300 bg-white card-shadow text-center p-8 space-y-6">
          <div className="size-20 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto ring-8 ring-rose-50">
            <ShieldAlert className="size-10 text-rose-600" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-100 text-rose-700">
              <AlertTriangle className="size-3.5" /> Anti-Cheating Violation
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Interview Terminated</h1>
            <p className="text-sm text-rose-700 font-medium leading-relaxed">
              {terminationReason || "Tab switching or window minimization is strictly prohibited during the interview."}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs text-slate-700 space-y-2">
            <p className="font-semibold text-slate-900">Violation Details Recorded:</p>
            <ul className="list-disc list-inside space-y-1 text-slate-600">
              <li>Tab switched or browser window minimized.</li>
              <li>Incident count: {proctorFlags.length || 1} violation(s) recorded</li>
              <li>Timestamp logged: {new Date().toLocaleTimeString()}</li>
              <li>Proctoring flags and partial session forwarded to the recruiter.</li>
            </ul>
          </div>

          <Link href="/applications" className="block">
            <Button className="w-full bg-rose-600 hover:bg-rose-700 text-white font-semibold">
              Return to Applications <ArrowRight className="size-4 ml-2" />
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6 bg-[#F8FAFC]">
        <Card className="max-w-md w-full card-shadow border-border/60 text-center p-8 space-y-6">
          <div className="size-16 rounded-full bg-[#D1FAE5] text-[#065F46] flex items-center justify-center mx-auto">
            <CheckCircle2 className="size-8 text-emerald-600" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-foreground">Interview Completed!</h1>
            <p className="text-xs text-muted-foreground mt-1">
              Your video interview transcript and behavioral cues have been submitted to AI evaluation.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#EDE9FE] border border-violet-200 text-left space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-violet-600" />
              <span className="text-xs font-bold text-[#5B21B6]">AI Processing in Progress</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Our AI analysis model is generating your candidate scorecard and sentiment evaluation.
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

  const questions = interview.questions;
  const total = questions.length;
  const currentQ = questions[currentQuestionIndex];
  const isTechnical = isTechnicalOrCoding(currentQ);
  const maxQuestionTime = getQuestionDuration(currentQ);

  const timerIsWarning = timeLeft <= 60 && timeLeft > 20;
  const timerIsUrgent = timeLeft <= 20;

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC]">
      {/* Top Warning Alert Banner for Proctoring */}
      <div className="bg-rose-50 border-b border-rose-200 px-4 py-1.5 flex items-center justify-center gap-2 text-[11px] font-semibold text-rose-700">
        <ShieldAlert className="size-3.5 text-rose-600 animate-pulse" />
        Strict Proctoring Active: Tab switching or minimizing this browser window will immediately terminate your interview!
      </div>

      {/* Top bar */}
      <div className="h-14 border-b border-border bg-white px-8 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-sm font-bold text-foreground">AI Video Interview Assessment</h1>
        </div>
        <div className="flex items-center gap-4 md:gap-6">
          {/* Question countdown timer badge */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold font-mono transition-colors ${
              timerIsUrgent
                ? "bg-rose-100 text-rose-700 border border-rose-300 animate-pulse"
                : timerIsWarning
                ? "bg-amber-100 text-amber-800 border border-amber-300"
                : "bg-indigo-50 text-indigo-700 border border-indigo-200"
            }`}
          >
            <Timer className="size-3.5" />
            <span>Time Left: {formatMinutesSeconds(timeLeft)}</span>
            <span className="text-[10px] font-normal opacity-75">
              ({Math.floor(maxQuestionTime / 60)}m max)
            </span>
          </div>

          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs tracking-tight font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
            <ShieldCheck className="size-3.5" /> Proctor Active
          </span>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-sm font-semibold font-mono">
            <Clock className="size-3.5 text-muted-foreground" /> Question {currentQuestionIndex + 1} of {total}
          </div>
        </div>
      </div>

      {/* Main content split */}
      <div className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 min-h-0 overflow-y-auto">
        {/* Left: Video & Controls */}
        <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full">
          <CameraBox state={state === "done" ? "idle" : state} name={user?.full_name ?? "You"} />

          {/* Controls */}
          <div className="flex flex-col items-center justify-center gap-4 bg-white p-6 rounded-2xl border border-border card-shadow">
            {state === "idle" && (
              <>
                <Button
                  onClick={handleRecord}
                  size="lg"
                  className="w-full max-w-xs bg-[#F43F5E] hover:bg-[#E11D48] text-white rounded-full font-bold shadow-lg shadow-rose-500/20 gap-2 h-12"
                >
                  <Play className="size-5 fill-white" /> Start Recording
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleTypeInstead}
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground hover:text-foreground gap-1.5"
                  >
                    <Keyboard className="size-3.5" /> Type answer manually instead
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Speak clearly into your microphone, or choose to type your response.
                </p>
              </>
            )}

            {state === "recording" && (
              <>
                <div className="flex items-center gap-3">
                  <div className="size-3 rounded-full bg-[#F43F5E] animate-pulse" />
                  <span className="font-mono text-xl font-bold text-[#F43F5E]">Recording…</span>
                </div>
                <Button
                  onClick={handleStop}
                  size="lg"
                  variant="outline"
                  className="w-full max-w-xs rounded-full font-bold border-border hover:bg-rose-50 hover:text-[#E11D48] hover:border-rose-200 gap-2 h-12"
                >
                  <Square className="size-5 fill-current" /> Stop Recording
                </Button>
              </>
            )}

            {state === "analyzing" && (
              <div className="flex flex-col items-center gap-4 w-full max-w-xs">
                <Button disabled size="lg" className="w-full rounded-full font-bold ai-gradient text-white opacity-80 h-12">
                  <Loader2 className="size-4 animate-spin mr-2" /> Processing Audio via Whisper AI...
                </Button>
                <Progress value={75} className="h-2 w-full">
                  <ProgressTrack className="h-1.5">
                    <ProgressIndicator className="bg-[#8B5CF6]" />
                  </ProgressTrack>
                </Progress>
                <p className="text-xs tracking-tight text-muted-foreground text-center">
                  Extracting transcript & audio signals for evaluation.
                </p>
              </div>
            )}

            {state === "done" && (
              <div className="flex flex-col items-center w-full max-w-sm gap-3">
                <div className="flex items-center gap-2 text-emerald-600 mb-1">
                  <CheckCircle2 className="size-4" />
                  <span className="font-semibold text-xs uppercase tracking-wide">Candidate Response</span>
                </div>

                {/* Editable Transcript preview */}
                <div className="w-full text-left bg-gray-50/80 p-3 rounded-xl border border-gray-200/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-semibold text-gray-600 flex items-center gap-1">
                      <Edit3 className="size-3 text-indigo-500" /> Answer Transcript (Editable)
                    </p>
                    <span className="text-[10px] text-muted-foreground">Review before next</span>
                  </div>
                  <textarea
                    rows={4}
                    value={recordedTranscripts[currentQuestionIndex] ?? ""}
                    onChange={(e) =>
                      setRecordedTranscripts((prev) => ({
                        ...prev,
                        [currentQuestionIndex]: e.target.value,
                      }))
                    }
                    placeholder="Type or refine your response to this interview question..."
                    className="w-full bg-white p-2.5 rounded-lg border border-gray-200 text-xs text-gray-800 leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <Button
                  onClick={handleNext}
                  disabled={submitting}
                  size="lg"
                  className="w-full rounded-full font-bold brand-gradient text-white shadow-lg shadow-indigo-500/20 gap-2 h-11 hover:opacity-90 transition-opacity mt-1"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Submitting to AI...
                    </>
                  ) : currentQuestionIndex < total - 1 ? (
                    <>
                      Next Question <ChevronRight className="size-4" />
                    </>
                  ) : (
                    <>
                      Finish & Submit Interview <CheckCircle2 className="size-4" />
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleRetake}
                  disabled={submitting}
                  variant="ghost"
                  size="sm"
                  className="w-full rounded-full gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="size-3" /> Record with Mic Again
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Right: Question context */}
        <div className="flex flex-col gap-6 max-w-2xl w-full">
          {/* Progress & Question Time */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-foreground">
                Question {currentQuestionIndex + 1} of {total}
              </span>
              <span className="text-muted-foreground">
                {Math.round(((currentQuestionIndex + 1) / total) * 100)}%
              </span>
            </div>
            <div className="flex gap-1.5">
              {Array.from({ length: total }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full ${
                    i < currentQuestionIndex
                      ? "bg-[#10B981]"
                      : i === currentQuestionIndex
                      ? "bg-[#4F46E5]"
                      : "bg-border"
                  }`}
                />
              ))}
            </div>
          </div>

          <Card className="card-shadow border-border/60 bg-white">
            <CardContent className="p-6 md:p-8 space-y-6">
              <div className="flex flex-wrap justify-between items-start gap-4">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs tracking-tight font-bold bg-[#EEF2FF] text-[#3730A3] uppercase tracking-wider">
                  {isTechnical ? "Technical / Coding Question" : "Descriptive / Behavioral Question"}
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs tracking-tight font-medium bg-muted text-muted-foreground">
                  <Clock className="size-3" /> Max {isTechnical ? "10 mins" : "3 mins"}
                </span>
              </div>

              <h2 className="text-2xl font-bold text-foreground leading-tight">
                {typeof currentQ === "string" ? currentQ : currentQ.question || currentQ.text || "Interview Question"}
              </h2>

              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-xs text-indigo-600 border-indigo-200 hover:bg-indigo-50 mt-2"
                onClick={() => {
                  const text = typeof currentQ === "string" ? currentQ : currentQ.question || currentQ.text;
                  if (text) readAloud(text);
                }}
              >
                <Volume2 className="size-3.5" /> Read Aloud
              </Button>

              {/* AI Tip */}
              <div className="mt-8 p-4 rounded-xl bg-[#EDE9FE] border border-violet-200/50">
                <div className="flex items-center gap-2 mb-1.5">
                  <Sparkles className="size-4 text-violet-600" />
                  <span className="text-xs font-bold text-[#5B21B6]">AI Guidance</span>
                </div>
                <p className="text-sm text-[#4C1D95] leading-relaxed">
                  {isTechnical
                    ? "Explain your algorithm, time/space complexity, edge cases, and architectural trade-offs systematically."
                    : "Structure your answer using the STAR method: Situation, Task, Action, and Result with quantifiable outcomes."}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Play,
  Square,
  RotateCcw,
  ShieldCheck,
  Clock,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Loader2,
  AlertCircle,
  Trophy,
  ArrowRight,
  Volume2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress, ProgressTrack, ProgressIndicator } from "@/components/ui/progress";
import CameraBox from "@/components/interview/CameraBox";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";

type AppState = "idle" | "recording" | "analyzing" | "done";

export default function InterviewPage() {
  const router = useRouter();
  const params = useParams();
  const applicationId = params?.id as string;
  const { user } = useAuth();

  const [interview, setInterview] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [state, setState] = useState<AppState>("idle");
  const [recordedTranscripts, setRecordedTranscripts] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

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
      } catch (err: any) {
        console.error("[Interview] Load error:", err);
        setError(err.message || "Failed to load interview. It may not be scheduled yet.");
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
    // Try to find a good English voice
    const voice = voices.find(v => v.lang.startsWith("en-") && (v.name.includes("Google") || v.name.includes("Natural"))) || voices.find(v => v.lang.startsWith("en-"));
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
        // slight delay to ensure smooth transition
        setTimeout(() => readAloud(text), 500);
      }
    }
  }, [currentQuestionIndex, interview]);

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

  const handleRecord = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
        } catch (err: any) {
          console.error("Transcription error:", err);
          setRecordedTranscripts((prev) => ({
            ...prev,
            [currentQuestionIndex]: "[Error transcribing audio. Please try again.]",
          }));
        } finally {
          setState("done");
        }
      };

      mediaRecorder.start();
      setState("recording");
    } catch (err) {
      console.error("Microphone access error:", err);
      alert("Microphone access is required to record your answer.");
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

  const handleNext = async () => {
    if (currentQuestionIndex < total - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setState("idle");
    } else {
      // Final submission
      try {
        setSubmitting(true);
        const fullTranscript = questions
          .map((qText: string, i: number) => {
            const ans = recordedTranscripts[i] || "No response recorded.";
            return `Question ${i + 1}: ${qText}\nAnswer: ${ans}`;
          })
          .join("\n\n");

        await api.submitInterview(interview.id, {
          transcript: fullTranscript,
        });
        setIsCompleted(true);
      } catch (err: any) {
        console.error("[Submit Interview] Error:", err);
        alert(err.message || "Failed to submit interview.");
      } finally {
        setSubmitting(false);
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC]">
      {/* Top bar */}
      <div className="h-14 border-b border-border bg-white px-8 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-sm font-bold text-foreground">AI Video Interview Assessment</h1>
        </div>
        <div className="flex items-center gap-6">
          <span className="inline-flex items-center gap-1.5 text-xs tracking-tight font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
            <ShieldCheck className="size-3.5" /> Proctoring Active
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
                <p className="text-xs text-muted-foreground">Take a deep breath. Speak clearly into your microphone.</p>
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
              <div className="flex flex-col items-center w-full max-w-xs gap-3">
                <div className="flex items-center gap-2 text-emerald-600 mb-2">
                  <CheckCircle2 className="size-5" />
                  <span className="font-semibold text-sm">Response Transcribed</span>
                </div>
                
                {/* Transcript preview */}
                <div className="w-full text-left bg-gray-50 p-3 rounded-lg border text-sm max-h-32 overflow-y-auto mb-2 text-gray-700">
                  <p className="text-xs font-semibold text-gray-500 mb-1">Transcript:</p>
                  "{recordedTranscripts[currentQuestionIndex]}"
                </div>

                <Button
                  onClick={handleNext}
                  disabled={submitting}
                  size="lg"
                  className="w-full rounded-full font-bold brand-gradient text-white shadow-lg shadow-indigo-500/20 gap-2 h-12 hover:opacity-90 transition-opacity"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Submitting...
                    </>
                  ) : currentQuestionIndex < total - 1 ? (
                    <>
                      Next Question <ChevronRight className="size-5" />
                    </>
                  ) : (
                    <>
                      Finish & Submit <CheckCircle2 className="size-5" />
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleRetake}
                  disabled={submitting}
                  variant="ghost"
                  size="sm"
                  className="w-full rounded-full gap-2 text-xs"
                >
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
              <div className="flex justify-between items-start gap-4">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs tracking-tight font-bold bg-[#EEF2FF] text-[#3730A3] uppercase tracking-wider">
                  Technical & Behavioral
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs tracking-tight font-medium bg-muted text-muted-foreground">
                  <Clock className="size-3" /> 2 min recommended
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
                  <span className="text-xs font-bold text-[#5B21B6]">AI Tip</span>
                </div>
                <p className="text-sm text-[#4C1D95] leading-relaxed">
                  Structure your answer using the STAR method: Situation, Task, Action, Result. Emphasize specific technical tools and outcomes.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

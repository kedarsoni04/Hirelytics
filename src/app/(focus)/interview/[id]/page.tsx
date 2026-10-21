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
  Mic,
  Send,
  Info,
  UserCheck,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import CameraBox from "@/components/interview/CameraBox";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { dispatchNotificationsUpdated } from "@/lib/use-unread-count";
import { useProctor } from "@/lib/useProctor";
import ProctorWarningModal from "@/components/assessment/ProctorWarningModal";

type InterviewQuestion = {
  id?: string | number;
  question?: string;
  text?: string;
  category?: string;
  is_follow_up?: boolean;
  parent_id?: string | number | null;
  [key: string]: unknown;
};

type InterviewData = {
  id: string;
  application_id: string;
  questions: (string | InterviewQuestion)[];
  completed_at: string | null;
  [key: string]: unknown;
};

type IntegrityEvent = {
  type: string;
  timestamp: string;
};

function normalizeQuestion(q: string | InterviewQuestion | undefined, fallbackIndex: number): InterviewQuestion {
  if (!q) {
    return {
      id: fallbackIndex + 1,
      question: `Question ${fallbackIndex + 1}`,
      category: "general",
      is_follow_up: false,
    };
  }
  if (typeof q === "string") {
    return {
      id: fallbackIndex + 1,
      question: q,
      category: "general",
      is_follow_up: false,
    };
  }
  return {
    id: q.id ?? fallbackIndex + 1,
    question: q.question || q.text || `Question ${fallbackIndex + 1}`,
    category: q.category || "general",
    is_follow_up: Boolean(q.is_follow_up),
    parent_id: q.parent_id,
  };
}

function isTechnicalOrCoding(q: InterviewQuestion | undefined): boolean {
  if (!q) return false;
  const cat = (q.category || "").toLowerCase();
  if (["technical", "coding", "problem_solving", "dsa", "system_design"].includes(cat)) {
    return true;
  }
  const text = (q.question || "").toLowerCase();
  return /(code|coding|algorithm|data structure|complexity|function|implement|system design|sql|query|api|debug)/i.test(text);
}

function getQuestionDuration(q: InterviewQuestion | undefined): number {
  return isTechnicalOrCoding(q) ? 600 : 180;
}

function formatMinutesSeconds(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const MAX_PROCTOR_VIOLATIONS = 3;

export default function InterviewPage() {
  const params = useParams();
  const applicationId = params?.id as string;
  const { user } = useAuth();

  const [interview, setInterview] = useState<InterviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  // Consent Screen State
  const [hasConsented, setHasConsented] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);

  // Dynamic Question Progression State
  const [currentQ, setCurrentQ] = useState<InterviewQuestion | null>(null);
  const [mainQuestionNumber, setMainQuestionNumber] = useState(1);
  const [totalMainQuestions, setTotalMainQuestions] = useState(1);

  // Interaction & Mode State
  const [inputMode, setInputMode] = useState<"voice" | "type">("voice");
  const [voiceState, setVoiceState] = useState<"idle" | "recording" | "recorded" | "analyzing">("idle");
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [reRecordUsed, setReRecordUsed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Timer & Metrics State
  const [timeLeft, setTimeLeft] = useState<number>(180);
  const [currentDurationSec, setCurrentDurationSec] = useState<number>(0);
  const ttsEndedAtRef = useRef<number>(0);
  const questionLoadedAtRef = useRef<number>(0);
  const recordingStartTimeRef = useRef<number>(0);
  const typeStartTimeRef = useRef<number>(0);
  const currentDurationSecRef = useRef<number>(0);
  const currentLatencyMsRef = useRef<number>(0);

  // Compulsory Video Proctoring & Camera State
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  // Integrity event logging (tab switches, focus loss, fullscreen exit, camera disable)
  const integrityEventsRef = useRef<IntegrityEvent[]>([]);

  // ── useProctor Anti-Cheating ──────────────────────────────────────────────
  // Ref so the force-submit callback can always reach the latest handleSubmitAnswer
  const forceSubmitRef = useRef<(() => void) | null>(null);

  const {
    proctorFlags,
    violationCount,
    showWarning,
    lastViolation,
    dismissWarning,
  } = useProctor({
    maxViolations: MAX_PROCTOR_VIOLATIONS,
    enabled: hasConsented && !isCompleted,
    trackClipboard: true,
    blockContextMenu: true,
    blockDevTools: true,
    onForceSubmit: () => {
      if (forceSubmitRef.current) forceSubmitRef.current();
    },
  });

  // Refs for media recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const activeStreamRef = useRef<MediaStream | null>(null);

  // Load interview data
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
          return;
        }

        const rawQuestions = (data.questions || []) as (string | InterviewQuestion)[];
        if (rawQuestions.length > 0) {
          const first = normalizeQuestion(rawQuestions[0], 0);
          setCurrentQ(first);

          const mainCount = rawQuestions.filter((q) => {
            if (typeof q === "string") return true;
            return !q.is_follow_up;
          }).length;
          setTotalMainQuestions(Math.max(1, mainCount));
          setMainQuestionNumber(1);
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
  const readAloud = useCallback((text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const voice =
        voices.find((v) => v.lang.startsWith("en-") && (v.name.includes("Google") || v.name.includes("Natural"))) ||
        voices.find((v) => v.lang.startsWith("en-"));
      if (voice) {
        utterance.voice = voice;
      }

      utterance.onend = () => {
        ttsEndedAtRef.current = Date.now();
      };
      utterance.onerror = () => {
        ttsEndedAtRef.current = Date.now();
      };

      window.speechSynthesis.speak(utterance);
    } catch {
      ttsEndedAtRef.current = Date.now();
    }
  }, []);

  // When consent is given or current question changes, read aloud and reset timer
  useEffect(() => {
    if (!hasConsented || !currentQ) return;

    questionLoadedAtRef.current = Date.now();
    ttsEndedAtRef.current = Date.now();
    const duration = getQuestionDuration(currentQ);
    setTimeLeft(duration);

    const timer = setTimeout(() => {
      if (currentQ.question) {
        readAloud(currentQ.question);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [currentQ, hasConsented, readAloud]);

  // Track integrity events (visibilitychange, blur, fullscreen exit)
  useEffect(() => {
    if (loading || isCompleted || !hasConsented) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        integrityEventsRef.current.push({
          type: "tab_switch",
          timestamp: new Date().toISOString(),
        });
      }
    };

    const handleBlur = () => {
      if (document.visibilityState === "hidden") return;
      integrityEventsRef.current.push({
        type: "window_blur",
        timestamp: new Date().toISOString(),
      });
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        integrityEventsRef.current.push({
          type: "fullscreen_exit",
          timestamp: new Date().toISOString(),
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [loading, isCompleted, hasConsented]);

  // Countdown timer per question
  useEffect(() => {
    if (loading || isCompleted || !hasConsented || voiceState === "analyzing" || submitting) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Timer reached 0: Stop recording if running
          if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            try {
              mediaRecorderRef.current.stop();
            } catch {
              // ignore
            }
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, isCompleted, hasConsented, voiceState, submitting]);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Initialize and enforce compulsory camera video for anti-cheat proctoring
  const initCamera = useCallback(async () => {
    try {
      setCameraError(null);
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        throw new Error("Webcam is not supported or permitted in this browser.");
      }

      // If already active, reuse existing stream
      if (cameraStreamRef.current && cameraStreamRef.current.active) {
        const hasLiveTrack = cameraStreamRef.current.getVideoTracks().some((t) => t.readyState === "live");
        if (hasLiveTrack) {
          setCameraActive(true);
          return cameraStreamRef.current;
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        audio: true,
      });

      setCameraStream(stream);
      cameraStreamRef.current = stream;
      setCameraActive(true);

      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          setCameraActive(false);
          integrityEventsRef.current.push({
            type: "camera_disabled",
            timestamp: new Date().toISOString(),
          });
        };
        videoTrack.onmute = () => {
          setCameraActive(false);
          integrityEventsRef.current.push({
            type: "camera_muted",
            timestamp: new Date().toISOString(),
          });
        };
        videoTrack.onunmute = () => {
          setCameraActive(true);
        };
      }
      return stream;
    } catch (err: unknown) {
      console.warn("[Proctoring] Webcam access failed:", err);
      setCameraActive(false);
      const errMsg = err instanceof Error ? err.message : "Camera access denied. Video is mandatory for anti-cheat proctoring.";
      setCameraError(errMsg);
      integrityEventsRef.current.push({
        type: "camera_denied",
        timestamp: new Date().toISOString(),
      });
      return null;
    }
  }, []);

  // Start recording
  const handleStartRecording = async () => {
    try {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }

      // Attempt camera initialization if not yet active
      if (!cameraActive) {
        try {
          await initCamera();
        } catch {
          // continue with audio recording
        }
      }

      // Latency calculation: time from TTS end to recording start
      const latency = Math.max(0, Date.now() - ttsEndedAtRef.current);
      currentLatencyMsRef.current = latency;
      recordingStartTimeRef.current = Date.now();

      // Separate audio capture stream so stopping recording never stops video feed
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      activeStreamRef.current = audioStream;
      const mediaRecorder = new MediaRecorder(audioStream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setRecordedAudioBlob(audioBlob);
        const duration = Math.max(1, Math.round((Date.now() - recordingStartTimeRef.current) / 1000));
        currentDurationSecRef.current = duration;
        setCurrentDurationSec(duration);
        // Only stop audio tracks, preserve candidate webcam video!
        audioStream.getTracks().forEach((track) => track.stop());
        setVoiceState("recorded");
      };

      mediaRecorder.start();
      setVoiceState("recording");
    } catch (err) {
      console.error("Microphone access error:", err);
      alert("Unable to access microphone. You can use the 'Type answer instead' option below.");
      setInputMode("type");
      typeStartTimeRef.current = Date.now();
    }
  };

  // Stop recording
  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.error("Error stopping recorder:", e);
      }
    }
  };

  // Re-record (max 1 per question)
  const handleReRecord = () => {
    if (reRecordUsed) return;
    setReRecordUsed(true);
    setRecordedAudioBlob(null);
    setVoiceState("idle");
  };

  // Switch to type mode
  const handleSwitchToType = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
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
    setInputMode("type");
    typeStartTimeRef.current = Date.now();
    currentLatencyMsRef.current = Math.max(0, Date.now() - ttsEndedAtRef.current);
  };

  // Switch to voice mode
  const handleSwitchToVoice = () => {
    setInputMode("voice");
    setVoiceState("idle");
    setRecordedAudioBlob(null);
  };

  // Submit Answer to POST /interviews/{id}/answer
  const handleSubmitAnswer = async () => {
    if (!interview || !currentQ || submitting) return;

    if (inputMode === "voice" && !recordedAudioBlob) {
      alert("Please record your audio answer before submitting.");
      return;
    }

    if (inputMode === "type" && !typedAnswer.trim()) {
      alert("Please type your response before submitting.");
      return;
    }

    try {
      setSubmitting(true);
      setVoiceState("analyzing");

      const formData = new FormData();
      formData.append("question_id", String(currentQ.id));

      if (inputMode === "voice" && recordedAudioBlob) {
        formData.append("audio", recordedAudioBlob, "recording.webm");
        formData.append("duration_sec", String(currentDurationSecRef.current || 5));
      } else {
        const typeDuration = Math.max(1, Math.round((Date.now() - typeStartTimeRef.current) / 1000));
        formData.append("transcript", typedAnswer.trim());
        formData.append("duration_sec", String(typeDuration));
      }

      formData.append("response_latency_ms", String(currentLatencyMsRef.current || 0));
      // Merge per-question integrity events with proctor flags collected so far
      const combinedEvents = [
        ...integrityEventsRef.current,
        ...proctorFlags.map((f) => ({ type: f.type, timestamp: f.timestamp, details: f.details })),
      ];
      formData.append("integrity_events", JSON.stringify(combinedEvents));

      // Reset per-question integrity events
      integrityEventsRef.current = [];

      // Call /interviews/{id}/answer
      const res = await api.answerInterview(interview.id, formData);

      // Check if interview is completed
      if (res.done === true || !res.next_question) {
        // Call /interviews/{id}/complete
        await api.completeInterview(interview.id);
        dispatchNotificationsUpdated();
        setIsCompleted(true);
        // Stop proctoring once completed
        // (useProctor enabled=false when isCompleted is set)
      } else {
        // Next question received dynamically
        const nextQ = normalizeQuestion(res.next_question, mainQuestionNumber);
        setCurrentQ(nextQ);

        // Progress counts main questions only
        if (!nextQ.is_follow_up) {
          setMainQuestionNumber((prev) => prev + 1);
        }

        // Reset per-question state
        setInputMode("voice");
        setVoiceState("idle");
        setRecordedAudioBlob(null);
        setTypedAnswer("");
        setReRecordUsed(false);
      }
    } catch (err: unknown) {
      console.error("[Answer Submit Error]:", err);
      alert(err instanceof Error ? err.message : "Failed to analyze answer. Please try again.");
      setVoiceState(recordedAudioBlob ? "recorded" : "idle");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Wire force-submit ref for useProctor ──────────────────────────────────
  // We define this AFTER handleSubmitAnswer is declared above, so it's always fresh
  useEffect(() => {
    forceSubmitRef.current = () => {
      if (!submitting && !isCompleted && interview) {
        // Force-complete: stop recording if active, then complete the interview
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
          try { mediaRecorderRef.current.stop(); } catch { /* ignore */ }
        }
        api.completeInterview(interview.id).then(() => {
          dispatchNotificationsUpdated();
          setIsCompleted(true);
        }).catch(console.error);
      }
    };
  }, [submitting, isCompleted, interview]);

  // ── Loading state ──
  if (loading) {
    return (
      <div className="w-full h-full min-h-full flex flex-col items-center justify-center gap-4 p-6 bg-[#F8FAFC]">
        <Loader2 className="size-8 animate-spin text-[#4F46E5]" />
        <p className="text-sm font-medium text-muted-foreground">Preparing AI Interview Room…</p>
      </div>
    );
  }

  // ── Error state ──
  if (error || !interview) {
    return (
      <div className="w-full h-full min-h-full overflow-y-auto flex items-center justify-center p-4 sm:p-6 bg-[#F8FAFC]">
        <Card className="border-rose-200 bg-rose-50 max-w-lg w-full my-auto">
          <CardContent className="flex flex-col items-center gap-3 p-8 sm:p-10 text-center">
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

  // ── Completed state ──
  if (isCompleted) {
    return (
      <div className="w-full h-full min-h-full overflow-y-auto flex items-center justify-center p-4 sm:p-6 bg-[#F8FAFC]">
        <Card className="max-w-md w-full card-shadow border-border/60 text-center p-6 sm:p-8 space-y-5 my-auto bg-white">
          <div className="size-16 rounded-full bg-[#D1FAE5] text-[#065F46] flex items-center justify-center mx-auto">
            <CheckCircle2 className="size-8 text-emerald-600" />
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-foreground">Interview Completed!</h1>
            <p className="text-xs text-muted-foreground">
              Your interview responses and performance signals have been successfully submitted for recruiter review.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#EDE9FE] border border-violet-200 text-left space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-violet-600" />
              <span className="text-xs font-bold text-[#5B21B6]">Evaluation Process Active</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your responses are being processed for technical reasoning, problem-solving, and communication clarity. The hiring team will review all evidence and update your application status.
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

  // ── Consent Screen (Shown before starting interview) ──
  if (!hasConsented) {
    return (
      <div className="w-full h-full min-h-full overflow-y-auto bg-[#F8FAFC]">
        <div className="min-h-full flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
          <Card className="max-w-2xl w-full my-auto card-shadow border-border/60 bg-white p-5 sm:p-7 space-y-5">
            <div className="flex items-center gap-3 border-b border-border/60 pb-4">
              <div className="size-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                <ShieldCheck className="size-6 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-foreground">AI Video Interview Consent & Guidelines</h1>
                <p className="text-xs text-muted-foreground">
                  Please review the terms and evaluation policies before starting your interview session.
                </p>
              </div>
            </div>

            <div className="space-y-2.5 sm:space-y-3 text-xs text-gray-700">
              <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
                <div className="size-5 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 font-bold text-[11px] mt-0.5">
                  1
                </div>
                <div className="space-y-0.5">
                  <p className="font-bold text-gray-900 text-xs">Audio Recording & AI Evaluation</p>
                  <p className="text-muted-foreground leading-relaxed text-[11px] sm:text-xs">
                    Your audio will be recorded, transcribed, and evaluated by automated AI models to assess key technical competencies, analytical reasoning, and core qualifications for this role.
                  </p>
                </div>
              </div>

              <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
                <div className="size-5 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 font-bold text-[11px] mt-0.5">
                  2
                </div>
                <div className="space-y-0.5">
                  <p className="font-bold text-gray-900 text-xs">Delivery Metrics (Informational & Lightly Weighted)</p>
                  <p className="text-muted-foreground leading-relaxed text-[11px] sm:text-xs">
                    Delivery metrics (such as words-per-minute, pauses, and filler words) are provided as supplementary context only. They are informational and lightly weighted compared to the substantive technical content of your answers.
                  </p>
                </div>
              </div>

              <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
                <div className="size-5 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 font-bold text-[11px] mt-0.5">
                  3
                </div>
                <div className="space-y-0.5">
                  <p className="font-bold text-gray-900 text-xs">Human Hiring Decision-Maker</p>
                  <p className="text-muted-foreground leading-relaxed text-[11px] sm:text-xs">
                    AI assessments serve strictly as an assistive evaluation tool. A human recruiter or hiring manager reviews your full interview evidence and makes the final decision on shortlist, offer, or advancement.
                  </p>
                </div>
              </div>

              <div className="p-3 sm:p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200/80 flex items-start gap-3">
                <div className="size-5 rounded-md bg-indigo-600 text-white flex items-center justify-center shrink-0 font-bold text-[11px] mt-0.5">
                  4
                </div>
                <div className="space-y-0.5">
                  <p className="font-bold text-indigo-950 text-xs flex items-center gap-1.5">
                    <ShieldCheck className="size-3.5 text-indigo-600" /> Compulsory Video Camera Proctoring
                  </p>
                  <p className="text-indigo-900/80 leading-relaxed text-[11px] sm:text-xs">
                    Candidate webcam video is mandatory and must remain actively streamed for automated anti-cheat proctoring and identity verification throughout the entire interview session.
                  </p>
                </div>
              </div>

              <div className="p-3 sm:p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-3">
                <Info className="size-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold text-amber-900 text-xs">Integrity Monitoring Notice</p>
                  <p className="text-amber-800/90 leading-relaxed text-[11px] sm:text-xs">
                    Browser visibility changes, window focus losses, and fullscreen exits are recorded as informational signals for recruiter review, not conclusive proof of misconduct. Please remain focused on the interview tab.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-border/60 space-y-3.5">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  id="consent-checkbox"
                  checked={consentChecked}
                  onChange={(e) => setConsentChecked(e.target.checked)}
                  className="size-4 mt-0.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0"
                />
                <span className="text-xs font-semibold text-gray-800 leading-snug">
                  I understand and consent to compulsory webcam video, audio recording, AI transcription and evaluation, and session activity tracking under these terms.
                </span>
              </label>

              <Button
                id="begin-interview-btn"
                disabled={!consentChecked}
                onClick={async () => {
                  try {
                    await initCamera();
                  } catch {
                    // camera optional / fallback
                  }
                  setHasConsented(true);
                }}
                className="w-full brand-gradient text-white font-bold h-10 sm:h-11 text-xs sm:text-sm shadow-md shadow-indigo-500/20 disabled:opacity-50"
              >
                Begin Interview <ChevronRight className="size-4 ml-2" />
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // ── Active Interview Question Screen ──
  const isTechnical = isTechnicalOrCoding(currentQ || undefined);
  const maxQuestionTime = getQuestionDuration(currentQ || undefined);
  const timerIsWarning = timeLeft <= 60 && timeLeft > 20;
  const timerIsUrgent = timeLeft <= 20;

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC]">
      {/* ── Anti-Cheating: Proctor Warning Modal ── */}
      {showWarning && (
        <ProctorWarningModal
          violationCount={violationCount}
          maxViolations={MAX_PROCTOR_VIOLATIONS}
          lastViolation={lastViolation}
          onDismiss={dismissWarning}
          forceSubmitting={violationCount >= MAX_PROCTOR_VIOLATIONS}
        />
      )}
      {/* Top Bar */}
      <div className="h-14 border-b border-border bg-white px-6 md:px-8 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-bold text-foreground">AI Video Interview Assessment</h1>
          {currentQ?.is_follow_up && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
              <Sparkles className="size-3 text-amber-600" /> Follow-up Question
            </span>
          )}
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

          <span
            className={`hidden sm:inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md border ${
              violationCount > 0
                ? "text-amber-700 bg-amber-50 border-amber-200"
                : "text-emerald-600 bg-emerald-50 border-emerald-100"
            }`}
          >
            {violationCount > 0 ? (
              <><ShieldAlert className="size-3.5" /> {violationCount} Violation{violationCount > 1 ? "s" : ""} Flagged</>
            ) : (
              <><ShieldCheck className="size-3.5" /> Proctor Active</>
            )}
          </span>

          {/* Progress counts main questions only */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-sm font-semibold font-mono">
            <Clock className="size-3.5 text-muted-foreground" /> Question {mainQuestionNumber} of {totalMainQuestions}
          </div>
        </div>
      </div>

      {/* Main content grid */}
      <div className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 min-h-0 overflow-y-auto">
        {/* Left Column: Camera Feed & Interaction Controls */}
        <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full">
          <CameraBox
            state={voiceState === "recorded" ? "idle" : voiceState}
            stream={cameraStream}
            cameraOn={cameraActive}
            name={user?.full_name ?? "You"}
            onEnableCamera={initCamera}
            isCompulsory={true}
          />

          {/* Anti-cheat Camera Warning Banner if camera turns off */}
          {!cameraActive && (
            <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              <div className="flex items-center gap-2">
                <ShieldAlert className="size-4 text-rose-600 shrink-0" />
                <span className="font-medium">
                  Camera feed required: Candidate video is compulsory for anti-cheat verification.
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={initCamera}
                className="text-[11px] h-7 border-rose-300 text-rose-700 hover:bg-rose-100 shrink-0"
              >
                Turn On Camera
              </Button>
            </div>
          )}

          {/* Controls Card */}
          <div className="flex flex-col items-center justify-center gap-4 bg-white p-6 rounded-2xl border border-border card-shadow">
            {/* Analyzing state banner */}
            {(voiceState === "analyzing" || submitting) ? (
              <div className="flex flex-col items-center gap-3 w-full max-w-xs py-4 text-center">
                <Loader2 className="size-8 animate-spin text-[#4F46E5]" />
                <p className="text-sm font-bold text-gray-900">Analysing your answer...</p>
                <p className="text-xs text-muted-foreground">
                  Evaluating transcript reasoning, delivery pacing, and key competencies.
                </p>
              </div>
            ) : inputMode === "voice" ? (
              // ── Voice Mode Controls ──
              <>
                {voiceState === "idle" && (
                  <div className="flex flex-col items-center gap-3 w-full">
                    <Button
                      id="start-recording-btn"
                      onClick={handleStartRecording}
                      size="lg"
                      className="w-full max-w-xs bg-[#F43F5E] hover:bg-[#E11D48] text-white rounded-full font-bold shadow-lg shadow-rose-500/20 gap-2 h-12"
                    >
                      <Play className="size-5 fill-white" /> Start Recording
                    </Button>

                    <Button
                      onClick={handleSwitchToType}
                      variant="ghost"
                      size="sm"
                      className="text-xs text-muted-foreground hover:text-foreground gap-1.5"
                    >
                      <Keyboard className="size-3.5" /> Type instead (Mic failure or Accessibility)
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      Click start recording and answer naturally. You may re-record once if needed.
                    </p>
                  </div>
                )}

                {voiceState === "recording" && (
                  <div className="flex flex-col items-center gap-4 w-full">
                    <div className="flex items-center gap-3">
                      <div className="size-3 rounded-full bg-[#F43F5E] animate-pulse" />
                      <span className="font-mono text-xl font-bold text-[#F43F5E]">Recording Audio…</span>
                    </div>

                    <Button
                      id="stop-recording-btn"
                      onClick={handleStopRecording}
                      size="lg"
                      variant="outline"
                      className="w-full max-w-xs rounded-full font-bold border-rose-200 bg-rose-50/50 hover:bg-rose-100 hover:text-[#E11D48] gap-2 h-12 text-[#E11D48]"
                    >
                      <Square className="size-5 fill-current" /> Stop Recording
                    </Button>
                    <p className="text-xs text-muted-foreground">Click stop when you have concluded your response.</p>
                  </div>
                )}

                {voiceState === "recorded" && (
                  <div className="flex flex-col items-center gap-3 w-full max-w-sm">
                    <div className="flex items-center gap-2 text-emerald-600 mb-1">
                      <CheckCircle2 className="size-4" />
                      <span className="font-semibold text-xs uppercase tracking-wide">
                        Response Audio Captured ({currentDurationSec}s)
                      </span>
                    </div>

                    <Button
                      id="submit-answer-btn"
                      onClick={handleSubmitAnswer}
                      disabled={submitting}
                      size="lg"
                      className="w-full rounded-full font-bold brand-gradient text-white shadow-lg shadow-indigo-500/20 gap-2 h-11 hover:opacity-90"
                    >
                      <Send className="size-4" /> Submit Answer
                    </Button>

                    <div className="flex items-center justify-between w-full pt-1">
                      <Button
                        id="rerecord-btn"
                        onClick={handleReRecord}
                        disabled={reRecordUsed || submitting}
                        variant="outline"
                        size="sm"
                        className="rounded-full gap-1.5 text-xs text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                      >
                        <RotateCcw className="size-3" />
                        {reRecordUsed ? "Re-record used (Max 1)" : "Re-record Answer"}
                      </Button>

                      <Button
                        onClick={handleSwitchToType}
                        disabled={submitting}
                        variant="ghost"
                        size="sm"
                        className="rounded-full text-xs text-muted-foreground hover:text-foreground"
                      >
                        <Keyboard className="size-3 mr-1" /> Type instead
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              // ── Type Instead Fallback Mode ──
              <div className="flex flex-col gap-3 w-full">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                    <Keyboard className="size-3.5 text-indigo-600" /> Type Answer (Accessibility & Mic Fallback)
                  </span>
                  <Button
                    onClick={handleSwitchToVoice}
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-indigo-600 hover:text-indigo-800 p-0"
                  >
                    <Mic className="size-3.5 mr-1" /> Switch to Voice
                  </Button>
                </div>

                <textarea
                  id="typed-answer-textarea"
                  rows={5}
                  value={typedAnswer}
                  onChange={(e) => setTypedAnswer(e.target.value)}
                  placeholder="Type your response to this interview question here in detail..."
                  className="w-full bg-slate-50 p-3 rounded-xl border border-gray-200 text-xs text-gray-800 leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />

                <Button
                  id="submit-typed-answer-btn"
                  onClick={handleSubmitAnswer}
                  disabled={submitting || !typedAnswer.trim()}
                  className="w-full rounded-full font-bold brand-gradient text-white shadow-lg shadow-indigo-500/20 gap-2 h-11 hover:opacity-90 mt-1"
                >
                  <Send className="size-4" /> Submit Typed Answer
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Question Content & Guidance */}
        <div className="flex flex-col gap-6 max-w-2xl w-full">
          {/* Progress Tracker Bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-foreground">
                Question {mainQuestionNumber} of {totalMainQuestions}
                {currentQ?.is_follow_up && " (Follow-up)"}
              </span>
              <span className="text-muted-foreground">
                {Math.round((mainQuestionNumber / totalMainQuestions) * 100)}%
              </span>
            </div>
            <div className="flex gap-1.5">
              {Array.from({ length: totalMainQuestions }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full ${
                    i + 1 < mainQuestionNumber
                      ? "bg-[#10B981]"
                      : i + 1 === mainQuestionNumber
                      ? "bg-[#4F46E5]"
                      : "bg-border"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Question Card */}
          <Card className="card-shadow border-border/60 bg-white">
            <CardContent className="p-6 md:p-8 space-y-6">
              <div className="flex flex-wrap justify-between items-start gap-4">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-[#EEF2FF] text-[#3730A3] uppercase tracking-wider">
                    {isTechnical ? "Technical / Problem Solving" : "Descriptive / Behavioral"}
                  </span>
                  {currentQ?.is_follow_up && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                      Follow-up
                    </span>
                  )}
                </div>

                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-muted text-muted-foreground">
                  <Clock className="size-3" /> Max {isTechnical ? "10 mins" : "3 mins"}
                </span>
              </div>

              <h2 className="text-2xl font-bold text-foreground leading-snug">
                {currentQ?.question || "Interview Question"}
              </h2>

              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-xs text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                onClick={() => {
                  if (currentQ?.question) readAloud(currentQ.question);
                }}
              >
                <Volume2 className="size-3.5" /> Re-read Question Aloud
              </Button>

              {/* AI Guidance Box */}
              <div className="mt-8 p-4 rounded-xl bg-[#EDE9FE] border border-violet-200/50">
                <div className="flex items-center gap-2 mb-1.5">
                  <Sparkles className="size-4 text-violet-600" />
                  <span className="text-xs font-bold text-[#5B21B6]">Response Guidance</span>
                </div>
                <p className="text-sm text-[#4C1D95] leading-relaxed">
                  {isTechnical
                    ? "Clearly explain your solution design, trade-offs, algorithms, and complexity. If asked a follow-up, provide specific architectural details or real-world examples."
                    : "Structure your response with clear context, specific actions taken, and measurable results achieved."}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
